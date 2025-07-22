import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize with demo user or create one
  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Check if we have a stored user ID
        let userId = localStorage.getItem('fitfocus_user_id');
        
        if (userId) {
          // Try to get existing user
          try {
            const userData = await userAPI.getUser(userId);
            setUser(userData);
          } catch (error) {
            // User not found, create new one
            userId = null;
          }
        }
        
        if (!userId) {
          // Create a demo user
          const demoUser = await userAPI.createUser({
            name: "Alex",
            email: `alex.${Date.now()}@fitfocus.app`,
            age: 28,
            activity_level: "active"
          });
          
          setUser(demoUser);
          localStorage.setItem('fitfocus_user_id', demoUser.id);
        }
      } catch (error) {
        console.error('Failed to initialize user:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, []);

  const updateUser = async (updateData) => {
    try {
      const updatedUser = await userAPI.updateUser(user.id, updateData);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const createNewUser = async (userData) => {
    try {
      const newUser = await userAPI.createUser(userData);
      setUser(newUser);
      localStorage.setItem('fitfocus_user_id', newUser.id);
      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      loading,
      updateUser,
      createNewUser
    }}>
      {children}
    </UserContext.Provider>
  );
};