import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ProtectedRoute component to protect routes based on authentication
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth(); // Access the current user from AuthContext

  if (!user) {
    // If user is not authenticated, redirect to the login page
    return <Navigate to="/" />;
  }

  return children; // If authenticated, render the protected component
};

export default ProtectedRoute;
