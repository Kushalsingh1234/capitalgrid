import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Pulse loading HUD while token check executes
  if (loading) {
    return (
      <div className="bg-gameBg min-h-screen text-white flex items-center justify-center relative font-body">
        <div className="grid-overlay"></div>
        <div className="glow-radial-overlay"></div>
        
        <div className="glass-card max-w-sm w-full p-8 text-center border border-cyanGlow/20 relative z-10">
          <div className="w-16 h-16 border-4 border-t-cyanGlow border-r-cyanGlow/40 border-b-cyanGlow/10 border-l-cyanGlow/20 rounded-full animate-spin mx-auto mb-6"></div>
          <h3 className="font-display text-sm tracking-widest text-cyanGlow uppercase animate-pulse">
            Establishing Network Connection
          </h3>
          <p className="text-xs text-text-secondary mt-2">
            Loading secure player datastreams...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if user not verified
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Guard routing loop based on startup ownership status
  const hasStartup = user.startupExists;
  
  if (location.pathname === '/app/startup-registration' && hasStartup) {
    // If they already have a startup, don't allow them on startup registration page, send to dashboard
    return <Navigate to="/app/dashboard" replace />;
  }
  
  if (location.pathname === '/app/dashboard' && !hasStartup) {
    // If they don't have a startup, force them to startup registration page
    return <Navigate to="/app/startup-registration" replace />;
  }

  return children;
}
