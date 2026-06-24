import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

// Styling Imports
import './index.css';
import '../css/style.css'; // Legacy visual layouts and animations

// Scroll to Top Utility
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Context Provider
import { AuthProvider } from './context/AuthContext';

// Auth Route Guard
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import StartupRegistration from './pages/StartupRegistration';
import PlayerDashboard from './pages/PlayerDashboard';

// Client ID fallback check
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "dummy-client-id";

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <Routes>
            {/* Public Paths */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Protected App Paths */}
            <Route 
              path="/app/startup-registration" 
              element={
                <ProtectedRoute>
                  <StartupRegistration />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/app/dashboard" 
              element={
                <ProtectedRoute>
                  <PlayerDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
