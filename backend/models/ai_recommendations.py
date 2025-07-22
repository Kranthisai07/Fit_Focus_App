"""
AI Recommendations Models - Database models for AI-generated content
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class AIRecipeRecommendation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    recipe: str  # Description
    ingredients: List[Dict[str, Any]]  # [{"item": "...", "quantity": "...", "category": "..."}]
    instructions: List[str]
    estimated_time: Dict[str, str]  # {"prep": "...", "cook": "...", "total": "..."}
    diet_type: str
    nutrition_per_serving: Dict[str, Any]  # {"calories": 450, "protein": "45g", ...}
    servings: int
    difficulty: str
    tags: List[str]
    meal_type: str  # breakfast, lunch, dinner, snack
    
    # AI-specific metadata
    personalization: Dict[str, Any]
    nutrition_score: Optional[int] = None
    preparation_tips: List[str] = []
    substitutions: Dict[str, str] = {}
    
    # Tracking
    generated_by: str = "gemini-2.5-flash-preview-04-17"
    is_saved_to_meal_plan: bool = False
    times_used: int = 0
    user_rating: Optional[int] = None  # 1-5 stars
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AIMealPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    week_start_date: str  # ISO string
    plan_name: str = "AI Generated Weekly Plan"
    
    # Daily meal assignments with AI recipes
    meals: Dict[str, Dict[str, str]]  # {"monday": {"breakfast": "recipe_id", "lunch": "recipe_id"}}
    
    # Nutritional summary for the week
    weekly_nutrition_summary: Dict[str, float] = {}  # total calories, protein, etc.
    
    # AI generation metadata
    generation_prompt: Optional[str] = None
    dietary_focus: List[str] = []  # weight_loss, muscle_gain, etc.
    generated_by: str = "ai_meal_planner"
    
    # User interaction
    is_active: bool = True
    completion_rate: float = 0.0  # percentage of meals actually consumed
    user_feedback: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DailyMealEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    date: str  # ISO string
    meal_type: str  # breakfast, lunch, dinner, snack
    
    # Recipe information (if from AI recommendation)
    recipe_id: Optional[str] = None
    is_ai_generated: bool = False
    
    # Actual consumption tracking
    foods_consumed: List[Dict[str, Any]] = []  # Individual food items logged
    planned_nutrition: Dict[str, float] = {}  # Expected nutrition from recipe
    actual_nutrition: Dict[str, float] = {}  # Actual nutrition from logged foods
    
    # Completion tracking
    completion_status: str = "planned"  # planned, partially_completed, completed, skipped
    completion_percentage: float = 0.0
    
    # User feedback
    satisfaction_rating: Optional[int] = None  # 1-5
    notes: Optional[str] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserMealPreferences(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Dietary preferences learned from AI interactions
    preferred_meal_types: List[str] = []
    disliked_ingredients: List[str] = []
    favorite_cuisines: List[str] = []
    dietary_restrictions: List[str] = []
    
    # Cooking preferences
    max_prep_time: int = 30  # minutes
    preferred_difficulty: str = "simple"
    favorite_cooking_methods: List[str] = []
    
    # AI learning data
    successful_recommendations: List[str] = []  # recipe IDs that were well-received
    rejected_recommendations: List[str] = []
    average_recipe_rating: float = 0.0
    
    # Adaptive learning weights
    nutrition_importance: float = 0.8  # How much to weight nutritional targets
    taste_importance: float = 0.7
    convenience_importance: float = 0.6
    
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class WeeklyProgressSummary(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    week_start_date: str  # ISO string
    
    # Meal plan compliance
    meal_plan_id: Optional[str] = None
    planned_meals_count: int = 0
    completed_meals_count: int = 0
    compliance_rate: float = 0.0
    
    # Nutritional achievements
    target_calories: float = 0.0
    actual_calories: float = 0.0
    target_protein: float = 0.0
    actual_protein: float = 0.0
    target_carbs: float = 0.0
    actual_carbs: float = 0.0
    target_fat: float = 0.0
    actual_fat: float = 0.0
    
    # AI recommendation usage
    ai_recipes_used: int = 0
    ai_recipes_completed: int = 0
    average_ai_recipe_rating: float = 0.0
    
    # Exercise integration
    workout_days_with_proper_nutrition: int = 0
    pre_workout_meals_logged: int = 0
    post_workout_meals_logged: int = 0
    
    # Goal progress
    weight_goal_progress: Optional[float] = None
    fitness_goal_progress: Optional[float] = None
    
    created_at: datetime = Field(default_factory=datetime.utcnow)