import React, { createContext, useContext, useState } from 'react';

// Create an AuthContext to hold authentication data
const AuthContext = createContext();

// AuthProvider component to wrap around the app and provide auth data
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    // Retrieve user from local storage on initial load
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null; // Parse and set user if exists
  });

  // Login function to set the authenticated user
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData)); // Store user in local storage
  };

  // Logout function to clear user data
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user'); // Remove user from local storage
  };

  return (
    // Provide user, login, and logout to any component that uses this context
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to access AuthContext easily
export const useAuth = () => {
  return useContext(AuthContext);
};
