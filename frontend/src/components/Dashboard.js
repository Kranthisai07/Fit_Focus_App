import React, { useState } from "react";
import { mockData } from "../data/mock";
import { Search, Plus, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, todaysMeals, recentSearches } = mockData;
  
  const progressPercentage = ((user.dailyCalorieGoal - user.caloriesRemaining) / user.dailyCalorieGoal) * 100;
  
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
        <Button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-green-600 hover:bg-green-700 rounded-lg">
          <Search size={16} />
        </Button>
      </div>
      
      {/* Calorie Counter */}
      <Card className="mb-6 bg-gradient-to-r from-green-50 to-green-100 border-green-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <h2 className="text-3xl md:text-4xl font-bold text-green-700 mb-1">
                {user.caloriesRemaining}
              </h2>
              <p className="text-green-600 font-medium">calories remaining</p>
            </div>
            <div className="w-full md:w-48">
              <div className="relative">
                <Progress 
                  value={progressPercentage} 
                  className="h-4 mb-2"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>0</span>
                  <span>{user.dailyCalorieGoal}</span>
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
            {todaysMeals.lunch.map((meal, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div>
                  <h4 className="font-medium text-gray-800">{meal.name}</h4>
                  <p className="text-sm text-gray-600">{meal.quantity}</p>
                </div>
                <span className="text-green-600 font-semibold">{meal.calories} cal</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto mb-2 text-blue-600" size={24} />
            <h3 className="text-2xl font-bold text-blue-700">7</h3>
            <p className="text-sm text-blue-600">Days Active</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h3 className="text-2xl font-bold text-purple-700">85%</h3>
            <p className="text-sm text-purple-600">Goal Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200 col-span-2 md:col-span-1">
          <CardContent className="p-4 text-center">
            <div className="text-2xl mb-2">🔥</div>
            <h3 className="text-2xl font-bold text-orange-700">340</h3>
            <p className="text-sm text-orange-600">Calories Burned</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Searches */}
      {searchQuery === "" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">Recent Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((search, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 hover:text-green-600 hover:border-green-600"
                  onClick={() => setSearchQuery(search)}
                >
                  {search}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;