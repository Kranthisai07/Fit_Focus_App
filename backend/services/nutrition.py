from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import date, datetime
from ..models.nutrition import Food, FoodCreate, FoodLogEntry, FoodLogCreate, DayNutritionSummary

class NutritionService:
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.foods_collection = db.foods
        self.food_logs_collection = db.food_logs
    
    async def init_food_database(self):
        """Initialize with some basic foods if empty"""
        count = await self.foods_collection.count_documents({})
        if count == 0:
            sample_foods = [
                {
                    "name": "Grilled Chicken Breast",
                    "category": "protein",
                    "nutrition": {
                        "calories_per_100g": 165,
                        "protein_per_100g": 31,
                        "carbs_per_100g": 0,
                        "fat_per_100g": 3.6,
                        "fiber_per_100g": 0,
                        "sodium_per_100g": 74
                    }
                },
                {
                    "name": "Quinoa",
                    "category": "grain",
                    "nutrition": {
                        "calories_per_100g": 368,
                        "protein_per_100g": 14.1,
                        "carbs_per_100g": 64.2,
                        "fat_per_100g": 6.1,
                        "fiber_per_100g": 7,
                        "sodium_per_100g": 5
                    }
                },
                {
                    "name": "Avocado",
                    "category": "fruit",
                    "nutrition": {
                        "calories_per_100g": 160,
                        "protein_per_100g": 2,
                        "carbs_per_100g": 8.5,
                        "fat_per_100g": 14.7,
                        "fiber_per_100g": 6.7,
                        "sodium_per_100g": 7
                    }
                },
                {
                    "name": "Greek Yogurt",
                    "category": "dairy",
                    "nutrition": {
                        "calories_per_100g": 59,
                        "protein_per_100g": 10,
                        "carbs_per_100g": 3.6,
                        "fat_per_100g": 0.4,
                        "fiber_per_100g": 0,
                        "sodium_per_100g": 36
                    }
                },
                {
                    "name": "Broccoli",
                    "category": "vegetable",
                    "nutrition": {
                        "calories_per_100g": 25,
                        "protein_per_100g": 3,
                        "carbs_per_100g": 5,
                        "fat_per_100g": 0.4,
                        "fiber_per_100g": 3,
                        "sodium_per_100g": 41
                    }
                }
            ]
            
            foods = [Food(**food_data) for food_data in sample_foods]
            await self.foods_collection.insert_many([food.dict() for food in foods])
    
    async def search_foods(self, query: str, limit: int = 20) -> List[Food]:
        """Search for foods by name"""
        cursor = self.foods_collection.find({
            "name": {"$regex": query, "$options": "i"}
        }).limit(limit)
        
        foods = []
        async for food_data in cursor:
            foods.append(Food(**food_data))
        return foods
    
    async def get_food_by_id(self, food_id: str) -> Optional[Food]:
        """Get food by ID"""
        food_data = await self.foods_collection.find_one({"id": food_id})
        if food_data:
            return Food(**food_data)
        return None
    
    async def log_food(self, user_id: str, food_log: FoodLogCreate) -> FoodLogEntry:
        """Log food for a user"""
        # Get food details
        food = await self.get_food_by_id(food_log.food_id)
        if not food:
            raise ValueError("Food not found")
        
        # Calculate nutrition based on quantity
        multiplier = food_log.quantity_grams / 100.0
        
        log_entry = FoodLogEntry(
            user_id=user_id,
            food_id=food_log.food_id,
            food_name=food.name,
            quantity_grams=food_log.quantity_grams,
            meal_type=food_log.meal_type,
            date=date.today(),
            calories=food.nutrition.calories_per_100g * multiplier,
            protein=food.nutrition.protein_per_100g * multiplier,
            carbs=food.nutrition.carbs_per_100g * multiplier,
            fat=food.nutrition.fat_per_100g * multiplier
        )
        
        await self.food_logs_collection.insert_one(log_entry.dict())
        return log_entry
    
    async def get_day_nutrition(self, user_id: str, target_date: date = None) -> DayNutritionSummary:
        """Get nutrition summary for a specific day"""
        if target_date is None:
            target_date = date.today()
        
        cursor = self.food_logs_collection.find({
            "user_id": user_id,
            "date": target_date
        })
        
        total_calories = 0
        total_protein = 0
        total_carbs = 0
        total_fat = 0
        meals = {}
        
        async for log in cursor:
            log_entry = FoodLogEntry(**log)
            total_calories += log_entry.calories
            total_protein += log_entry.protein
            total_carbs += log_entry.carbs
            total_fat += log_entry.fat
            
            if log_entry.meal_type not in meals:
                meals[log_entry.meal_type] = []
            meals[log_entry.meal_type].append(log_entry.dict())
        
        return DayNutritionSummary(
            date=target_date,
            total_calories=total_calories,
            total_protein=total_protein,
            total_carbs=total_carbs,
            total_fat=total_fat,
            meals=meals
        )