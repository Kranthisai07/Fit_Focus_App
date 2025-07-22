import React, { useState, useEffect } from "react";
import { mockData } from "../data/mock";
import { Play, Pause, RotateCcw, Trophy, Clock, Flame } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

const Exercise = () => {
  const { exercises } = mockData;
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(88); // 1:28 in seconds
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  
  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setCurrentTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };
  
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Exercise
          </h1>
          <Button variant="outline" className="hidden md:inline-flex">
            View All
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tutorial Library */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="text-yellow-500" size={24} />
                <span>Tutorial Library</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exercises.tutorials.map((tutorial) => (
                  <Card 
                    key={tutorial.id}
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => setSelectedWorkout(tutorial)}
                  >
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <div className="text-6xl mb-2 group-hover:scale-110 transition-transform duration-200">
                          {tutorial.image}
                        </div>
                        <h3 className="font-semibold text-gray-800 mb-2">{tutorial.name}</h3>
                        <div className="flex justify-center space-x-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            <Clock size={10} className="mr-1" />
                            {tutorial.duration}
                          </Badge>
                          <Badge className={`text-xs ${getDifficultyColor(tutorial.difficulty)}`}>
                            {tutorial.difficulty}
                          </Badge>
                        </div>
                      </div>
                      <Button className="w-full bg-green-600 hover:bg-green-700 group-hover:bg-green-700">
                        <Play size={16} className="mr-2" />
                        Start Workout
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Workout History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Upper Body Strength</h4>
                    <p className="text-sm text-gray-600">Yesterday • 25 min</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Completed</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Cardio Blast</h4>
                    <p className="text-sm text-gray-600">2 days ago • 30 min</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Completed</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-800">Yoga Flow</h4>
                    <p className="text-sm text-gray-600">3 days ago • 45 min</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Completed</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Custom Workout Timer */}
        <div className="lg:col-span-1">
          <Card className="mb-6 bg-gradient-to-br from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700">Custom Workout</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Current Exercise */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {exercises.customWorkout.currentExercise.name}
                </h3>
                <div className="text-5xl font-bold text-green-600 mb-2">
                  {formatTime(currentTime)}
                </div>
                <p className="text-sm text-green-600">
                  {exercises.customWorkout.currentExercise.calories}
                </p>
              </div>
              
              {/* Timer Controls */}
              <div className="flex justify-center space-x-3 mb-6">
                <Button
                  size="lg"
                  className={`rounded-full w-16 h-16 ${
                    isTimerRunning 
                      ? "bg-red-500 hover:bg-red-600" 
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                >
                  {isTimerRunning ? <Pause size={24} /> : <Play size={24} />}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full w-16 h-16"
                  onClick={() => {
                    setCurrentTime(88);
                    setIsTimerRunning(false);
                  }}
                >
                  <RotateCcw size={24} />
                </Button>
              </div>
              
              {/* Exercise List */}
              <div className="space-y-2">
                {exercises.customWorkout.exercises.map((exercise, index) => (
                  <div 
                    key={index}
                    className={`flex justify-between items-center p-3 rounded-lg transition-all duration-200 ${
                      exercise.status === 'active' 
                        ? "bg-green-100 border-2 border-green-500" 
                        : exercise.status === 'completed'
                        ? "bg-gray-100 text-gray-500"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        exercise.status === 'completed' 
                          ? "bg-green-500" 
                          : exercise.status === 'active'
                          ? "bg-green-400 animate-pulse"
                          : "bg-gray-300"
                      }`} />
                      <span className="font-medium">{exercise.name}</span>
                    </div>
                    <span className="text-sm font-mono">{exercise.duration}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Workout Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Flame className="text-orange-500" size={20} />
                    <span className="text-gray-700">Calories Burned</span>
                  </div>
                  <span className="font-bold text-orange-600">245</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Clock className="text-blue-500" size={20} />
                    <span className="text-gray-700">Active Time</span>
                  </div>
                  <span className="font-bold text-blue-600">32 min</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Trophy className="text-yellow-500" size={20} />
                    <span className="text-gray-700">Workouts</span>
                  </div>
                  <span className="font-bold text-yellow-600">2</span>
                </div>
                
                {/* Weekly Progress */}
                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Weekly Goal</span>
                    <span className="text-sm font-medium text-green-600">4/5 days</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Exercise;