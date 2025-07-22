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

# Initialize services
auth_service = AuthService(db)
nutrition_service = NutritionService(db)
exercise_service = ExerciseService(db)
meal_planning_service = MealPlanningService(db)

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

# Dashboard data model
class DashboardData(BaseModel):
    user: UserProfile
    calories_remaining: int
    daily_progress: dict
    todays_meals: dict
    quick_stats: dict

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "FitFocus API is running", "version": "1.0.0"}

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
