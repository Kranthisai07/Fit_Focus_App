"""
Recipe Generator Agent - Second Agent in the Multi-Agent System
Uses Gemini AI to generate personalized recipe recommendations
"""
import sys
sys.path.append('/app/backend')

import os
import json
import asyncio
from typing import Dict, Any, Optional
from emergentintegrations.llm.chat import LlmChat, UserMessage
import logging

logger = logging.getLogger(__name__)

class RecipeGeneratorAgent:
    """
    Second agent that uses Gemini 2.5 Flash Preview to generate 
    personalized recipe recommendations based on profile analysis
    """
    
    def __init__(self):
        self.api_key = os.environ.get('GEMINI_API_KEY')
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Initialize Gemini chat with the specified model
        self.chat = LlmChat(
            api_key=self.api_key,
            session_id="recipe_generator",
            system_message="You are a professional nutritionist and chef AI assistant specialized in creating personalized, healthy, and delicious recipes."
        ).with_model("gemini", "gemini-2.5-flash-preview-04-17").with_max_tokens(4096)
    
    async def generate_recipe(self, recommendation_prompt: str) -> Dict[str, Any]:
        """
        Generate a personalized recipe using Gemini based on the profile-generated prompt
        """
        try:
            # Create user message with the recommendation prompt
            user_message = UserMessage(text=recommendation_prompt)
            
            # Get response from Gemini
            response = await self.chat.send_message(user_message)
            
            # Parse the JSON response
            recipe_data = self._parse_recipe_response(response)
            
            # Validate and enhance the recipe
            validated_recipe = self._validate_recipe(recipe_data)
            
            return validated_recipe
            
        except Exception as e:
            logger.error(f"Error generating recipe with Gemini: {str(e)}")
            return self._get_fallback_recipe()
    
    def _parse_recipe_response(self, response: str) -> Dict[str, Any]:
        """Parse the JSON response from Gemini"""
        try:
            # Clean the response - sometimes AI includes markdown formatting
            cleaned_response = response.strip()
            
            # Remove markdown code blocks if present
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            
            cleaned_response = cleaned_response.strip()
            
            # Parse JSON
            recipe_data = json.loads(cleaned_response)
            return recipe_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse recipe JSON: {str(e)}")
            logger.error(f"Response: {response}")
            # Try to extract JSON from text if parsing fails
            return self._extract_recipe_from_text(response)
    
    def _extract_recipe_from_text(self, text: str) -> Dict[str, Any]:
        """Extract recipe information from text if JSON parsing fails"""
        # This is a fallback method to extract basic recipe info
        lines = text.split('\n')
        
        recipe = {
            "title": "AI Generated Recipe",
            "recipe": "A personalized recipe created based on your dietary preferences",
            "ingredients": [],
            "instructions": [],
            "estimated_time": {"prep": "15 minutes", "cook": "20 minutes", "total": "35 minutes"},
            "diet_type": "balanced",
            "nutrition_per_serving": {"calories": 500, "protein": "30g", "carbs": "45g", "fat": "15g"},
            "servings": 1,
            "difficulty": "simple",
            "tags": ["healthy"]
        }
        
        current_section = None
        for line in lines:
            line = line.strip()
            if "ingredients" in line.lower():
                current_section = "ingredients"
            elif "instructions" in line.lower() or "steps" in line.lower():
                current_section = "instructions"
            elif line.startswith("-") or line.startswith("•") or line.startswith("*"):
                item = line[1:].strip()
                if current_section == "ingredients":
                    recipe["ingredients"].append({
                        "item": item.split(" - ")[0] if " - " in item else item,
                        "quantity": "as needed",
                        "category": "other"
                    })
                elif current_section == "instructions":
                    recipe["instructions"].append(item)
        
        return recipe
    
    def _validate_recipe(self, recipe_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and ensure recipe has all required fields"""
        required_fields = [
            "title", "recipe", "ingredients", "instructions", 
            "estimated_time", "diet_type", "servings"
        ]
        
        # Set defaults for missing fields
        defaults = {
            "title": "Personalized Healthy Recipe",
            "recipe": "A nutritious meal tailored to your dietary needs",
            "ingredients": [{"item": "Mixed vegetables", "quantity": "200g", "category": "vegetable"}],
            "instructions": ["Prepare ingredients", "Cook according to preference", "Serve hot"],
            "estimated_time": {"prep": "15 minutes", "cook": "20 minutes", "total": "35 minutes"},
            "diet_type": "balanced",
            "servings": 1,
            "difficulty": "simple",
            "tags": ["healthy", "nutritious"],
            "nutrition_per_serving": {
                "calories": 500,
                "protein": "25g",
                "carbs": "50g", 
                "fat": "15g"
            }
        }
        
        # Ensure all required fields are present
        for field in required_fields:
            if field not in recipe_data or not recipe_data[field]:
                recipe_data[field] = defaults[field]
        
        # Validate ingredients format
        if isinstance(recipe_data.get("ingredients"), list):
            validated_ingredients = []
            for ingredient in recipe_data["ingredients"]:
                if isinstance(ingredient, dict):
                    validated_ingredients.append({
                        "item": ingredient.get("item", "Unknown ingredient"),
                        "quantity": ingredient.get("quantity", "as needed"),
                        "category": ingredient.get("category", "other")
                    })
                elif isinstance(ingredient, str):
                    validated_ingredients.append({
                        "item": ingredient,
                        "quantity": "as needed", 
                        "category": "other"
                    })
            recipe_data["ingredients"] = validated_ingredients
        
        # Ensure instructions is a list
        if not isinstance(recipe_data.get("instructions"), list):
            if isinstance(recipe_data.get("instructions"), str):
                recipe_data["instructions"] = [recipe_data["instructions"]]
            else:
                recipe_data["instructions"] = defaults["instructions"]
        
        # Validate estimated_time
        if not isinstance(recipe_data.get("estimated_time"), dict):
            recipe_data["estimated_time"] = defaults["estimated_time"]
        
        return recipe_data
    
    def _get_fallback_recipe(self) -> Dict[str, Any]:
        """Return a fallback recipe if AI generation fails"""
        return {
            "title": "Healthy Grilled Chicken with Vegetables",
            "recipe": "A balanced, protein-rich meal perfect for active individuals. This dish combines lean protein with colorful vegetables for optimal nutrition.",
            "ingredients": [
                {"item": "Chicken breast", "quantity": "200g", "category": "protein"},
                {"item": "Bell peppers", "quantity": "100g", "category": "vegetable"},
                {"item": "Broccoli", "quantity": "100g", "category": "vegetable"},
                {"item": "Olive oil", "quantity": "1 tbsp", "category": "fat"},
                {"item": "Garlic", "quantity": "2 cloves", "category": "seasoning"},
                {"item": "Salt and pepper", "quantity": "to taste", "category": "seasoning"}
            ],
            "instructions": [
                "Preheat grill or grill pan to medium-high heat",
                "Season chicken breast with salt, pepper, and minced garlic",
                "Cut bell peppers into strips and prepare broccoli florets",
                "Grill chicken for 6-7 minutes on each side until cooked through",
                "In a separate pan, sauté vegetables with olive oil for 5-6 minutes",
                "Let chicken rest for 2 minutes, then slice",
                "Serve sliced chicken over the sautéed vegetables"
            ],
            "estimated_time": {
                "prep": "10 minutes",
                "cook": "20 minutes",
                "total": "30 minutes"
            },
            "diet_type": "high-protein",
            "nutrition_per_serving": {
                "calories": 450,
                "protein": "45g",
                "carbs": "15g",
                "fat": "20g"
            },
            "servings": 1,
            "difficulty": "simple",
            "tags": ["high-protein", "healthy", "gluten-free"]
        }