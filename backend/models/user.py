from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

class UserGoals(BaseModel):
    daily_calories: int = 2000
    protein_grams: int = 120
    carbs_grams: int = 250
    fat_grams: int = 60
    weekly_workouts: int = 5

class UserProfile(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    age: Optional[int] = None
    height: Optional[float] = None  # in cm
    weight: Optional[float] = None  # in kg
    activity_level: str = "moderate"  # sedentary, light, moderate, active, very_active
    goals: UserGoals = Field(default_factory=UserGoals)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    activity_level: str = "moderate"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    height: Optional[float] = None
    weight: Optional[float] = None
    activity_level: Optional[str] = None
    goals: Optional[UserGoals] = None