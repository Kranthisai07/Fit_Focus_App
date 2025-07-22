from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime, date
import uuid

class Exercise(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # strength, cardio, flexibility, sports
    muscle_groups: List[str]  # chest, back, legs, etc.
    equipment: Optional[str] = None
    difficulty: str = "intermediate"  # beginner, intermediate, advanced
    calories_per_minute: float = 5.0
    instructions: Optional[str] = None
    image_url: Optional[str] = None

class WorkoutTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    category: str
    difficulty: str
    estimated_duration: int  # minutes
    exercises: List[Dict]  # [{"exercise_id": "...", "sets": 3, "reps": 10, "duration": 60}]
    image_url: Optional[str] = None

class WorkoutLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    workout_name: str
    exercises: List[Dict]  # logged exercise data
    duration_minutes: int
    calories_burned: float
    date: date
    completed: bool = True
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkoutLogCreate(BaseModel):
    workout_name: str
    exercises: List[Dict]
    duration_minutes: int
    notes: Optional[str] = None

class ExerciseSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    exercise_id: str
    exercise_name: str
    duration_seconds: int
    calories_burned: float
    date: date
    workout_log_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)