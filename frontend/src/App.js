import React, { useState } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import { Toaster } from "./components/ui/toaster";
import Dashboard from "./components/DashboardNew";
import Daily from "./components/Daily";
import Weekly from "./components/Weekly";
import Exercise from "./components/Exercise";
import Navigation from "./components/Navigation";

function App() {
  return (
    <div className="App min-h-screen bg-gray-50">
      <UserProvider>
        <BrowserRouter>
          <div className="max-w-7xl mx-auto">
            <Navigation />
            <main className="pb-20 md:pb-8">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/daily" element={<Daily />} />
                <Route path="/weekly" element={<Weekly />} />
                <Route path="/exercise" element={<Exercise />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </BrowserRouter>
      </UserProvider>
    </div>
  );
}

export default App;