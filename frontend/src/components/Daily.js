import React, { useState } from "react";
import { mockData } from "../data/mock";
import { Plus, Target } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

const Daily = () => {
  const { dailyMacros } = mockData;
  const [selectedMeal, setSelectedMeal] = useState("breakfast");
  
  const meals = [
    { id: "breakfast", name: "Breakfast", calories: 0, logged: false },
    { id: "lunch", name: "Lunch", calories: 620, logged: true },
    { id: "dinner", name: "Dinner", calories: 0, logged: false },
    { id: "snacks", name: "Snacks", calories: 0, logged: false }
  ];
  
  const MacroCard = ({ macro, data }) => {
    const percentage = (data.current / data.target) * 100;
    const getColor = () => {
      switch (macro.toLowerCase()) {
        case 'protein': return 'bg-green-600';
        case 'carbs': return 'bg-blue-600';
        case 'fat': return 'bg-purple-600';
        default: return 'bg-gray-600';
      }
    };
    
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800">{macro}</h3>
            <span className="text-sm font-medium text-gray-600">
              {data.current}{data.unit} / {data.target}{data.unit}
            </span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-500 ${getColor()}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 md:mb-0">
          Daily Breakdown
        </h1>
        <div className="flex items-center text-green-600">
          <Target size={20} className="mr-2" />
          <span className="font-medium">Focus Mode</span>
        </div>
      </div>
      
      {/* Macros Section */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Macronutrients</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <MacroCard macro="Protein" data={dailyMacros.protein} />
          <MacroCard macro="Carbs" data={dailyMacros.carbs} />
          <MacroCard macro="Fat" data={dailyMacros.fat} />
        </div>
      </div>
      
      {/* Meals Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Meals</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {meals.map((meal) => (
            <Card 
              key={meal.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedMeal === meal.id ? "ring-2 ring-green-500 bg-green-50" : ""
              }`}
              onClick={() => setSelectedMeal(meal.id)}
            >
              <CardContent className="p-4 text-center">
                <h3 className="font-medium text-gray-800 mb-2">{meal.name}</h3>
                <p className={`text-lg font-bold ${meal.logged ? "text-green-600" : "text-gray-400"}`}>
                  {meal.calories} cal
                </p>
                {!meal.logged && (
                  <Plus className="mx-auto mt-2 text-gray-400" size={16} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* Meal Details */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="capitalize">{selectedMeal}</CardTitle>
            <Button className="bg-green-600 hover:bg-green-700">
              Log Food
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedMeal === "lunch" ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Grilled Chicken</h4>
                  <p className="text-sm text-gray-600">380g</p>
                </div>
                <span className="text-green-600 font-semibold">360 cal</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-800">Avocado</h4>
                  <p className="text-sm text-gray-600">230g</p>
                </div>
                <span className="text-green-600 font-semibold">280 cal</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Plus size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No food logged for {selectedMeal} yet</p>
              <Button variant="outline" className="mt-4 border-green-600 text-green-600 hover:bg-green-50">
                Add Food
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Quick Add Section */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Add</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {["Apple", "Banana", "Almonds", "Greek Yogurt"].map((food, index) => (
              <Button
                key={index}
                variant="outline"
                className="p-4 h-auto flex-col space-y-2 hover:border-green-500 hover:text-green-600"
              >
                <span className="text-2xl">{["🍎", "🍌", "🥜", "🥛"][index]}</span>
                <span className="text-sm">{food}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Daily;