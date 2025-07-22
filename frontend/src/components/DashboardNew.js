import React, { useState, useEffect } from "react";
import { dashboardAPI, nutritionAPI } from "../services/api";
import { useUser } from "../context/UserContext";
import { Search, Plus, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { useToast } from "../hooks/use-toast";

const Dashboard = () => {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
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
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Good morning, {user.name}
        </h1>
        <p className="text-gray-600">Stay active and reach your goals!</p>
      </div>
      
      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <Input
          type="text"
          placeholder="Search food, exercises..."
          className="pl-10 pr-4 py-3 rounded-xl"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">
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
      
      {/* Calorie Counter */}
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
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
      
      {/* Today's Meals */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold text-gray-800">Lunch</CardTitle>
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
              <div className="text-center py-4 text-gray-500">
                <p>No food logged for lunch yet</p>
                <p className="text-sm">Search and add food above</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="text-2xl font-bold text-purple-700">
              {Math.round(dashboardData.progress_percentage)}%
            </h3>
            <p className="text-sm text-purple-600">Goal Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200 col-span-2 md:col-span-1">
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