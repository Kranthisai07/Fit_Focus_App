"""
Recipe Recommendation Service - Orchestrates the Multi-Agent System
Combines Profile RAG Agent and Recipe Generator Agent for personalized recommendations
"""
import sys
sys.path.append('/app/backend')

import asyncio
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from models.user import UserProfile
from agents.profile_rag_agent import ProfileRAGAgent
from agents.recipe_generator_agent import RecipeGeneratorAgent
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class RecipeRecommendationService:
    """
    Orchestrates the multi-agent system for personalized recipe recommendations
    """
    
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.recommendations_collection = db.recipe_recommendations
        self.profile_agent = ProfileRAGAgent()
        self.generator_agent = RecipeGeneratorAgent()
        
        # Cache to avoid regenerating similar recommendations
        self.recommendation_cache = {}
    
    async def get_personalized_recommendation(
        self, 
        user: UserProfile, 
        meal_type: str = "dinner",
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """
        Get personalized recipe recommendation using the multi-agent system
        """
        try:
            # Check cache first (unless forced regeneration)
            if not force_regenerate:
                cached_recommendation = await self._get_cached_recommendation(user.id, meal_type)
                if cached_recommendation:
                    return cached_recommendation
            
            # Step 1: Profile RAG Agent analyzes user profile
            logger.info(f"Analyzing profile for user {user.name} for {meal_type}")
            profile_context = self.profile_agent.analyze_user_profile(user, meal_type)
            
            # Step 2: Generate recommendation prompt
            logger.info("Generating AI prompt from profile analysis")
            recommendation_prompt = self.profile_agent.generate_recommendation_prompt(profile_context)
            
            # Step 3: Recipe Generator Agent creates recipe using Gemini
            logger.info("Generating recipe recommendation using Gemini AI")
            recipe_recommendation = await self.generator_agent.generate_recipe(recommendation_prompt)
            
            # Step 4: Enhance recommendation with metadata
            enhanced_recommendation = await self._enhance_recommendation(
                recipe_recommendation, 
                profile_context, 
                user
            )
            
            # Step 5: Save to database
            await self._save_recommendation(user.id, meal_type, enhanced_recommendation, profile_context)
            
            return enhanced_recommendation
            
        except Exception as e:
            logger.error(f"Error generating personalized recommendation: {str(e)}")
            return await self._get_fallback_recommendation(user, meal_type)
    
    async def get_multiple_recommendations(
        self, 
        user: UserProfile, 
        count: int = 3,
        meal_types: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get multiple personalized recommendations for meal planning
        """
        if meal_types is None:
            meal_types = ["breakfast", "lunch", "dinner"]
        
        recommendations = []
        
        for meal_type in meal_types[:count]:
            try:
                recommendation = await self.get_personalized_recommendation(user, meal_type)
                recommendations.append(recommendation)
                
                # Small delay to avoid rate limiting
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"Error generating recommendation for {meal_type}: {str(e)}")
                fallback = await self._get_fallback_recommendation(user, meal_type)
                recommendations.append(fallback)
        
        return recommendations
    
    async def get_recommendation_history(
        self, 
        user_id: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get user's recommendation history
        """
        try:
            cursor = self.recommendations_collection.find(
                {"user_id": user_id}
            ).sort("created_at", -1).limit(limit)
            
            recommendations = []
            async for rec in cursor:
                recommendations.append({
                    "id": rec.get("_id"),
                    "meal_type": rec.get("meal_type"),
                    "title": rec.get("recipe", {}).get("title"),
                    "created_at": rec.get("created_at"),
                    "recipe": rec.get("recipe")
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting recommendation history: {str(e)}")
            return []
    
    async def _get_cached_recommendation(
        self, 
        user_id: str, 
        meal_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get cached recommendation if available and recent (within 24 hours)
        """
        try:
            twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
            
            cached = await self.recommendations_collection.find_one({
                "user_id": user_id,
                "meal_type": meal_type,
                "created_at": {"$gte": twenty_four_hours_ago}
            }, sort=[("created_at", -1)])
            
            if cached:
                return cached.get("recipe")
            
        except Exception as e:
            logger.error(f"Error checking recommendation cache: {str(e)}")
        
        return None
    
    async def _enhance_recommendation(
        self, 
        recipe: Dict[str, Any], 
        profile_context: Dict[str, Any], 
        user: UserProfile
    ) -> Dict[str, Any]:
        """
        Enhance the generated recipe with additional metadata and context
        """
        enhanced = recipe.copy()
        
        # Add personalization metadata
        enhanced["personalization"] = {
            "generated_for": user.name,
            "activity_level": user.activity_level,
            "health_focus": profile_context["user_info"]["health_focus"],
            "customization_reason": self._generate_customization_reason(profile_context)
        }
        
        # Add nutritional score
        enhanced["nutrition_score"] = self._calculate_nutrition_score(recipe, profile_context)
        
        # Add preparation tips based on user profile
        enhanced["preparation_tips"] = self._generate_preparation_tips(profile_context)
        
        # Add ingredient substitutions
        enhanced["substitutions"] = self._suggest_substitutions(recipe, profile_context)
        
        return enhanced
    
    def _generate_customization_reason(self, profile_context: Dict[str, Any]) -> str:
        """Generate explanation of why this recipe was chosen"""
        user_info = profile_context["user_info"]
        preferences = profile_context["dietary_preferences"]
        
        reasons = []
        
        if user_info["activity_level"] in ["active", "very_active"]:
            reasons.append("high protein content to support your active lifestyle")
        
        if user_info["health_focus"] == "weight_loss":
            reasons.append("balanced macronutrients for healthy weight management")
        elif user_info["health_focus"] == "performance":
            reasons.append("optimal nutrition for athletic performance")
        
        if "quick-prep" in preferences["tags"]:
            reasons.append("quick preparation time to fit your busy schedule")
        
        if not reasons:
            reasons.append("balanced nutrition to support your health goals")
        
        return f"This recipe was customized based on {', '.join(reasons)}."
    
    def _calculate_nutrition_score(
        self, 
        recipe: Dict[str, Any], 
        profile_context: Dict[str, Any]
    ) -> int:
        """Calculate a nutrition score based on how well the recipe matches targets"""
        # Simplified scoring algorithm
        score = 85  # Base score
        
        targets = profile_context["nutritional_targets"]
        nutrition = recipe.get("nutrition_per_serving", {})
        
        # Adjust score based on macro targets (simplified)
        if "high-protein" in profile_context["dietary_preferences"]["tags"]:
            protein_value = int(nutrition.get("protein", "0g").replace("g", ""))
            if protein_value >= targets["protein_grams"]:
                score += 10
        
        return min(100, score)  # Cap at 100
    
    def _generate_preparation_tips(self, profile_context: Dict[str, Any]) -> List[str]:
        """Generate preparation tips based on user profile"""
        tips = []
        user_info = profile_context["user_info"]
        preferences = profile_context["dietary_preferences"]
        
        if user_info["activity_level"] in ["active", "very_active"]:
            tips.append("Prepare this meal within 2 hours after your workout for optimal recovery")
        
        if preferences["cooking_complexity"] == "simple":
            tips.append("Prep vegetables in advance to reduce cooking time")
            tips.append("Use pre-cut ingredients to simplify preparation")
        
        if user_info["health_focus"] == "weight_loss":
            tips.append("Use cooking spray instead of oil where possible to reduce calories")
        
        # Default tips
        if not tips:
            tips.extend([
                "Read through all ingredients before starting",
                "Prep all ingredients before cooking for smoother preparation"
            ])
        
        return tips
    
    def _suggest_substitutions(
        self, 
        recipe: Dict[str, Any], 
        profile_context: Dict[str, Any]
    ) -> Dict[str, str]:
        """Suggest ingredient substitutions based on dietary preferences"""
        substitutions = {}
        dietary_tags = profile_context["dietary_preferences"]["tags"]
        
        # Common substitutions based on dietary preferences
        if "low-calorie" in dietary_tags:
            substitutions["regular pasta"] = "zucchini noodles or shirataki noodles"
            substitutions["white rice"] = "cauliflower rice"
        
        if "high-protein" in dietary_tags:
            substitutions["regular flour"] = "protein powder + almond flour mix"
            substitutions["regular milk"] = "protein-enriched almond milk"
        
        return substitutions
    
    async def _save_recommendation(
        self, 
        user_id: str, 
        meal_type: str, 
        recipe: Dict[str, Any], 
        profile_context: Dict[str, Any]
    ):
        """Save recommendation to database"""
        try:
            recommendation_doc = {
                "user_id": user_id,
                "meal_type": meal_type,
                "recipe": recipe,
                "profile_context": profile_context,
                "created_at": datetime.utcnow()
            }
            
            await self.recommendations_collection.insert_one(recommendation_doc)
            
        except Exception as e:
            logger.error(f"Error saving recommendation: {str(e)}")
    
    async def _get_fallback_recommendation(
        self, 
        user: UserProfile, 
        meal_type: str
    ) -> Dict[str, Any]:
        """Return fallback recommendation if AI generation fails"""
        fallback_recipes = {
            "breakfast": {
                "title": "Protein-Rich Oatmeal Bowl",
                "recipe": "A nutritious start to your day with protein and fiber",
                "ingredients": [
                    {"item": "Rolled oats", "quantity": "1/2 cup", "category": "grain"},
                    {"item": "Greek yogurt", "quantity": "1/4 cup", "category": "dairy"},
                    {"item": "Banana", "quantity": "1 medium", "category": "fruit"},
                    {"item": "Almonds", "quantity": "10 pieces", "category": "nuts"}
                ],
                "instructions": [
                    "Cook oats with water according to package instructions",
                    "Stir in Greek yogurt",
                    "Top with sliced banana and almonds",
                    "Serve warm"
                ],
                "estimated_time": {"prep": "5 minutes", "cook": "10 minutes", "total": "15 minutes"},
                "diet_type": "balanced"
            },
            "lunch": {
                "title": "Quinoa Power Bowl",
                "recipe": "A complete protein bowl perfect for midday energy",
                "ingredients": [
                    {"item": "Quinoa", "quantity": "1/2 cup", "category": "grain"},
                    {"item": "Chicken breast", "quantity": "100g", "category": "protein"},
                    {"item": "Mixed vegetables", "quantity": "150g", "category": "vegetable"}
                ],
                "instructions": [
                    "Cook quinoa according to package instructions",
                    "Grill chicken breast until cooked through",
                    "Steam mixed vegetables",
                    "Combine all ingredients in a bowl"
                ],
                "estimated_time": {"prep": "10 minutes", "cook": "25 minutes", "total": "35 minutes"},
                "diet_type": "high-protein"
            },
            "dinner": {
                "title": "Baked Salmon with Sweet Potato",
                "recipe": "A heart-healthy dinner rich in omega-3 fatty acids",
                "ingredients": [
                    {"item": "Salmon fillet", "quantity": "150g", "category": "protein"},
                    {"item": "Sweet potato", "quantity": "1 medium", "category": "vegetable"},
                    {"item": "Asparagus", "quantity": "100g", "category": "vegetable"}
                ],
                "instructions": [
                    "Preheat oven to 400°F (200°C)",
                    "Cut sweet potato into wedges and season",
                    "Place salmon and vegetables on baking sheet",
                    "Bake for 20-25 minutes until fish flakes easily"
                ],
                "estimated_time": {"prep": "10 minutes", "cook": "25 minutes", "total": "35 minutes"},
                "diet_type": "heart-healthy"
            }
        }
        
        base_recipe = fallback_recipes.get(meal_type, fallback_recipes["dinner"])
        
        # Add standard fields
        base_recipe.update({
            "servings": 1,
            "difficulty": "simple",
            "tags": ["healthy", "nutritious"],
            "nutrition_per_serving": {
                "calories": 500,
                "protein": "30g",
                "carbs": "45g",
                "fat": "15g"
            },
            "personalization": {
                "generated_for": user.name,
                "activity_level": user.activity_level,
                "health_focus": "general_health",
                "customization_reason": "This is a balanced, healthy recipe suitable for your dietary needs."
            }
        })
        
        return base_recipe