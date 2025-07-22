"""
Integrated Meal Service - Combines AI recommendations with meal planning and nutrition tracking
"""
import sys
sys.path.append('/app/backend')

import asyncio
from typing import Dict, Any, Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta, date
from models.ai_recommendations import (
    AIRecipeRecommendation, AIMealPlan, DailyMealEntry, 
    UserMealPreferences, WeeklyProgressSummary
)
from models.user import UserProfile
from services.recipe_recommendation import RecipeRecommendationService
import logging

logger = logging.getLogger(__name__)

class IntegratedMealService:
    """
    Service that integrates AI recommendations with meal planning and nutrition tracking
    """
    
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.ai_recipes_collection = db.ai_recipe_recommendations
        self.ai_meal_plans_collection = db.ai_meal_plans
        self.daily_meal_entries_collection = db.daily_meal_entries
        self.user_preferences_collection = db.user_meal_preferences
        self.weekly_summaries_collection = db.weekly_progress_summaries
        
        # Initialize recipe recommendation service
        self.recipe_service = RecipeRecommendationService(db)
    
    async def save_ai_recommendation(self, user_id: str, recommendation: Dict[str, Any], meal_type: str = "dinner") -> str:
        """Save AI recommendation to database"""
        try:
            # Ensure meal_type is included
            recommendation_data = recommendation.copy()
            recommendation_data["meal_type"] = meal_type
            
            ai_recipe = AIRecipeRecommendation(
                user_id=user_id,
                **recommendation_data
            )
            
            result = await self.ai_recipes_collection.insert_one(ai_recipe.dict())
            return ai_recipe.id  # Return the recipe ID, not the MongoDB ObjectId
            
        except Exception as e:
            logger.error(f"Error saving AI recommendation: {str(e)}")
            raise

    async def get_user_ai_recommendations(
        self, 
        user_id: str, 
        meal_type: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get user's AI recipe recommendations"""
        try:
            query = {"user_id": user_id}
            if meal_type:
                query["meal_type"] = meal_type
            
            cursor = self.ai_recipes_collection.find(query).sort("created_at", -1).limit(limit)
            
            recommendations = []
            async for rec in cursor:
                recommendations.append(AIRecipeRecommendation(**rec).dict())
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error getting AI recommendations: {str(e)}")
            return []

    async def create_weekly_ai_meal_plan(self, user: UserProfile, week_start: str) -> Dict[str, Any]:
        """Create a weekly meal plan using AI recommendations"""
        try:
            # Generate multiple recommendations for the week
            meal_types = ["breakfast", "lunch", "dinner"]
            weekly_recipes = {}
            
            days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
            
            for day in days:
                weekly_recipes[day] = {}
                for meal_type in meal_types:
                    # Generate AI recommendation for each meal
                    recommendation = await self.recipe_service.get_personalized_recommendation(
                        user, meal_type, force_regenerate=True
                    )
                    
                    # Save to AI recommendations collection
                    recipe_id = await self.save_ai_recommendation(user.id, recommendation, meal_type)
                    weekly_recipes[day][meal_type] = recipe_id
                    
                    # Small delay to avoid rate limiting
                    await asyncio.sleep(0.5)
            
            # Create AI meal plan
            ai_meal_plan = AIMealPlan(
                user_id=user.id,
                week_start_date=week_start,
                meals=weekly_recipes,
                dietary_focus=self._determine_dietary_focus(user),
                generation_prompt=f"Weekly meal plan for {user.name} - {user.activity_level} lifestyle"
            )
            
            # Calculate weekly nutrition summary
            nutrition_summary = await self._calculate_weekly_nutrition(weekly_recipes)
            ai_meal_plan.weekly_nutrition_summary = nutrition_summary
            
            # Save meal plan
            result = await self.ai_meal_plans_collection.insert_one(ai_meal_plan.dict())
            meal_plan_id = str(result.inserted_id)
            
            # Create daily meal entries for the week
            await self._create_daily_entries_from_plan(user.id, ai_meal_plan)
            
            return {
                "meal_plan_id": meal_plan_id,
                "meal_plan": ai_meal_plan.dict(),
                "weekly_nutrition": nutrition_summary
            }
            
        except Exception as e:
            logger.error(f"Error creating weekly AI meal plan: {str(e)}")
            raise

    async def get_daily_meal_plan(self, user_id: str, date_str: str) -> Dict[str, Any]:
        """Get daily meal plan with AI recommendations"""
        try:
            # Get daily meal entries
            cursor = self.daily_meal_entries_collection.find({
                "user_id": user_id,
                "date": date_str
            })
            
            daily_plan = {"meals": {}, "nutrition_summary": {}}
            total_nutrition = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
            
            async for entry in cursor:
                meal_entry = DailyMealEntry(**entry)
                
                # Get recipe details if AI generated
                if meal_entry.is_ai_generated and meal_entry.recipe_id:
                    recipe = await self.ai_recipes_collection.find_one({"id": meal_entry.recipe_id})
                    if recipe:
                        ai_recipe = AIRecipeRecommendation(**recipe)
                        daily_plan["meals"][meal_entry.meal_type] = {
                            "recipe": ai_recipe.dict(),
                            "completion_status": meal_entry.completion_status,
                            "completion_percentage": meal_entry.completion_percentage,
                            "planned_nutrition": meal_entry.planned_nutrition,
                            "actual_nutrition": meal_entry.actual_nutrition
                        }
                        
                        # Add to nutrition totals
                        for nutrient, value in meal_entry.planned_nutrition.items():
                            if nutrient in total_nutrition:
                                total_nutrition[nutrient] += value
            
            daily_plan["nutrition_summary"] = total_nutrition
            return daily_plan
            
        except Exception as e:
            logger.error(f"Error getting daily meal plan: {str(e)}")
            return {"meals": {}, "nutrition_summary": {}}

    async def update_meal_completion(
        self, 
        user_id: str, 
        date_str: str, 
        meal_type: str, 
        completion_data: Dict[str, Any]
    ):
        """Update meal completion status and actual nutrition"""
        try:
            update_data = {
                "completion_status": completion_data.get("status", "completed"),
                "completion_percentage": completion_data.get("percentage", 100),
                "actual_nutrition": completion_data.get("actual_nutrition", {}),
                "satisfaction_rating": completion_data.get("rating"),
                "notes": completion_data.get("notes"),
                "updated_at": datetime.utcnow()
            }
            
            await self.daily_meal_entries_collection.update_one(
                {
                    "user_id": user_id,
                    "date": date_str,
                    "meal_type": meal_type
                },
                {"$set": update_data}
            )
            
        except Exception as e:
            logger.error(f"Error updating meal completion: {str(e)}")
            raise

    async def get_weekly_meal_plan(self, user_id: str, week_start: str) -> Dict[str, Any]:
        """Get weekly meal plan with detailed recipes"""
        try:
            # Get AI meal plan
            meal_plan_data = await self.ai_meal_plans_collection.find_one({
                "user_id": user_id,
                "week_start_date": week_start
            })
            
            if not meal_plan_data:
                return None
            
            ai_meal_plan = AIMealPlan(**meal_plan_data)
            
            # Get detailed recipe information for each meal
            detailed_plan = {
                "id": ai_meal_plan.id,
                "plan_name": ai_meal_plan.plan_name,
                "week_start_date": ai_meal_plan.week_start_date,
                "weekly_nutrition_summary": ai_meal_plan.weekly_nutrition_summary,
                "meals": {}
            }
            
            for day, day_meals in ai_meal_plan.meals.items():
                detailed_plan["meals"][day] = {}
                
                for meal_type, recipe_id in day_meals.items():
                    recipe = await self.ai_recipes_collection.find_one({"id": recipe_id})
                    if recipe:
                        ai_recipe = AIRecipeRecommendation(**recipe)
                        detailed_plan["meals"][day][meal_type] = ai_recipe.dict()
            
            return detailed_plan
            
        except Exception as e:
            logger.error(f"Error getting weekly meal plan: {str(e)}")
            return None

    async def update_user_preferences(self, user_id: str, preferences: Dict[str, Any]):
        """Update user meal preferences based on interactions"""
        try:
            existing_prefs = await self.user_preferences_collection.find_one({"user_id": user_id})
            
            if existing_prefs:
                # Update existing preferences
                update_data = {}
                for key, value in preferences.items():
                    if key in ["preferred_meal_types", "disliked_ingredients", "favorite_cuisines"]:
                        # Merge lists
                        existing_list = existing_prefs.get(key, [])
                        if isinstance(value, list):
                            update_data[key] = list(set(existing_list + value))
                    else:
                        update_data[key] = value
                
                update_data["updated_at"] = datetime.utcnow()
                
                await self.user_preferences_collection.update_one(
                    {"user_id": user_id},
                    {"$set": update_data}
                )
            else:
                # Create new preferences
                user_prefs = UserMealPreferences(user_id=user_id, **preferences)
                await self.user_preferences_collection.insert_one(user_prefs.dict())
                
        except Exception as e:
            logger.error(f"Error updating user preferences: {str(e)}")
            raise

    async def generate_weekly_summary(self, user_id: str, week_start: str) -> Dict[str, Any]:
        """Generate weekly progress summary"""
        try:
            # Get meal plan for the week
            meal_plan = await self.get_weekly_meal_plan(user_id, week_start)
            
            # Get daily entries for the week
            week_end = (datetime.fromisoformat(week_start) + timedelta(days=6)).date().isoformat()
            
            cursor = self.daily_meal_entries_collection.find({
                "user_id": user_id,
                "date": {"$gte": week_start, "$lte": week_end}
            })
            
            # Calculate summary statistics
            total_planned = 0
            total_completed = 0
            total_nutrition = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
            ai_recipes_used = 0
            
            async for entry_data in cursor:
                entry = DailyMealEntry(**entry_data)
                total_planned += 1
                
                if entry.completion_status == "completed":
                    total_completed += 1
                    
                    # Add to nutrition totals
                    for nutrient, value in entry.actual_nutrition.items():
                        if nutrient in total_nutrition:
                            total_nutrition[nutrient] += value
                
                if entry.is_ai_generated:
                    ai_recipes_used += 1
            
            # Create summary
            summary = WeeklyProgressSummary(
                user_id=user_id,
                week_start_date=week_start,
                meal_plan_id=meal_plan.get("id") if meal_plan else None,
                planned_meals_count=total_planned,
                completed_meals_count=total_completed,
                compliance_rate=total_completed / total_planned if total_planned > 0 else 0,
                actual_calories=total_nutrition["calories"],
                actual_protein=total_nutrition["protein"],
                actual_carbs=total_nutrition["carbs"],
                actual_fat=total_nutrition["fat"],
                ai_recipes_used=ai_recipes_used
            )
            
            # Save summary
            await self.weekly_summaries_collection.insert_one(summary.dict())
            
            return summary.dict()
            
        except Exception as e:
            logger.error(f"Error generating weekly summary: {str(e)}")
            raise

    def _determine_dietary_focus(self, user: UserProfile) -> List[str]:
        """Determine dietary focus based on user profile"""
        focus = []
        
        if user.activity_level in ["active", "very_active"]:
            focus.append("performance")
            focus.append("high_protein")
        
        if user.goals.weekly_workouts >= 4:
            focus.append("muscle_building")
            
        if user.goals.daily_calories < 1800:
            focus.append("weight_loss")
        elif user.goals.daily_calories > 2500:
            focus.append("weight_gain")
        else:
            focus.append("maintenance")
        
        return focus

    async def _calculate_weekly_nutrition(self, weekly_recipes: Dict) -> Dict[str, float]:
        """Calculate weekly nutrition summary from recipes"""
        total_nutrition = {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
        
        try:
            for day_meals in weekly_recipes.values():
                for recipe_id in day_meals.values():
                    recipe = await self.ai_recipes_collection.find_one({"id": recipe_id})
                    if recipe:
                        nutrition = recipe.get("nutrition_per_serving", {})
                        total_nutrition["calories"] += nutrition.get("calories", 0)
                        total_nutrition["protein"] += float(str(nutrition.get("protein", "0g")).replace("g", ""))
                        total_nutrition["carbs"] += float(str(nutrition.get("carbs", "0g")).replace("g", ""))
                        total_nutrition["fat"] += float(str(nutrition.get("fat", "0g")).replace("g", ""))
        
        except Exception as e:
            logger.error(f"Error calculating weekly nutrition: {str(e)}")
        
        return total_nutrition

    async def _create_daily_entries_from_plan(self, user_id: str, meal_plan: AIMealPlan):
        """Create daily meal entries from weekly meal plan"""
        try:
            week_start = datetime.fromisoformat(meal_plan.week_start_date)
            
            for day_index, (day, day_meals) in enumerate(meal_plan.meals.items()):
                current_date = (week_start + timedelta(days=day_index)).date().isoformat()
                
                for meal_type, recipe_id in day_meals.items():
                    # Get recipe nutrition for planning
                    recipe = await self.ai_recipes_collection.find_one({"id": recipe_id})
                    planned_nutrition = {}
                    
                    if recipe:
                        nutrition = recipe.get("nutrition_per_serving", {})
                        planned_nutrition = {
                            "calories": nutrition.get("calories", 0),
                            "protein": float(str(nutrition.get("protein", "0g")).replace("g", "")),
                            "carbs": float(str(nutrition.get("carbs", "0g")).replace("g", "")),
                            "fat": float(str(nutrition.get("fat", "0g")).replace("g", ""))
                        }
                    
                    daily_entry = DailyMealEntry(
                        user_id=user_id,
                        date=current_date,
                        meal_type=meal_type,
                        recipe_id=recipe_id,
                        is_ai_generated=True,
                        planned_nutrition=planned_nutrition,
                        completion_status="planned"
                    )
                    
                    await self.daily_meal_entries_collection.insert_one(daily_entry.dict())
                    
        except Exception as e:
            logger.error(f"Error creating daily entries: {str(e)}")
            raise