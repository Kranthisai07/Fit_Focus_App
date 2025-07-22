from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime, timedelta
import uuid

class NutritionInfo(BaseModel):
    calories_per_100g: float
    protein_per_100g: float
    carbs_per_100g: float
    fat_per_100g: float
    fiber_per_100g: Optional[float] = 0
    sodium_per_100g: Optional[float] = 0

class Food(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    brand: Optional[str] = None
    category: str  # protein, vegetable, fruit, grain, dairy, etc.
    nutrition: NutritionInfo
    serving_size: Optional[str] = "100g"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FoodCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    category: str
    nutrition: NutritionInfo
    serving_size: Optional[str] = "100g"

class FoodLogEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    food_id: str
    food_name: str  # Store for quick access
    quantity_grams: float
    meal_type: str  # breakfast, lunch, dinner, snack
    date: date
    calories: float
    protein: float
    carbs: float
    fat: float
    logged_at: datetime = Field(default_factory=datetime.utcnow)

class FoodLogCreate(BaseModel):
    food_id: str
    quantity_grams: float
    meal_type: str

class DayNutritionSummary(BaseModel):
    date: date
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    meals: dict  # meal_type -> list of entries