import React, { useState, useEffect } from "react";
import { integratedMealAPI, recommendationAPI } from "../services/api";
import { useUser } from "../context/UserContext";
import { Plus, Target, CheckCircle, Sparkles, Clock } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";

const Daily = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  const [dailyPlan, setDailyPlan] = useState(null);
  const [userGoals, setUserGoals] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get today's date in ISO format
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      loadDailyData();
    }
  }, [user]);

  const loadDailyData = async () => {
    try {
      setLoading(true);
      
      // Load daily AI meal plan
      const plan = await integratedMealAPI.getDailyAIMealPlan(user.id, today);
      setDailyPlan(plan);
      
      // Set user goals
      setUserGoals(user.goals);
      
    } catch (error) {
      console.error('Failed to load daily data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAIRecommendation = async (mealType) => {
    try {
      setLoading(true);
      
      // Generate AI recommendation for specific meal
      const recommendation = await recommendationAPI.generateRecommendation(user.id, mealType);
      
      // Save to integrated system
      await recommendationAPI.saveToMealPlan(user.id, recommendation, mealType, today);
      
      // Reload daily data
      await loadDailyData();
      
      toast({
        title: "AI Recipe Added! ✨",
        description: `${recommendation.title} added to your ${mealType}`,
      });
      
    } catch (error) {
      console.error('Failed to generate AI recommendation:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate AI recipe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markMealComplete = async (mealType, recipe) => {
    try {
      const completionData = {
        status: "completed",
        percentage: 100,
        actual_nutrition: recipe.nutrition_per_serving,
        rating: 5
      };
      
      await integratedMealAPI.updateMealCompletion(user.id, today, mealType, completionData);
      await loadDailyData();
      
      toast({
        title: "Meal Completed! 🎉",
        description: "Great job sticking to your meal plan!",
      });
      
    } catch (error) {
      console.error('Failed to mark meal complete:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update meal completion",
        variant: "destructive",
      });
    }
  };

  if (loading && !dailyPlan) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="h-32 bg-gray-300 rounded"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  const meals = [
    { id: "breakfast", name: "Breakfast", emoji: "🌅" },
    { id: "lunch", name: "Lunch", emoji: "☀️" },
    { id: "dinner", name: "Dinner", emoji: "🌙" },
    { id: "snack", name: "Snacks", emoji: "🍓" }
  ];

  const dailyNutrition = dailyPlan?.nutrition_summary || {};
  const selectedMealData = dailyPlan?.meals?.[selectedMeal];

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            Daily Breakdown
          </h1>
          <p className="text-gray-600">Track your AI-powered meal plan for today</p>
        </div>
        <div className="flex items-center text-green-600 mt-2 md:mt-0">
          <Target size={20} className="mr-2" />
          <span className="font-medium">AI-Optimized Plan</span>
        </div>
      </div>

      {/* Daily Nutrition Summary */}
      {userGoals && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Calories */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">Calories</h3>
                  <span className="text-sm text-gray-600">
                    {Math.round(dailyNutrition.calories || 0)} / {userGoals.daily_calories}
                  </span>
                </div>
                <Progress 
                  value={((dailyNutrition.calories || 0) / userGoals.daily_calories) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>

            {/* Protein */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">Protein</h3>
                  <span className="text-sm text-gray-600">
                    {Math.round(dailyNutrition.protein || 0)}g / {userGoals.protein_grams}g
                  </span>
                </div>
                <Progress 
                  value={((dailyNutrition.protein || 0) / userGoals.protein_grams) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>

            {/* Carbs */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">Carbs</h3>
                  <span className="text-sm text-gray-600">
                    {Math.round(dailyNutrition.carbs || 0)}g / {userGoals.carbs_grams}g
                  </span>
                </div>
                <Progress 
                  value={((dailyNutrition.carbs || 0) / userGoals.carbs_grams) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>

            {/* Fat */}
            <Card>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">Fat</h3>
                  <span className="text-sm text-gray-600">
                    {Math.round(dailyNutrition.fat || 0)}g / {userGoals.fat_grams}g
                  </span>
                </div>
                <Progress 
                  value={((dailyNutrition.fat || 0) / userGoals.fat_grams) * 100} 
                  className="h-2"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Meal Selection */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Meals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {meals.map((meal) => {
            const mealData = dailyPlan?.meals?.[meal.id];
            const isCompleted = mealData?.completion_status === "completed";
            const hasAIRecipe = mealData?.recipe?.personalization;
            
            return (
              <Card 
                key={meal.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedMeal === meal.id ? "ring-2 ring-green-500 bg-green-50" : ""
                } ${isCompleted ? "bg-green-100 border-green-300" : ""}`}
                onClick={() => setSelectedMeal(meal.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{meal.emoji}</div>
                  <h3 className="font-medium text-gray-800 mb-1">{meal.name}</h3>
                  <div className="flex justify-center space-x-2">
                    {hasAIRecipe && (
                      <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">
                        <Sparkles size={10} className="mr-1" />
                        AI
                      </Badge>
                    )}
                    {isCompleted && (
                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700">
                        <CheckCircle size={10} className="mr-1" />
                        Done
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Selected Meal Details */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="capitalize flex items-center space-x-2">
              <span>{selectedMeal}</span>
              {selectedMealData?.recipe?.personalization && (
                <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <Sparkles size={12} className="mr-1" />
                  AI Generated
                </Badge>
              )}
            </CardTitle>
            {!selectedMealData && (
              <Button 
                onClick={() => generateAIRecommendation(selectedMeal)}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Sparkles size={16} className="mr-2" />
                Generate AI Recipe
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {selectedMealData?.recipe ? (
            <div className="space-y-6">
              {/* Recipe Info */}
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  {selectedMealData.recipe.title}
                </h3>
                <p className="text-gray-600 mb-4">{selectedMealData.recipe.recipe}</p>
                
                {/* Personalization Info */}
                {selectedMealData.recipe.personalization && (
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Personalized for you:</strong> {selectedMealData.recipe.personalization.customization_reason}
                    </p>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <Clock size={20} className="mx-auto mb-1 text-gray-600" />
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-semibold">{selectedMealData.recipe.estimated_time.total}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm text-orange-600">Calories</p>
                    <p className="font-semibold text-orange-700">
                      {selectedMealData.recipe.nutrition_per_serving.calories}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-600">Protein</p>
                    <p className="font-semibold text-green-700">
                      {selectedMealData.recipe.nutrition_per_serving.protein}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">Carbs</p>
                    <p className="font-semibold text-blue-700">
                      {selectedMealData.recipe.nutrition_per_serving.carbs}
                    </p>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Ingredients</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedMealData.recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="font-medium">{ingredient.item}</span>
                      <span className="text-sm text-gray-600">{ingredient.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4 border-t">
                {selectedMealData.completion_status !== "completed" && (
                  <Button 
                    onClick={() => markMealComplete(selectedMeal, selectedMealData.recipe)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Mark as Completed
                  </Button>
                )}
                <Button 
                  onClick={() => generateAIRecommendation(selectedMeal)}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  <Sparkles size={16} className="mr-2" />
                  Generate New Recipe
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Sparkles className="mx-auto mb-4 text-purple-400" size={48} />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No meal planned for {selectedMeal}
              </h3>
              <p className="text-gray-500 mb-4">
                Generate an AI-powered personalized recipe recommendation
              </p>
              <Button
                onClick={() => generateAIRecommendation(selectedMeal)}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Sparkles size={16} />
                    <span>Generate AI Recipe</span>
                  </div>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Daily;