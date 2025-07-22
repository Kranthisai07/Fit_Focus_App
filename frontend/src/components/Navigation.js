import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, CalendarDays, Dumbbell } from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: "/", label: "FitFocus", icon: Home },
    { path: "/daily", label: "Daily", icon: Calendar },
    { path: "/weekly", label: "Weekly", icon: CalendarDays },
    { path: "/exercise", label: "Exercise", icon: Dumbbell }
  ];
  
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex bg-green-600 text-white p-4 shadow-lg">
        <div className="flex space-x-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 hover:bg-green-700 ${
                  location.pathname === item.path ? "bg-green-700 font-semibold" : ""
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-4 transition-all duration-200 ${
                  location.pathname === item.path 
                    ? "text-green-600" 
                    : "text-gray-500"
                }`}
              >
                <Icon size={24} />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default Navigation;