import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import SignupPage from './components/SignupPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';
import './App.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // const user = localStorage.getItem('user');
  
  // if (!user) {
  //   return <Navigate to="/login" />;
  // }
  
  return <>{children}</>;
};

function App() {
  const [, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    const user = localStorage.getItem('user');
    setIsLoggedIn(!!user);
  }, []);
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App
