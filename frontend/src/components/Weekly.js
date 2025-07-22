import React, { useState } from "react";
import { mockData } from "../data/mock";
import { ChefHat, ShoppingCart, MapPin, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const Weekly = () => {
  const { weeklyMealPlan, groceryList } = mockData;
  const [activeTab, setActiveTab] = useState("meals");
  
  const weekDays = [
    { day: "Mon", date: "15", meals: { breakfast: "Oatmeal", lunch: "Salad", dinner: "Pasta" }},
    { day: "Tue", date: "16", meals: { breakfast: "Smoothie", lunch: "Wrap", dinner: "Stir-fry" }},
    { day: "Wed", date: "17", meals: { breakfast: "Eggs", lunch: "Soup", dinner: "Grilled Fish" }},
    { day: "Thu", date: "18", meals: { breakfast: "Yogurt", lunch: "Quinoa", dinner: "Stir-Fried Shrimp" }},
    { day: "Fri", date: "19", meals: { breakfast: "Toast", lunch: "Chicken", dinner: "Tacos" }},
    { day: "Sat", date: "20", meals: { breakfast: "Pancakes", lunch: "Burger", dinner: "Pizza" }},
    { day: "Sun", date: "21", meals: { breakfast: "Waffles", lunch: "Brunch", dinner: "Roast" }}
  ];
  
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
          Weekly Planning
        </h1>
        <p className="text-gray-600">Your personalized meal plan and grocery list</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="meals" className="flex items-center space-x-2">
            <ChefHat size={16} />
            <span>Meal Plan</span>
          </TabsTrigger>
          <TabsTrigger value="grocery" className="flex items-center space-x-2">
            <ShoppingCart size={16} />
            <span>Grocery List</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="meals">
          {/* Generated Meal Plan Header */}
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl text-green-700">Generated Meal Plan</CardTitle>
                  <p className="text-green-600 text-sm mt-1">Customized for your goals</p>
                </div>
                <Badge className="bg-green-100 text-green-700 hover:bg-green-200">
                  AI Generated
                </Badge>
              </div>
            </CardHeader>
          </Card>
          
          {/* Weekly Calendar */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
            {weekDays.map((day, index) => (
              <Card key={index} className={`hover:shadow-lg transition-all duration-200 ${
                day.day === "Thu" ? "ring-2 ring-green-500 bg-green-50" : ""
              }`}>
                <CardHeader className="pb-2">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-800">{day.day}</h3>
                    <span className="text-2xl font-bold text-green-600">{day.date}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-xs">
                    <p className="font-medium text-gray-700">B: {day.meals.breakfast}</p>
                    <p className="font-medium text-gray-700">L: {day.meals.lunch}</p>
                    <p className="font-medium text-gray-700">D: {day.meals.dinner}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Featured Recipe */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>Tonight's Dinner</span>
                <Badge variant="outline">Featured</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
                <div className="md:w-1/3">
                  <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-xl p-8 text-center">
                    <span className="text-6xl">{weeklyMealPlan.dinner.image}</span>
                  </div>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {weeklyMealPlan.dinner.name}
                  </h3>
                  <p className="text-green-600 font-semibold mb-4">
                    {weeklyMealPlan.dinner.calories} cal per serving
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">30 min</Badge>
                    <Badge variant="outline">High Protein</Badge>
                    <Badge variant="outline">Gluten Free</Badge>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <ExternalLink size={16} className="mr-2" />
                    View Recipe
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="grocery">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Produce Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🥬</span>
                  <span>Produce</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groceryList.produce.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="font-medium text-gray-800">{item.item}</span>
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-blue-500" />
                        <Badge 
                          variant="outline" 
                          className={item.store === "Walmart" ? "border-blue-500 text-blue-600" : "border-green-500 text-green-600"}
                        >
                          {item.store}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Dairy Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span className="text-2xl">🥛</span>
                  <span>Dairy</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {groceryList.dairy.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="font-medium text-gray-800">{item.item}</span>
                      <div className="flex items-center space-x-2">
                        <MapPin size={14} className="text-blue-500" />
                        <Badge 
                          variant="outline" 
                          className="border-blue-500 text-blue-600"
                        >
                          {item.store}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Store Summary */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Shopping Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-bold text-blue-700 text-2xl">4</h4>
                    <p className="text-blue-600 text-sm">Walmart Items</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h4 className="font-bold text-green-700 text-2xl">1</h4>
                    <p className="text-green-600 text-sm">ProDash Items</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-bold text-purple-700 text-2xl">$45</h4>
                    <p className="text-purple-600 text-sm">Est. Total</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <MapPin size={16} className="mr-2" />
                    Shop at Walmart
                  </Button>
                  <Button variant="outline" className="flex-1 border-green-600 text-green-600 hover:bg-green-50">
                    <MapPin size={16} className="mr-2" />
                    Shop at ProDash
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Weekly;