import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import RegistrationForm from './components/RegistrationForm';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import EvaluationResults from './components/EvaluationResults'; // Import the new component
import ProtectedRoute from './components/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/signup" element={<RegistrationForm />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/evaluation" element={
            <ProtectedRoute>
              <EvaluationResults />
            </ProtectedRoute>
          } /> {/* New route */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
