import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User Management
export const userAPI = {
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  getUser: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },
  
  updateUser: async (userId, updateData) => {
    const response = await api.put(`/users/${userId}`, updateData);
    return response.data;
  }
};

// Dashboard Data
export const dashboardAPI = {
  getDashboardData: async (userId) => {
    const response = await api.get(`/dashboard/${userId}`);
    return response.data;
  }
};

// Nutrition
export const nutritionAPI = {
  searchFoods: async (query, limit = 20) => {
    const response = await api.get('/foods/search', {
      params: { q: query, limit }
    });
    return response.data;
  },
  
  logFood: async (userId, foodLog) => {
    const response = await api.post(`/nutrition/log/${userId}`, foodLog);
    return response.data;
  },
  
  getDailyNutrition: async (userId, date = null) => {
    const response = await api.get(`/nutrition/${userId}/daily`, {
      params: date ? { date_str: date } : {}
    });
    return response.data;
  }
};

// Exercise
export const exerciseAPI = {
  getExercises: async (category = null) => {
    const response = await api.get('/exercises', {
      params: category ? { category } : {}
    });
    return response.data;
  },
  
  getWorkoutTemplates: async () => {
    const response = await api.get('/workouts/templates');
    return response.data;
  },
  
  logWorkout: async (userId, workoutData) => {
    const response = await api.post(`/workouts/log/${userId}`, workoutData);
    return response.data;
  },
  
  getWorkoutHistory: async (userId, limit = 10) => {
    const response = await api.get(`/workouts/${userId}/history`, {
      params: { limit }
    });
    return response.data;
  },
  
  getExerciseStats: async (userId, days = 7) => {
    const response = await api.get(`/exercise/${userId}/stats`, {
      params: { days }
    });
    return response.data;
  }
};

// Meal Planning
export const mealPlanningAPI = {
  getRecipes: async (dietaryTags = null, limit = 20) => {
    const response = await api.get('/recipes', {
      params: { 
        dietary_tags: dietaryTags ? dietaryTags.join(',') : null,
        limit 
      }
    });
    return response.data;
  },
  
  getRecipe: async (recipeId) => {
    const response = await api.get(`/recipes/${recipeId}`);
    return response.data;
  },
  
  createMealPlan: async (userId, mealPlanData) => {
    const response = await api.post(`/meal-plans/${userId}`, mealPlanData);
    return response.data;
  },
  
  getWeeklyMealPlan: async (userId, weekStart) => {
    const response = await api.get(`/meal-plans/${userId}/weekly`, {
      params: { week_start: weekStart }
    });
    return response.data;
  },
  
  createGroceryList: async (userId, mealPlanId) => {
    const response = await api.post(`/grocery-lists/${userId}/${mealPlanId}`);
    return response.data;
  }
};

// AI Recipe Recommendations
export const recommendationAPI = {
  generateRecommendation: async (userId, mealType = 'dinner') => {
    const response = await api.post(`/recommendations/${userId}/generate`, null, {
      params: { meal_type: mealType }
    });
    return response.data;
  },
  
  getMultipleRecommendations: async (userId, count = 3) => {
    const response = await api.get(`/recommendations/${userId}/multiple`, {
      params: { count }
    });
    return response.data;
  },
  
  getRecommendationHistory: async (userId, limit = 10) => {
    const response = await api.get(`/recommendations/${userId}/history`, {
      params: { limit }
    });
    return response.data;
  },
  
  saveToMealPlan: async (userId, recommendationData, mealType = 'dinner', date = null) => {
    const response = await api.post(`/recommendations/${userId}/save-to-meal-plan`, recommendationData, {
      params: { meal_type: mealType, date }
    });
    return response.data;
  }
};

export default api;