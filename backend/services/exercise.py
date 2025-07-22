import sys
sys.path.append('/app/backend')

from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import date, datetime, timedelta
from models.exercise import Exercise, WorkoutTemplate, WorkoutLog, WorkoutLogCreate, ExerciseSession

class ExerciseService:
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.exercises_collection = db.exercises
        self.workout_templates_collection = db.workout_templates
        self.workout_logs_collection = db.workout_logs
        self.exercise_sessions_collection = db.exercise_sessions
    
    async def init_exercise_database(self):
        """Initialize with sample exercises and workouts if empty"""
        count = await self.exercises_collection.count_documents({})
        if count == 0:
            sample_exercises = [
                {
                    "name": "Barbell Squat",
                    "category": "strength",
                    "muscle_groups": ["quadriceps", "glutes", "hamstrings"],
                    "equipment": "barbell",
                    "difficulty": "intermediate",
                    "calories_per_minute": 8.0,
                    "instructions": "Stand with feet shoulder-width apart, squat down keeping chest up"
                },
                {
                    "name": "Push-ups",
                    "category": "strength",
                    "muscle_groups": ["chest", "shoulders", "triceps"],
                    "equipment": "bodyweight",
                    "difficulty": "beginner",
                    "calories_per_minute": 7.0,
                    "instructions": "Start in plank position, lower chest to ground, push back up"
                },
                {
                    "name": "Deadlifts",
                    "category": "strength",
                    "muscle_groups": ["hamstrings", "glutes", "back"],
                    "equipment": "barbell",
                    "difficulty": "intermediate",
                    "calories_per_minute": 9.0,
                    "instructions": "Keep back straight, lift weight by extending hips and knees"
                },
                {
                    "name": "Running",
                    "category": "cardio",
                    "muscle_groups": ["legs", "core"],
                    "equipment": "none",
                    "difficulty": "beginner",
                    "calories_per_minute": 10.0,
                    "instructions": "Maintain steady pace, land on midfoot, keep upright posture"
                }
            ]
            
            exercises = [Exercise(**exercise_data) for exercise_data in sample_exercises]
            await self.exercises_collection.insert_many([exercise.dict() for exercise in exercises])
        
        # Initialize workout templates
        template_count = await self.workout_templates_collection.count_documents({})
        if template_count == 0:
            sample_templates = [
                {
                    "name": "Upper Body Strength",
                    "description": "Focus on chest, shoulders, and arms",
                    "category": "strength",
                    "difficulty": "intermediate",
                    "estimated_duration": 25,
                    "exercises": [
                        {"exercise_name": "Push-ups", "sets": 3, "reps": 15, "duration": 300},
                        {"exercise_name": "Pull-ups", "sets": 3, "reps": 10, "duration": 240}
                    ]
                },
                {
                    "name": "Cardio Blast",
                    "description": "High-intensity cardio workout",
                    "category": "cardio",
                    "difficulty": "beginner",
                    "estimated_duration": 30,
                    "exercises": [
                        {"exercise_name": "Running", "duration": 1200},
                        {"exercise_name": "Jumping Jacks", "duration": 300}
                    ]
                },
                {
                    "name": "Yoga Flow",
                    "description": "Relaxing yoga sequence",
                    "category": "flexibility",
                    "difficulty": "beginner",
                    "estimated_duration": 45,
                    "exercises": [
                        {"exercise_name": "Mountain Pose", "duration": 300},
                        {"exercise_name": "Downward Dog", "duration": 600}
                    ]
                }
            ]
            
            templates = [WorkoutTemplate(**template_data) for template_data in sample_templates]
            await self.workout_templates_collection.insert_many([template.dict() for template in templates])
    
    async def get_exercise_library(self, category: Optional[str] = None) -> List[Exercise]:
        """Get exercises, optionally filtered by category"""
        query = {}
        if category:
            query["category"] = category
        
        cursor = self.exercises_collection.find(query)
        exercises = []
        async for exercise_data in cursor:
            exercises.append(Exercise(**exercise_data))
        return exercises
    
    async def get_workout_templates(self) -> List[WorkoutTemplate]:
        """Get all workout templates"""
        cursor = self.workout_templates_collection.find({})
        templates = []
        async for template_data in cursor:
            templates.append(WorkoutTemplate(**template_data))
        return templates
    
    async def log_workout(self, user_id: str, workout_data: WorkoutLogCreate) -> WorkoutLog:
        """Log a completed workout"""
        # Calculate calories burned based on duration and exercises
        calories_burned = workout_data.duration_minutes * 7.5  # Rough estimate
        
        workout_log = WorkoutLog(
            user_id=user_id,
            workout_name=workout_data.workout_name,
            exercises=workout_data.exercises,
            duration_minutes=workout_data.duration_minutes,
            calories_burned=calories_burned,
            date=date.today().isoformat(),
            notes=workout_data.notes
        )
        
        await self.workout_logs_collection.insert_one(workout_log.dict())
        return workout_log
    
    async def get_user_workout_history(self, user_id: str, limit: int = 10) -> List[WorkoutLog]:
        """Get user's recent workout history"""
        cursor = self.workout_logs_collection.find(
            {"user_id": user_id}
        ).sort("date", -1).limit(limit)
        
        workouts = []
        async for workout_data in cursor:
            workouts.append(WorkoutLog(**workout_data))
        return workouts
    
    async def get_user_stats(self, user_id: str, days: int = 7) -> dict:
        """Get user's exercise stats for the past N days"""
        start_date = date.today() - timedelta(days=days)
        
        cursor = self.workout_logs_collection.find({
            "user_id": user_id,
            "date": {"$gte": start_date}
        })
        
        total_workouts = 0
        total_calories = 0
        total_minutes = 0
        workout_days = set()
        
        async for workout in cursor:
            total_workouts += 1
            total_calories += workout.get("calories_burned", 0)
            total_minutes += workout.get("duration_minutes", 0)
            workout_days.add(workout["date"])
        
        return {
            "total_workouts": total_workouts,
            "total_calories_burned": total_calories,
            "total_active_minutes": total_minutes,
            "active_days": len(workout_days),
            "average_workout_duration": total_minutes / total_workouts if total_workouts > 0 else 0
        }