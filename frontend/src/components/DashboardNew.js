import React, { useState, useEffect } from "react";
import { dashboardAPI, nutritionAPI, integratedMealAPI } from "../services/api";
import { useUser } from "../context/UserContext";
import { Search, Plus, TrendingUp, Sparkles, Clock, ChefHat } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { useToast } from "../hooks/use-toast";

const Dashboard = () => {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const data = await dashboardAPI.getDashboardData(user.id);
        setDashboardData(data);
        
        // Load recent AI recommendations
        const aiRecs = await integratedMealAPI.getUserAIRecipes(user.id, null, 3);
        setAiRecommendations(aiRecs.recommendations || []);
        
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, toast]);

  // Search foods
  useEffect(() => {
    const searchFoods = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        setSearchLoading(true);
        const foods = await nutritionAPI.searchFoods(searchQuery, 10);
        setSearchResults(foods);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(searchFoods, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleAddFood = async (food) => {
    try {
      await nutritionAPI.logFood(user.id, {
        food_id: food.id,
        quantity_grams: 100,
        meal_type: "lunch"
      });
      
      toast({
        title: "Success",
        description: `Added ${food.name} to lunch`,
      });
      
      // Reload dashboard data
      const data = await dashboardAPI.getDashboardData(user.id);
      setDashboardData(data);
      setSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add food:', error);
      toast({
        title: "Error",
        description: "Failed to add food",
        variant: "destructive",
      });
    }
  };
  
  if (userLoading || loading) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-300 rounded mb-6"></div>
          <div className="h-32 bg-gray-300 rounded mb-6"></div>
          <div className="h-64 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-4 md:p-6 max-w-4xl mx-auto">
        <div className="text-center">
          <p className="text-gray-500">Failed to load dashboard data</p>
        </div>
      </div>
    );
  }
  
  const progressPercentage = (dashboardData.calories_consumed / dashboardData.daily_goal) * 100;
  const todaysMeals = dashboardData.todays_nutrition?.meals?.lunch || [];
  
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Good morning, {user.name}
            </h1>
            <p className="text-gray-600">Stay active and reach your goals with AI-powered nutrition!</p>
          </div>
          
          {/* AI Status Indicator */}
          <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-lg mt-2 md:mt-0">
            <Sparkles className="text-purple-600" size={20} />
            <span className="text-purple-700 font-medium">AI Active</span>
          </div>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          type="text"
          placeholder="Search food, get AI recipes..."
          className="pl-10 pr-4 py-3 rounded-xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-h-64 overflow-y-auto">
            {searchResults.map((food) => (
              <div
                key={food.id}
                className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                onClick={() => handleAddFood(food)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-800">{food.name}</h4>
                    <p className="text-sm text-gray-600">{food.category}</p>
                  </div>
                  <div className="text-sm text-green-600">
                    <span>{food.nutrition.calories_per_100g} cal/100g</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Calorie Counter - Main Focus */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="text-center md:text-left mb-4 md:mb-0">
                  <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-1">
                    {dashboardData.calories_remaining}
                  </h2>
                  <p className="text-green-600 font-medium">calories remaining</p>
                  <p className="text-sm text-green-500">
                    {dashboardData.calories_consumed} consumed of {dashboardData.daily_goal}
                  </p>
                </div>
                <div className="w-full md:w-48">
                  <div className="relative">
                    <Progress 
                      value={progressPercentage} 
                      className="h-4 mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>0</span>
                      <span>{dashboardData.daily_goal}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick AI Recipe Generator */}
        <div>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 h-full">
            <CardContent className="p-6 flex flex-col justify-center items-center text-center h-full">
              <Sparkles className="text-purple-600 mb-3" size={32} />
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Need Recipe Ideas?</h3>
              <p className="text-purple-600 text-sm mb-4">Get AI-powered meal recommendations</p>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 w-full"
                onClick={() => window.location.href = '/ai-recipes'}
              >
                <Sparkles size={16} className="mr-2" />
                Generate Recipe
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Recommendations Section */}
      {aiRecommendations.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
              <Sparkles className="text-purple-600" size={20} />
              <span>Your Recent AI Recipes</span>
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/ai-recipes'}
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              View All
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aiRecommendations.slice(0, 3).map((recipe, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">{recipe.title}</h3>
                    <Badge className="bg-purple-100 text-purple-700 text-xs">
                      <Sparkles size={8} className="mr-1" />
                      AI
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{recipe.recipe}</p>
                  
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-orange-600">Calories</p>
                      <p className="font-bold text-orange-700 text-sm">{recipe.nutrition_per_serving?.calories}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-green-600">Protein</p>
                      <p className="font-bold text-green-700 text-sm">{recipe.nutrition_per_serving?.protein}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-blue-600">Time</p>
                      <p className="font-bold text-blue-700 text-sm">{recipe.estimated_time?.total}</p>
                    </div>
                  </div>
                  
                  {recipe.personalization && (
                    <div className="bg-purple-50 p-2 rounded text-xs text-purple-700 mb-2">
                      <strong>For you:</strong> {recipe.personalization.customization_reason?.slice(0, 60)}...
                    </div>
                  )}
                  
                  <Button 
                    size="sm" 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-xs"
                    onClick={() => window.location.href = '/daily'}
                  >
                    <ChefHat size={12} className="mr-1" />
                    Add to Meal Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Today's Meals */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-gray-800">Today's Lunch</CardTitle>
            <Button variant="outline" size="sm" className="border-green-600 text-green-600 hover:bg-green-50">
              <Plus size={16} className="mr-2" />
              Add Food
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {todaysMeals.length > 0 ? (
              todaysMeals.map((meal, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <h4 className="font-medium text-gray-800">{meal.food_name}</h4>
                    <p className="text-sm text-gray-600">{meal.quantity_grams}g</p>
                  </div>
                  <span className="text-green-600 font-semibold">{Math.round(meal.calories)} cal</span>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <div className="text-gray-400 mb-2">
                  <ChefHat size={32} className="mx-auto" />
                </div>
                <p className="text-gray-500 mb-2">No food logged for lunch yet</p>
                <p className="text-sm text-gray-400 mb-4">Search above or get AI recipe recommendations</p>
                <Button 
                  onClick={() => window.location.href = '/ai-recipes'}
                  variant="outline" 
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  <Sparkles size={16} className="mr-2" />
                  Get AI Recipe
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto mb-2 text-blue-600" size={24} />
            <h3 className="text-2xl font-bold text-blue-700">
              {dashboardData.exercise_stats.active_days}
            </h3>
            <p className="text-sm text-blue-600">Days Active</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <Sparkles className="mx-auto mb-2 text-purple-600" size={24} />
            <h3 className="text-2xl font-bold text-purple-700">
              {aiRecommendations.length}
            </h3>
            <p className="text-sm text-purple-600">AI Recipes</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="text-2xl font-bold text-green-700">
              {Math.round(dashboardData.progress_percentage)}%
            </h3>
            <p className="text-sm text-green-600">Goal Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🔥</div>
            <h3 className="text-2xl font-bold text-orange-700">
              {dashboardData.exercise_stats.total_calories_burned}
            </h3>
            <p className="text-sm text-orange-600">Calories Burned</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;