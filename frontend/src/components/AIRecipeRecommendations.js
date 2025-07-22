import React, { useState } from "react";
import { recommendationAPI } from "../services/api";
import { useUser } from "../context/UserContext";
import { Sparkles, Clock, Users, ChefHat, Zap, ShoppingCart } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";

const AIRecipeRecommendations = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('dinner');

  const mealTypes = [
    { value: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { value: 'lunch', label: 'Lunch', icon: '🌞' },
    { value: 'dinner', label: 'Dinner', icon: '🌙' },
    { value: 'snack', label: 'Snack', icon: '🍓' }
  ];

  const generateRecommendation = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const result = await recommendationAPI.generateRecommendation(user.id, selectedMealType);
      setRecommendation(result);
      
      toast({
        title: "AI Recipe Generated! ✨",
        description: `Personalized ${selectedMealType} recipe created for you`,
      });
    } catch (error) {
      console.error('Failed to generate recommendation:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI recipe recommendation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveToMealPlan = async () => {
    if (!recommendation || !user) return;

    try {
      await recommendationAPI.saveToMealPlan(user.id, recommendation, selectedMealType);
      toast({
        title: "Recipe Saved! 📱",
        description: "Recipe added to your meal plan successfully",
      });
    } catch (error) {
      console.error('Failed to save recipe:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save recipe to meal plan",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="text-purple-600" size={32} />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            AI Recipe Assistant
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Get personalized recipe recommendations powered by AI, tailored to your fitness goals and dietary preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side - Controls */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ChefHat size={20} />
                <span>Generate Recipe</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Meal Type Selection */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Select Meal Type</h3>
                <div className="grid grid-cols-2 gap-2">
                  {mealTypes.map((meal) => (
                    <Button
                      key={meal.value}
                      variant={selectedMealType === meal.value ? "default" : "outline"}
                      className={`p-3 h-auto flex-col space-y-1 ${
                        selectedMealType === meal.value 
                          ? "bg-gradient-to-r from-green-600 to-blue-600 text-white" 
                          : ""
                      }`}
                      onClick={() => setSelectedMealType(meal.value)}
                    >
                      <span className="text-2xl">{meal.icon}</span>
                      <span className="text-sm">{meal.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* User Profile Summary */}
              {user && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">Your Profile</h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>Activity Level: <span className="font-medium capitalize">{user.activity_level}</span></p>
                    <p>Daily Goal: <span className="font-medium">{user.goals.daily_calories} calories</span></p>
                    <p>Protein Target: <span className="font-medium">{user.goals.protein_grams}g</span></p>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={generateRecommendation}
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating AI Recipe...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles size={20} />
                    <span>Generate AI Recipe</span>
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Recommendation */}
        <div className="lg:col-span-2">
          {recommendation ? (
            <Card className="h-fit">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl text-gray-800 mb-2">
                      {recommendation.title}
                    </CardTitle>
                    <p className="text-gray-600">{recommendation.recipe}</p>
                  </div>
                  <Badge className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                    AI Generated
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personalization Info */}
                {recommendation.personalization && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">
                      Personalized for {recommendation.personalization.generated_for}
                    </h3>
                    <p className="text-blue-700 text-sm">
                      {recommendation.personalization.customization_reason}
                    </p>
                  </div>
                )}

                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock className="mx-auto mb-1 text-gray-600" size={20} />
                    <p className="text-sm text-gray-600">Total Time</p>
                    <p className="font-semibold">{recommendation.estimated_time.total}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Users className="mx-auto mb-1 text-gray-600" size={20} />
                    <p className="text-sm text-gray-600">Servings</p>
                    <p className="font-semibold">{recommendation.servings}</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Zap className="mx-auto mb-1 text-orange-600" size={20} />
                    <p className="text-sm text-gray-600">Calories</p>
                    <p className="font-semibold text-orange-600">
                      {recommendation.nutrition_per_serving.calories}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <ChefHat className="mx-auto mb-1 text-gray-600" size={20} />
                    <p className="text-sm text-gray-600">Difficulty</p>
                    <p className="font-semibold capitalize">{recommendation.difficulty}</p>
                  </div>
                </div>

                {/* Nutrition Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Protein</p>
                    <p className="text-lg font-bold text-green-700">
                      {recommendation.nutrition_per_serving.protein}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Carbs</p>
                    <p className="text-lg font-bold text-blue-700">
                      {recommendation.nutrition_per_serving.carbs}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-purple-600">Fat</p>
                    <p className="text-lg font-bold text-purple-700">
                      {recommendation.nutrition_per_serving.fat}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {recommendation.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Ingredients */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Ingredients</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {recommendation.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{ingredient.item}</span>
                        <span className="text-sm text-gray-600">{ingredient.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Instructions</h3>
                  <div className="space-y-3">
                    {recommendation.instructions.map((step, index) => (
                      <div key={index} className="flex space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <p className="text-gray-700">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preparation Tips */}
                {recommendation.preparation_tips && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">Pro Tips</h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {recommendation.preparation_tips.map((tip, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-yellow-600">💡</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button 
                    onClick={saveToMealPlan}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <ShoppingCart size={16} className="mr-2" />
                    Save to Meal Plan
                  </Button>
                  <Button 
                    onClick={generateRecommendation}
                    variant="outline"
                    className="flex-1"
                  >
                    <Sparkles size={16} className="mr-2" />
                    Generate New Recipe
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Sparkles className="mx-auto mb-4 text-purple-400" size={64} />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Ready to Generate Your AI Recipe
                </h3>
                <p className="text-gray-500 mb-4">
                  Select a meal type and click generate to get a personalized recipe recommendation
                </p>
                <Button 
                  onClick={generateRecommendation}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Sparkles size={16} className="mr-2" />
                  Get Started
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIRecipeRecommendations;