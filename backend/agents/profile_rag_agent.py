"""
Profile RAG Agent - First Agent in the Recipe Recommendation System
Analyzes user profile and creates personalized context for recipe generation
"""
import sys
sys.path.append('/app/backend')

from typing import Dict, List, Any, Optional
from models.user import UserProfile
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ProfileRAGAgent:
    """
    First agent in the multi-agent system that analyzes user profile
    and creates structured context for recipe recommendations
    """
    
    def __init__(self):
        self.dietary_preferences_map = {
            "sedentary": {"calories_per_meal": 400, "protein_ratio": 0.2, "activity_focus": "light"},
            "light": {"calories_per_meal": 500, "protein_ratio": 0.25, "activity_focus": "moderate"},
            "moderate": {"calories_per_meal": 600, "protein_ratio": 0.3, "activity_focus": "balanced"},
            "active": {"calories_per_meal": 700, "protein_ratio": 0.35, "activity_focus": "high"},
            "very_active": {"calories_per_meal": 800, "protein_ratio": 0.4, "activity_focus": "very_high"}
        }
    
    def analyze_user_profile(self, user: UserProfile, meal_type: str = "dinner") -> Dict[str, Any]:
        """
        Analyze user profile and extract relevant information for recipe generation
        """
        try:
            # Get activity-based recommendations
            activity_config = self.dietary_preferences_map.get(
                user.activity_level, 
                self.dietary_preferences_map["moderate"]
            )
            
            # Calculate nutritional targets
            target_calories = activity_config["calories_per_meal"]
            target_protein = int(target_calories * activity_config["protein_ratio"] / 4)  # 4 cal per gram
            target_carbs = int(target_calories * 0.4 / 4)  # 40% carbs
            target_fat = int(target_calories * 0.3 / 9)  # 30% fat, 9 cal per gram
            
            # Determine dietary restrictions and preferences
            dietary_tags = self._infer_dietary_preferences(user)
            
            # Create meal-specific adjustments
            meal_adjustments = self._get_meal_adjustments(meal_type)
            
            # Build comprehensive profile context
            profile_context = {
                "user_info": {
                    "name": user.name,
                    "age": user.age or 30,
                    "activity_level": user.activity_level,
                    "bmi_category": self._calculate_bmi_category(user),
                    "health_focus": self._determine_health_focus(user)
                },
                "nutritional_targets": {
                    "calories": int(target_calories * meal_adjustments["calorie_multiplier"]),
                    "protein_grams": int(target_protein * meal_adjustments["protein_multiplier"]),
                    "carbs_grams": int(target_carbs * meal_adjustments["carb_multiplier"]),
                    "fat_grams": int(target_fat * meal_adjustments["fat_multiplier"])
                },
                "dietary_preferences": {
                    "tags": dietary_tags,
                    "meal_type": meal_type,
                    "cooking_complexity": self._determine_cooking_complexity(user),
                    "preparation_time_preference": self._get_time_preference(user)
                },
                "goals": {
                    "daily_calories": user.goals.daily_calories,
                    "weekly_workouts": user.goals.weekly_workouts,
                    "focus": self._determine_goal_focus(user.goals)
                }
            }
            
            return profile_context
            
        except Exception as e:
            logger.error(f"Error analyzing user profile: {str(e)}")
            # Return default context if analysis fails
            return self._get_default_context(meal_type)
    
    def _infer_dietary_preferences(self, user: UserProfile) -> List[str]:
        """Infer dietary preferences based on user profile"""
        tags = []
        
        # Activity-based preferences
        if user.activity_level in ["active", "very_active"]:
            tags.extend(["high-protein", "post-workout-friendly"])
        
        # Age-based preferences
        if user.age and user.age > 50:
            tags.extend(["heart-healthy", "low-sodium"])
        elif user.age and user.age < 30:
            tags.extend(["quick-prep", "budget-friendly"])
        
        # BMI-based preferences
        bmi_category = self._calculate_bmi_category(user)
        if bmi_category == "underweight":
            tags.extend(["calorie-dense", "healthy-fats"])
        elif bmi_category == "overweight":
            tags.extend(["low-calorie", "high-fiber"])
        
        # Default healthy options
        if not tags:
            tags.extend(["balanced", "nutritious"])
        
        return list(set(tags))  # Remove duplicates
    
    def _calculate_bmi_category(self, user: UserProfile) -> str:
        """Calculate BMI category if height and weight are available"""
        if user.height and user.weight:
            height_m = user.height / 100  # Convert cm to meters
            bmi = user.weight / (height_m ** 2)
            
            if bmi < 18.5:
                return "underweight"
            elif bmi < 25:
                return "normal"
            elif bmi < 30:
                return "overweight"
            else:
                return "obese"
        return "unknown"
    
    def _determine_health_focus(self, user: UserProfile) -> str:
        """Determine primary health focus based on profile"""
        bmi_category = self._calculate_bmi_category(user)
        activity = user.activity_level
        
        if activity in ["active", "very_active"] and user.goals.weekly_workouts >= 4:
            return "performance"
        elif bmi_category in ["overweight", "obese"]:
            return "weight_loss"
        elif bmi_category == "underweight":
            return "weight_gain"
        else:
            return "maintenance"
    
    def _get_meal_adjustments(self, meal_type: str) -> Dict[str, float]:
        """Get meal-specific calorie and macronutrient adjustments"""
        adjustments = {
            "breakfast": {
                "calorie_multiplier": 0.8,
                "protein_multiplier": 1.0,
                "carb_multiplier": 1.2,
                "fat_multiplier": 0.8
            },
            "lunch": {
                "calorie_multiplier": 1.0,
                "protein_multiplier": 1.1,
                "carb_multiplier": 1.0,
                "fat_multiplier": 1.0
            },
            "dinner": {
                "calorie_multiplier": 1.2,
                "protein_multiplier": 1.3,
                "carb_multiplier": 0.8,
                "fat_multiplier": 1.1
            },
            "snack": {
                "calorie_multiplier": 0.4,
                "protein_multiplier": 1.0,
                "carb_multiplier": 0.6,
                "fat_multiplier": 0.8
            }
        }
        return adjustments.get(meal_type, adjustments["lunch"])
    
    def _determine_cooking_complexity(self, user: UserProfile) -> str:
        """Determine preferred cooking complexity based on lifestyle indicators"""
        if user.activity_level == "very_active":
            return "simple"  # Busy lifestyle
        elif user.age and user.age > 40:
            return "moderate"  # More time and experience
        else:
            return "simple"  # Default to simple
    
    def _get_time_preference(self, user: UserProfile) -> int:
        """Get preferred preparation time in minutes"""
        complexity = self._determine_cooking_complexity(user)
        
        time_map = {
            "simple": 25,
            "moderate": 35,
            "complex": 50
        }
        return time_map.get(complexity, 30)
    
    def _determine_goal_focus(self, goals) -> str:
        """Determine primary goal focus"""
        if goals.weekly_workouts >= 5:
            return "fitness"
        elif goals.daily_calories < 1800:
            return "weight_loss" 
        elif goals.daily_calories > 2500:
            return "weight_gain"
        else:
            return "health"
    
    def _get_default_context(self, meal_type: str) -> Dict[str, Any]:
        """Return default context if profile analysis fails"""
        return {
            "user_info": {
                "name": "User",
                "age": 30,
                "activity_level": "moderate",
                "bmi_category": "normal",
                "health_focus": "maintenance"
            },
            "nutritional_targets": {
                "calories": 600,
                "protein_grams": 45,
                "carbs_grams": 60,
                "fat_grams": 20
            },
            "dietary_preferences": {
                "tags": ["balanced", "nutritious"],
                "meal_type": meal_type,
                "cooking_complexity": "simple",
                "preparation_time_preference": 30
            },
            "goals": {
                "daily_calories": 2000,
                "weekly_workouts": 3,
                "focus": "health"
            }
        }
    
    def generate_recommendation_prompt(self, profile_context: Dict[str, Any]) -> str:
        """
        Generate the one-shot prompt for the recipe generation agent
        """
        user_info = profile_context["user_info"]
        targets = profile_context["nutritional_targets"]
        preferences = profile_context["dietary_preferences"]
        
        prompt = f"""
You are a professional nutritionist and chef creating a personalized recipe recommendation for {user_info["name"]}.

USER PROFILE:
- Age: {user_info["age"]} years old
- Activity Level: {user_info["activity_level"]} 
- Health Focus: {user_info["health_focus"]}
- BMI Category: {user_info["bmi_category"]}

NUTRITIONAL TARGETS for {preferences["meal_type"]}:
- Calories: {targets["calories"]} kcal
- Protein: {targets["protein_grams"]}g
- Carbohydrates: {targets["carbs_grams"]}g  
- Fat: {targets["fat_grams"]}g

PREFERENCES:
- Dietary Tags: {", ".join(preferences["tags"])}
- Cooking Complexity: {preferences["cooking_complexity"]}
- Max Preparation Time: {preferences["preparation_time_preference"]} minutes
- Meal Type: {preferences["meal_type"]}

REQUIREMENTS:
Create ONE personalized recipe that perfectly matches these requirements. The recipe must be practical, delicious, and nutritionally balanced.

Return your response in the following JSON format:
{{
  "title": "Recipe Name",
  "recipe": "Brief description of the dish and why it's perfect for this user's profile",
  "ingredients": [
    {{"item": "ingredient name", "quantity": "amount with unit", "category": "protein/vegetable/grain/dairy/other"}},
    ...
  ],
  "instructions": [
    "Step 1: Clear, specific instruction",
    "Step 2: Clear, specific instruction",
    ...
  ],
  "estimated_time": {{
    "prep": "X minutes",
    "cook": "X minutes", 
    "total": "X minutes"
  }},
  "diet_type": "primary diet category (e.g., balanced, high-protein, low-carb, mediterranean, etc.)",
  "nutrition_per_serving": {{
    "calories": {targets["calories"]},
    "protein": "{targets["protein_grams"]}g",
    "carbs": "{targets["carbs_grams"]}g", 
    "fat": "{targets["fat_grams"]}g"
  }},
  "servings": 1,
  "difficulty": "{preferences["cooking_complexity"]}",
  "tags": {preferences["tags"]}
}}

Focus on creating a recipe that is both nutritious and appealing, matching the user's lifestyle and dietary needs.
"""
        
        return prompt