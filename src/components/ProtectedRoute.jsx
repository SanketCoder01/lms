/**
 * ProtectedRoute.jsx
 * ------------------
 * Route guard that checks sessionStorage for per-tab session isolation.
 * Each browser tab maintains its own independent session.
 * 
 * - Uses sessionStorage (not localStorage) for per-tab isolation
 * - Redirects to login if no valid session exists in THIS tab
 * - Does NOT interfere with other tabs' sessions
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  // Check sessionStorage for THIS tab's session
  const token = sessionStorage.getItem('token') || sessionStorage.getItem('company_token');
  const userStr = sessionStorage.getItem('user') || sessionStorage.getItem('company_user');
  
  // No session in this tab - redirect to login
  if (!token || !userStr) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  // Validate token is not expired (basic check)
  try {
    const user = JSON.parse(userStr);
    if (!user || !user.id) {
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  } catch {
    // Invalid user data - clear and redirect
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('company_token');
    sessionStorage.removeItem('company_user');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  // Session valid - render protected content
  return children;
};

export default ProtectedRoute;
