from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, date

# Import models and services
import sys
sys.path.append('/app/backend')

from models.user import UserProfile, UserCreate, UserUpdate
from models.nutrition import Food, FoodLogCreate, DayNutritionSummary  
from models.exercise import Exercise, WorkoutTemplate, WorkoutLogCreate, WorkoutLog
from models.meal_planning import Recipe, MealPlanCreate, MealPlan, GroceryList
from services.auth import AuthService
from services.nutrition import NutritionService
from services.exercise import ExerciseService
from services.meal_planning import MealPlanningService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

from services.recipe_recommendation import RecipeRecommendationService
from services.integrated_meal_service import IntegratedMealService

# Initialize services
auth_service = AuthService(db)
nutrition_service = NutritionService(db)
exercise_service = ExerciseService(db)
meal_planning_service = MealPlanningService(db)
recipe_recommendation_service = RecipeRecommendationService(db)
integrated_meal_service = IntegratedMealService(db)

# Create the main app without a prefix
app = FastAPI(title="FitFocus API", description="Comprehensive fitness tracking API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Basic status models (keeping for compatibility)
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "FitFocus API is running", "version": "1.0.0"}

# Initialize database with sample data
@app.on_event("startup")
async def startup_event():
    """Initialize database with sample data"""
    await nutrition_service.init_food_database()
    await exercise_service.init_exercise_database()
    await meal_planning_service.init_recipe_database()
    logging.info("Database initialized with sample data")

# USER ENDPOINTS
@api_router.post("/users", response_model=UserProfile)
async def create_user(user_data: UserCreate):
    """Create a new user"""
    try:
        user = await auth_service.create_user(user_data)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/users/{user_id}", response_model=UserProfile)
async def get_user(user_id: str):
    """Get user by ID"""
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.put("/users/{user_id}", response_model=UserProfile)
async def update_user(user_id: str, user_update: UserUpdate):
    """Update user profile"""
    user = await auth_service.update_user(user_id, user_update)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# DASHBOARD ENDPOINTS
@api_router.get("/dashboard/{user_id}")
async def get_dashboard_data(user_id: str):
    """Get comprehensive dashboard data"""
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get today's nutrition summary
    nutrition_summary = await nutrition_service.get_day_nutrition(user_id)
    
    # Get exercise stats
    exercise_stats = await exercise_service.get_user_stats(user_id, days=7)
    
    # Calculate calories remaining
    calories_consumed = nutrition_summary.total_calories
    calories_remaining = max(0, user.goals.daily_calories - calories_consumed)
    
    return {
        "user": user,
        "calories_remaining": int(calories_remaining),
        "calories_consumed": int(calories_consumed),
        "daily_goal": user.goals.daily_calories,
        "todays_nutrition": nutrition_summary,
        "exercise_stats": exercise_stats,
        "progress_percentage": min(100, (calories_consumed / user.goals.daily_calories) * 100)
    }

# NUTRITION ENDPOINTS
@api_router.get("/foods/search")
async def search_foods(q: str, limit: int = 20):
    """Search for foods by name"""
    foods = await nutrition_service.search_foods(q, limit)
    return foods

@api_router.post("/nutrition/log/{user_id}")
async def log_food(user_id: str, food_log: FoodLogCreate):
    """Log food for a user"""
    try:
        log_entry = await nutrition_service.log_food(user_id, food_log)
        return log_entry
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.get("/nutrition/{user_id}/daily")
async def get_daily_nutrition(user_id: str, date_str: Optional[str] = None):
    """Get daily nutrition summary"""
    target_date = date.today()
    if date_str:
        try:
            target_date = date.fromisoformat(date_str)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    summary = await nutrition_service.get_day_nutrition(user_id, target_date)
    
    # Get user goals for comparison
    user = await auth_service.get_user_by_id(user_id)
    if user:
        summary_dict = summary.dict()
        summary_dict["goals"] = {
            "protein": user.goals.protein_grams,
            "carbs": user.goals.carbs_grams,
            "fat": user.goals.fat_grams,
            "calories": user.goals.daily_calories
        }
        return summary_dict
    
    return summary

# EXERCISE ENDPOINTS
@api_router.get("/exercises", response_model=List[Exercise])
async def get_exercises(category: Optional[str] = None):
    """Get exercises, optionally filtered by category"""
    exercises = await exercise_service.get_exercise_library(category)
    return exercises

@api_router.get("/workouts/templates", response_model=List[WorkoutTemplate])
async def get_workout_templates():
    """Get workout templates"""
    templates = await exercise_service.get_workout_templates()
    return templates

@api_router.post("/workouts/log/{user_id}")
async def log_workout(user_id: str, workout_data: WorkoutLogCreate):
    """Log a completed workout"""
    workout_log = await exercise_service.log_workout(user_id, workout_data)
    return workout_log

@api_router.get("/workouts/{user_id}/history")
async def get_workout_history(user_id: str, limit: int = 10):
    """Get user's workout history"""
    workouts = await exercise_service.get_user_workout_history(user_id, limit)
    return workouts

@api_router.get("/exercise/{user_id}/stats")
async def get_exercise_stats(user_id: str, days: int = 7):
    """Get user's exercise statistics"""
    stats = await exercise_service.get_user_stats(user_id, days)
    return stats

# MEAL PLANNING ENDPOINTS
@api_router.get("/recipes", response_model=List[Recipe])
async def get_recipes(dietary_tags: Optional[str] = None, limit: int = 20):
    """Get recipes, optionally filtered by dietary tags"""
    tags = dietary_tags.split(",") if dietary_tags else None
    recipes = await meal_planning_service.get_recipes(tags, limit)
    return recipes

@api_router.get("/recipes/{recipe_id}", response_model=Recipe)
async def get_recipe(recipe_id: str):
    """Get recipe by ID"""
    recipe = await meal_planning_service.get_recipe_by_id(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

@api_router.post("/meal-plans/{user_id}")
async def create_meal_plan(user_id: str, meal_plan_data: MealPlanCreate):
    """Generate a meal plan for user"""
    meal_plan = await meal_planning_service.generate_meal_plan(user_id, meal_plan_data)
    return meal_plan

@api_router.get("/meal-plans/{user_id}/weekly")
async def get_weekly_meal_plan(user_id: str, week_start: str):
    """Get user's meal plan for a specific week"""
    try:
        start_date_str = week_start
        meal_plan = await meal_planning_service.get_user_meal_plan(user_id, start_date_str)
        if not meal_plan:
            raise HTTPException(status_code=404, detail="Meal plan not found")
        
        # Get recipe details for each meal
        detailed_plan = {"week_start_date": meal_plan.week_start_date, "meals": {}}
        
        for day, day_meals in meal_plan.meals.items():
            detailed_plan["meals"][day] = {}
            for meal_type, recipe_id in day_meals.items():
                recipe = await meal_planning_service.get_recipe_by_id(recipe_id)
                if recipe:
                    detailed_plan["meals"][day][meal_type] = {
                        "recipe_id": recipe.id,
                        "name": recipe.name,
                        "calories": recipe.nutrition_per_serving.get("calories", 0),
                        "prep_time": recipe.prep_time_minutes,
                        "cook_time": recipe.cook_time_minutes
                    }
        
        return detailed_plan
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

@api_router.post("/grocery-lists/{user_id}/{meal_plan_id}")
async def create_grocery_list(user_id: str, meal_plan_id: str):
    """Generate grocery list from meal plan"""
    try:
        grocery_list = await meal_planning_service.generate_grocery_list(user_id, meal_plan_id)
        return grocery_list
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# AI RECIPE RECOMMENDATION ENDPOINTS
@api_router.post("/recommendations/{user_id}/generate")
async def generate_recipe_recommendation(user_id: str, meal_type: str = "dinner"):
    """Generate AI-powered personalized recipe recommendation"""
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        recommendation = await recipe_recommendation_service.get_personalized_recommendation(
            user, meal_type, force_regenerate=True
        )
        return recommendation
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation: {str(e)}")

@api_router.get("/recommendations/{user_id}/multiple")
async def get_multiple_recommendations(user_id: str, count: int = 3):
    """Get multiple recipe recommendations for meal planning"""
    user = await auth_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    try:
        recommendations = await recipe_recommendation_service.get_multiple_recommendations(
            user, count
        )
        return {"recommendations": recommendations, "count": len(recommendations)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendations: {str(e)}")

@api_router.get("/recommendations/{user_id}/history")
async def get_recommendation_history(user_id: str, limit: int = 10):
    """Get user's recommendation history"""
    try:
        history = await recipe_recommendation_service.get_recommendation_history(user_id, limit)
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@api_router.post("/recommendations/{user_id}/save-to-meal-plan")
async def save_recommendation_to_meal_plan(
    user_id: str, 
    recommendation_data: dict,
    meal_type: str = "dinner",
    date: str = None
):
    """Save a recommended recipe to user's meal plan"""
    try:
        # Convert recommendation to recipe format
        recipe_data = {
            "name": recommendation_data.get("title"),
            "description": recommendation_data.get("recipe"),
            "ingredients": recommendation_data.get("ingredients", []),
            "instructions": recommendation_data.get("instructions", []),
            "prep_time_minutes": int(recommendation_data.get("estimated_time", {}).get("prep", "15 minutes").split()[0]),
            "cook_time_minutes": int(recommendation_data.get("estimated_time", {}).get("cook", "20 minutes").split()[0]),
            "servings": recommendation_data.get("servings", 1),
            "difficulty": recommendation_data.get("difficulty", "simple"),
            "dietary_tags": recommendation_data.get("tags", []),
            "nutrition_per_serving": recommendation_data.get("nutrition_per_serving", {})
        }
        
        # Create and save recipe
        from models.meal_planning import Recipe
        recipe = Recipe(**recipe_data)
        await meal_planning_service.recipes_collection.insert_one(recipe.dict())
        
        return {"message": "Recipe saved successfully", "recipe_id": recipe.id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save recipe: {str(e)}")

# Status endpoints (keeping for compatibility)
@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()