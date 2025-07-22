from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
import uuid

class Recipe(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    ingredients: List[Dict]  # [{"food_id": "...", "quantity_grams": 100}]
    instructions: List[str]
    prep_time_minutes: int
    cook_time_minutes: int
    servings: int
    difficulty: str = "medium"  # easy, medium, hard
    cuisine_type: Optional[str] = None
    dietary_tags: List[str] = []  # vegetarian, vegan, gluten-free, etc.
    nutrition_per_serving: Dict[str, float]  # calories, protein, carbs, fat
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MealPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    week_start_date: str  # Store as ISO string
    meals: Dict[str, Dict[str, str]]  # {"monday": {"breakfast": "recipe_id", "lunch": "recipe_id"}}
    generated_by_ai: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GroceryList(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    meal_plan_id: str
    items: List[Dict]  # [{"food_name": "...", "quantity": "...", "category": "produce", "checked": false}]
    week_start_date: date
    stores: List[Dict]  # [{"store": "Walmart", "items": [...]}]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RecipeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    ingredients: List[Dict]
    instructions: List[str]
    prep_time_minutes: int
    cook_time_minutes: int
    servings: int
    difficulty: str = "medium"
    cuisine_type: Optional[str] = None
    dietary_tags: List[str] = []

class MealPlanCreate(BaseModel):
    week_start_date: date
    preferences: Optional[Dict] = None  # dietary restrictions, favorite cuisines, etc.