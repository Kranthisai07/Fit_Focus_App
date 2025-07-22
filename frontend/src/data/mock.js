export const mockData = {
  user: {
    name: "Alex",
    caloriesRemaining: 1250,
    dailyCalorieGoal: 2000
  },
  
  dailyMacros: {
    protein: { current: 70, target: 120, unit: "g" },
    carbs: { current: 150, target: 250, unit: "g" },
    fat: { current: 40, target: 60, unit: "g" }
  },
  
  todaysMeals: {
    lunch: [
      { name: "Grilled Chicken", calories: 360, quantity: "360 cal" },
      { name: "Quinoa Salad", calories: 260, quantity: "260 cal" }
    ]
  },
  
  weeklyMealPlan: {
    dinner: {
      name: "Stir-Fried Shrimp",
      calories: 450,
      image: "🍤",
      hasRecipe: true
    }
  },
  
  groceryList: {
    produce: [
      { item: "Broccoli", store: "Walmart" },
      { item: "Bell Peppers", store: "ProDash" },
      { item: "Spinach", store: "Walmart" }
    ],
    dairy: [
      { item: "Greek Yogurt", store: "Walmart" },
      { item: "Dairy", store: "Walmart" }
    ]
  },
  
  exercises: {
    tutorials: [
      {
        id: 1,
        name: "Upper Body Strength",
        image: "💪",
        duration: "25 min",
        difficulty: "Intermediate"
      },
      {
        id: 2,
        name: "Cardio Blast",
        image: "🏃‍♀️",
        duration: "30 min",
        difficulty: "Beginner"
      },
      {
        id: 3,
        name: "Yoga Flow",
        image: "🧘‍♀️",
        duration: "45 min",
        difficulty: "All Levels"
      }
    ],
    customWorkout: {
      name: "Custom workout",
      exercises: [
        { name: "Barbell Squat", duration: "1:28", status: "completed" },
        { name: "Push-ups", duration: "0:45", status: "active" },
        { name: "Deadlifts", duration: "2:00", status: "pending" }
      ],
      currentExercise: {
        name: "Exercise 1",
        time: "1:28",
        calories: "cal. burned"
      }
    }
  },
  
  recentSearches: [
    "Chicken breast",
    "Quinoa",
    "Avocado",
    "Greek yogurt"
  ]
};