import sys
sys.path.append('/app/backend')

from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import date, datetime, timedelta
import random
from models.meal_planning import Recipe, RecipeCreate, MealPlan, MealPlanCreate, GroceryList

class MealPlanningService:
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.recipes_collection = db.recipes
        self.meal_plans_collection = db.meal_plans
        self.grocery_lists_collection = db.grocery_lists
    
    async def init_recipe_database(self):
        """Initialize with sample recipes if empty"""
        count = await self.recipes_collection.count_documents({})
        if count == 0:
            sample_recipes = [
                {
                    "name": "Stir-Fried Shrimp",
                    "description": "Delicious shrimp with vegetables",
                    "ingredients": [
                        {"food_name": "Shrimp", "quantity_grams": 200},
                        {"food_name": "Bell Peppers", "quantity_grams": 100},
                        {"food_name": "Broccoli", "quantity_grams": 150}
                    ],
                    "instructions": [
                        "Heat oil in pan",
                        "Add shrimp and cook for 3 minutes",
                        "Add vegetables and stir-fry for 5 minutes",
                        "Season and serve"
                    ],
                    "prep_time_minutes": 10,
                    "cook_time_minutes": 15,
                    "servings": 2,
                    "difficulty": "easy",
                    "cuisine_type": "Asian",
                    "dietary_tags": ["gluten-free", "high-protein"],
                    "nutrition_per_serving": {
                        "calories": 225,
                        "protein": 25,
                        "carbs": 8,
                        "fat": 10
                    }
                },
                {
                    "name": "Quinoa Salad",
                    "description": "Fresh quinoa salad with vegetables",
                    "ingredients": [
                        {"food_name": "Quinoa", "quantity_grams": 100},
                        {"food_name": "Cucumber", "quantity_grams": 100},
                        {"food_name": "Tomatoes", "quantity_grams": 150}
                    ],
                    "instructions": [
                        "Cook quinoa according to package instructions",
                        "Dice vegetables",
                        "Mix quinoa with vegetables",
                        "Add dressing and serve"
                    ],
                    "prep_time_minutes": 15,
                    "cook_time_minutes": 15,
                    "servings": 2,
                    "difficulty": "easy",
                    "cuisine_type": "Mediterranean",
                    "dietary_tags": ["vegan", "gluten-free"],
                    "nutrition_per_serving": {
                        "calories": 200,
                        "protein": 8,
                        "carbs": 35,
                        "fat": 4
                    }
                },
                {
                    "name": "Grilled Chicken with Avocado",
                    "description": "Healthy grilled chicken with creamy avocado",
                    "ingredients": [
                        {"food_name": "Chicken Breast", "quantity_grams": 200},
                        {"food_name": "Avocado", "quantity_grams": 100},
                        {"food_name": "Spinach", "quantity_grams": 50}
                    ],
                    "instructions": [
                        "Season and grill chicken breast",
                        "Slice avocado",
                        "Arrange on bed of spinach",
                        "Serve with lemon"
                    ],
                    "prep_time_minutes": 10,
                    "cook_time_minutes": 20,
                    "servings": 1,
                    "difficulty": "medium",
                    "cuisine_type": "American",
                    "dietary_tags": ["high-protein", "keto"],
                    "nutrition_per_serving": {
                        "calories": 390,
                        "protein": 35,
                        "carbs": 8,
                        "fat": 22
                    }
                }
            ]
            
            recipes = [Recipe(**recipe_data) for recipe_data in sample_recipes]
            await self.recipes_collection.insert_many([recipe.dict() for recipe in recipes])
    
    async def get_recipes(self, dietary_tags: List[str] = None, limit: int = 20) -> List[Recipe]:
        """Get recipes, optionally filtered by dietary tags"""
        query = {}
        if dietary_tags:
            query["dietary_tags"] = {"$in": dietary_tags}
        
        cursor = self.recipes_collection.find(query).limit(limit)
        recipes = []
        async for recipe_data in cursor:
            recipes.append(Recipe(**recipe_data))
        return recipes
    
    async def get_recipe_by_id(self, recipe_id: str) -> Optional[Recipe]:
        """Get recipe by ID"""
        recipe_data = await self.recipes_collection.find_one({"id": recipe_id})
        if recipe_data:
            return Recipe(**recipe_data)
        return None
    
    async def generate_meal_plan(self, user_id: str, meal_plan_data: MealPlanCreate) -> MealPlan:
        """Generate a weekly meal plan"""
        # Get available recipes
        recipes = await self.get_recipes()
        if not recipes:
            raise ValueError("No recipes available for meal planning")
        
        # Generate meal plan for 7 days
        meals = {}
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        meal_types = ['breakfast', 'lunch', 'dinner']
        
        for day in days:
            meals[day] = {}
            for meal_type in meal_types:
                # Randomly select a recipe for each meal
                recipe = random.choice(recipes)
                meals[day][meal_type] = recipe.id
        
        meal_plan = MealPlan(
            user_id=user_id,
            week_start_date=meal_plan_data.week_start_date,
            meals=meals,
            generated_by_ai=True
        )
        
        await self.meal_plans_collection.insert_one(meal_plan.dict())
        return meal_plan
    
    async def get_user_meal_plan(self, user_id: str, week_start: date) -> Optional[MealPlan]:
        """Get user's meal plan for a specific week"""
        meal_plan_data = await self.meal_plans_collection.find_one({
            "user_id": user_id,
            "week_start_date": week_start
        })
        if meal_plan_data:
            return MealPlan(**meal_plan_data)
        return None
    
    async def generate_grocery_list(self, user_id: str, meal_plan_id: str) -> GroceryList:
        """Generate grocery list from meal plan"""
        # Get meal plan
        meal_plan_data = await self.meal_plans_collection.find_one({"id": meal_plan_id})
        if not meal_plan_data:
            raise ValueError("Meal plan not found")
        
        meal_plan = MealPlan(**meal_plan_data)
        
        # Collect all ingredients from recipes in the meal plan
        ingredient_counts = {}
        recipe_ids = set()
        
        for day_meals in meal_plan.meals.values():
            for recipe_id in day_meals.values():
                recipe_ids.add(recipe_id)
        
        # Get all recipes
        for recipe_id in recipe_ids:
            recipe = await self.get_recipe_by_id(recipe_id)
            if recipe:
                for ingredient in recipe.ingredients:
                    food_name = ingredient.get("food_name", "")
                    quantity = ingredient.get("quantity_grams", 0)
                    if food_name in ingredient_counts:
                        ingredient_counts[food_name] += quantity
                    else:
                        ingredient_counts[food_name] = quantity
        
        # Organize by categories and assign stores
        produce_items = ["Bell Peppers", "Broccoli", "Spinach", "Cucumber", "Tomatoes", "Avocado"]
        dairy_items = ["Greek Yogurt", "Milk", "Cheese"]
        
        items = []
        stores = {"Walmart": [], "ProDash": []}
        
        for food_name, quantity in ingredient_counts.items():
            category = "produce" if food_name in produce_items else "dairy" if food_name in dairy_items else "other"
            store = "ProDash" if food_name == "Bell Peppers" else "Walmart"
            
            item = {
                "food_name": food_name,
                "quantity": f"{quantity}g",
                "category": category,
                "store": store,
                "checked": False
            }
            items.append(item)
            stores[store].append(item)
        
        grocery_list = GroceryList(
            user_id=user_id,
            meal_plan_id=meal_plan_id,
            items=items,
            week_start_date=meal_plan.week_start_date,
            stores=[{"store": store, "items": item_list} for store, item_list in stores.items()]
        )
        
        await self.grocery_lists_collection.insert_one(grocery_list.dict())
        return grocery_list