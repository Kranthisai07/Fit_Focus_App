import React, { useState, useEffect } from "react";
import { integratedMealAPI, recommendationAPI } from "../services/api";
import { useUser } from "../context/UserContext";
import { ChefHat, ShoppingCart, MapPin, ExternalLink, Sparkles, Calendar, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useToast } from "../hooks/use-toast";

const Weekly = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("meals");
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentWeekStart, setCurrentWeekStart] = useState(
    new Date(Date.now() - (new Date().getDay() * 24 * 60 * 60 * 1000)).toISOString().split('T')[0]
  );

  useEffect(() => {
    if (user) {
      loadWeeklyData();
    }
  }, [user, currentWeekStart]);

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      
      // Try to get existing weekly plan
      const plan = await integratedMealAPI.getWeeklyAIMealPlan(user.id, currentWeekStart);
      if (plan) {
        setWeeklyPlan(plan);
        
        // Get weekly summary
        const summary = await integratedMealAPI.getWeeklySummary(user.id, currentWeekStart);
        setWeeklySummary(summary);
      }
      
    } catch (error) {
      console.log('No existing weekly plan found - this is normal for new weeks');
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyAIPlan = async () => {
    try {
      setLoading(true);
      
      const result = await integratedMealAPI.createWeeklyAIMealPlan(user.id, currentWeekStart);
      setWeeklyPlan(result.meal_plan);
      
      toast({
        title: "AI Weekly Plan Generated! 🚀",
        description: "Your personalized 7-day meal plan is ready!",
      });
      
    } catch (error) {
      console.error('Failed to generate weekly plan:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to create AI meal plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const weekDays = [
    { day: "monday", label: "Mon", date: "15" },
    { day: "tuesday", label: "Tue", date: "16" },
    { day: "wednesday", label: "Wed", date: "17" },
    { day: "thursday", label: "Thu", date: "18" },
    { day: "friday", label: "Fri", date: "19" },
    { day: "saturday", label: "Sat", date: "20" },
    { day: "sunday", label: "Sun", date: "21" }
  ];

  // Generate grocery list from weekly plan
  const generateGroceryList = () => {
    if (!weeklyPlan?.meals) return { produce: [], dairy: [], protein: [], other: [] };

    const groceryItems = { produce: [], dairy: [], protein: [], other: [] };
    const ingredientCounts = {};

    // Collect all ingredients from all meals
    Object.values(weeklyPlan.meals).forEach(dayMeals => {
      Object.values(dayMeals).forEach(meal => {
        if (meal?.ingredients) {
          meal.ingredients.forEach(ingredient => {
            const key = ingredient.item.toLowerCase();
            ingredientCounts[key] = {
              item: ingredient.item,
              category: ingredient.category || 'other',
              quantity: ingredient.quantity || 'as needed'
            };
          });
        }
      });
    });

    // Organize by category
    Object.values(ingredientCounts).forEach(ingredient => {
      const category = ingredient.category === 'vegetable' ? 'produce' : 
                     ingredient.category === 'fruit' ? 'produce' :
                     ingredient.category === 'protein' ? 'protein' :
                     ingredient.category === 'dairy' ? 'dairy' : 'other';
      
      groceryItems[category].push({
        item: ingredient.item,
        quantity: ingredient.quantity,
        store: "Walmart", // Default store
        checked: false
      });
    });

    return groceryItems;
  };

  const groceryList = generateGroceryList();

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Weekly AI Meal Planning
            </h1>
            <p className="text-gray-600">AI-powered personalized meal plans and grocery lists</p>
          </div>
          
          {!weeklyPlan && (
            <Button 
              onClick={generateWeeklyAIPlan}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mt-2 md:mt-0"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating AI Plan...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} />
                  <span>Generate AI Weekly Plan</span>
                </div>
              )}
            </Button>
          )}
        </div>
      </div>

      {weeklyPlan ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="meals" className="flex items-center space-x-2">
              <ChefHat size={16} />
              <span>AI Meal Plan</span>
            </TabsTrigger>
            <TabsTrigger value="grocery" className="flex items-center space-x-2">
              <ShoppingCart size={16} />
              <span>Smart Grocery List</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center space-x-2">
              <TrendingUp size={16} />
              <span>Weekly Analytics</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="meals">
            {/* AI Plan Header */}
            <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl text-purple-700 flex items-center space-x-2">
                      <Sparkles size={20} />
                      <span>{weeklyPlan.plan_name}</span>
                    </CardTitle>
                    <p className="text-purple-600 text-sm mt-1">
                      AI-Generated for {user.name} • Week of {currentWeekStart}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white mb-2">
                      AI Optimized
                    </Badge>
                    <div className="text-sm text-purple-700">
                      <p>Total Calories: {Math.round(weeklyPlan.weekly_nutrition_summary?.calories || 0)}</p>
                      <p>Protein: {Math.round(weeklyPlan.weekly_nutrition_summary?.protein || 0)}g</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Weekly Calendar */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
              {weekDays.map((day, index) => {
                const dayMeals = weeklyPlan.meals?.[day.day] || {};
                
                return (
                  <Card key={index} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader className="pb-2">
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-800">{day.label}</h3>
                        <span className="text-2xl font-bold text-green-600">{day.date}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {['breakfast', 'lunch', 'dinner'].map((mealType) => (
                        <div key={mealType} className="text-xs">
                          <p className="font-medium text-gray-700 capitalize flex items-center space-x-1">
                            <span>{mealType.charAt(0).toUpperCase()}:</span>
                            {dayMeals[mealType]?.personalization && (
                              <Sparkles size={10} className="text-purple-500" />
                            )}
                          </p>
                          <p className="text-gray-600 truncate">
                            {dayMeals[mealType]?.title || "No meal planned"}
                          </p>
                          {dayMeals[mealType] && (
                            <p className="text-green-600 font-medium">
                              {dayMeals[mealType].nutrition_per_serving?.calories} cal
                            </p>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Featured Recipes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(weeklyPlan.meals).slice(0, 3).map((dayMeals, dayIndex) => 
                Object.entries(dayMeals).slice(0, 1).map(([mealType, recipe]) => (
                  <Card key={`${dayIndex}-${mealType}`} className="hover:shadow-lg transition-all duration-200">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{recipe.title}</CardTitle>
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                          <Sparkles size={12} className="mr-1" />
                          AI
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{recipe.recipe}</p>
                      
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <p className="text-xs text-orange-600">Calories</p>
                          <p className="font-bold text-orange-700">{recipe.nutrition_per_serving?.calories}</p>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-xs text-green-600">Protein</p>
                          <p className="font-bold text-green-700">{recipe.nutrition_per_serving?.protein}</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="text-xs text-blue-600">Time</p>
                          <p className="font-bold text-blue-700">{recipe.estimated_time?.total}</p>
                        </div>
                      </div>
                      
                      {recipe.personalization && (
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <p className="text-xs text-purple-700">
                            <strong>Personalized:</strong> {recipe.personalization.customization_reason}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-center space-x-4 mt-8">
              <Button 
                onClick={generateWeeklyAIPlan}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                <Sparkles size={16} className="mr-2" />
                Regenerate Plan
              </Button>
              <Button className="bg-green-600 hover:bg-green-700">
                <Calendar size={16} className="mr-2" />
                Save to Calendar
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="grocery">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(groceryList).map(([category, items]) => 
                items.length > 0 && (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2 capitalize">
                        <span className="text-2xl">
                          {category === 'produce' ? '🥬' : 
                           category === 'dairy' ? '🥛' : 
                           category === 'protein' ? '🥩' : '📦'}
                        </span>
                        <span>{category}</span>
                        <Badge variant="outline">{items.length} items</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center space-x-3">
                              <input type="checkbox" className="w-4 h-4 text-green-600" />
                              <div>
                                <span className="font-medium text-gray-800">{item.item}</span>
                                <p className="text-sm text-gray-600">{item.quantity}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-blue-500 text-blue-600">
                              {item.store}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {Math.round(weeklyPlan.weekly_nutrition_summary?.calories || 0)}
                  </div>
                  <p className="text-gray-600">Total Calories</p>
                  <p className="text-sm text-green-600">~{Math.round((weeklyPlan.weekly_nutrition_summary?.calories || 0) / 7)} per day</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(weeklyPlan.weekly_nutrition_summary?.protein || 0)}g
                  </div>
                  <p className="text-gray-600">Total Protein</p>
                  <p className="text-sm text-blue-600">~{Math.round((weeklyPlan.weekly_nutrition_summary?.protein || 0) / 7)}g per day</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-purple-600">21</div>
                  <p className="text-gray-600">AI Recipes</p>
                  <p className="text-sm text-purple-600">100% AI Generated</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600">{Object.keys(groceryList).reduce((sum, cat) => sum + groceryList[cat].length, 0)}</div>
                  <p className="text-gray-600">Grocery Items</p>
                  <p className="text-sm text-orange-600">Auto-generated</p>
                </CardContent>
              </Card>
            </div>
            
            {weeklySummary && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Weekly Progress Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Meal Compliance</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {Math.round(weeklySummary.compliance_rate * 100)}%
                      </p>
                      <p className="text-sm text-gray-600">
                        {weeklySummary.completed_meals_count} of {weeklySummary.planned_meals_count} meals completed
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">AI Recipe Usage</h4>
                      <p className="text-2xl font-bold text-purple-600">{weeklySummary.ai_recipes_used}</p>
                      <p className="text-sm text-gray-600">AI recipes in your plan</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">Nutrition Goal</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {Math.round((weeklySummary.actual_calories / (user.goals.daily_calories * 7)) * 100)}%
                      </p>
                      <p className="text-sm text-gray-600">Of weekly calorie target</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card className="h-96 flex items-center justify-center">
          <div className="text-center">
            <Sparkles className="mx-auto mb-4 text-purple-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Ready to Create Your AI Weekly Plan
            </h3>
            <p className="text-gray-500 mb-6 max-w-md">
              Generate a complete 7-day meal plan with personalized AI recipes, 
              nutrition optimization, and automatic grocery lists
            </p>
            <Button 
              onClick={generateWeeklyAIPlan}
              disabled={loading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating AI Plan...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Sparkles size={16} />
                  <span>Generate AI Weekly Plan</span>
                </div>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Weekly;