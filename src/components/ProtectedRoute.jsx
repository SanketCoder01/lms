/**
 * ProtectedRoute.jsx
 * ------------------
 * Route guard that checks sessionStorage for per-tab session isolation.
 * Each browser tab maintains its own independent session.
 * 
 * - Uses sessionStorage (not localStorage) for per-tab isolation
 * - Redirects to login if no valid session exists in THIS tab
 * - Does NOT interfere with other tabs' sessions
 * - Module sub-users are silently redirected to their assigned module
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Allowed route prefixes per module
const MODULE_ALLOWED_ROUTES = {
  dashboard: ['/admin/dashboard'],
  masters:   ['/admin/filter-options'],
  leases:    ['/admin/leases', '/admin/add-lease', '/admin/edit-lease', '/admin/view-lease'],
  ownership: ['/admin/ownership-mapping'],
  projects:  [
    '/admin/projects', '/admin/add-project', '/admin/edit-project',
    '/admin/add-unit',  '/admin/edit-unit',  '/admin/view-unit',
    '/admin/unit-structure',
  ],
};

const MODULE_HOME_ROUTES = {
  dashboard: '/admin/dashboard',
  masters:   '/admin/filter-options',
  leases:    '/admin/leases',
  ownership: '/admin/ownership-mapping',
  projects:  '/admin/projects',
};

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  // Check sessionStorage for THIS tab's session
  const token   = sessionStorage.getItem('token') || sessionStorage.getItem('company_token');
  const userStr = sessionStorage.getItem('user')  || sessionStorage.getItem('company_user');
  
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
    sessionStorage.removeItem('permissions');
    sessionStorage.removeItem('module_name');
    sessionStorage.removeItem('is_module_user');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Module user isolation — silently redirect if accessing wrong route
  const isModuleUser = sessionStorage.getItem('is_module_user') === '1';
  const moduleName   = sessionStorage.getItem('module_name') || '';

  if (isModuleUser && moduleName) {
    const allowedPrefixes = MODULE_ALLOWED_ROUTES[moduleName] || [];
    const currentPath     = location.pathname;
    const isAllowed = allowedPrefixes.some(prefix => currentPath.startsWith(prefix));
    if (!isAllowed) {
      const homeRoute = MODULE_HOME_ROUTES[moduleName] || '/admin/dashboard';
      return <Navigate to={homeRoute} replace />;
    }
  }
  
  // Session valid - render protected content
  return children;
};

export default ProtectedRoute;
