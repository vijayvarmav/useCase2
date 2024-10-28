import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegistrationForm from './components/RegistrationForm';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import RequirementsDisplay from './components/RequirementsDisplay'; 
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  return (
    // Provides authentication context to the whole app
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<RegistrationForm />} />
          <Route
            path="/dashboard"
            element={
              // Protects the Dashboard route to only allow access if authenticated
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/requirements" element={
            <ProtectedRoute>
              <RequirementsDisplay />
            </ProtectedRoute>
            } /> {/* New route */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
