/**
 * ProtectedRoute.jsx
 * ------------------
 * Route guard that checks sessionStorage for per-tab session isolation.
 * Each browser tab maintains its own independent session.
 * 
 * - Uses sessionStorage (not localStorage) for per-tab isolation
 * - Redirects to login if no valid session exists in THIS tab
 * - Does NOT interfere with other tabs' sessions
 * - Module sub-users are silently redirected to their assigned modules
 *   (supports multi-module access — one user can have 2+ modules)
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Allowed route prefixes per module
const MODULE_ALLOWED_ROUTES = {
  dashboard: ['/admin/dashboard'],
  masters:   [
    '/admin/filter-options',
    '/admin/parties',
    '/admin/tenants',
    '/admin/tenant',
    '/admin/add-tenant',
    '/admin/owner',
    '/admin/owners',
  ],
  leases:    ['/admin/leases', '/admin/add-lease', '/admin/edit-lease', '/admin/view-lease'],
  ownership: ['/admin/ownership-mapping'],
  projects:  [
    '/admin/projects', '/admin/add-project', '/admin/edit-project',
    '/admin/add-unit',  '/admin/edit-unit',  '/admin/view-unit',
    '/admin/unit-structure', '/admin/units',
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
    sessionStorage.removeItem('modules_access');
    sessionStorage.removeItem('is_module_user');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Module user isolation — silently redirect if accessing wrong route
  const isModuleUser  = sessionStorage.getItem('is_module_user') === '1';
  const isProjectUser = sessionStorage.getItem('is_project_user') === '1';
  const moduleName    = sessionStorage.getItem('module_name') || '';

  if (isModuleUser) {
    // Build combined allowed prefixes across ALL assigned modules
    let allAllowedPrefixes = [];
    let homeRoute = MODULE_HOME_ROUTES[moduleName] || '/admin/dashboard';

    // Read multi-module access array
    const modulesAccessStr = sessionStorage.getItem('modules_access');
    if (modulesAccessStr) {
      try {
        const modulesAccess = JSON.parse(modulesAccessStr);
        modulesAccess.forEach(({ module_name }) => {
          const prefixes = MODULE_ALLOWED_ROUTES[module_name] || [];
          allAllowedPrefixes = [...allAllowedPrefixes, ...prefixes];
        });
        if (modulesAccess.length > 0) {
          homeRoute = MODULE_HOME_ROUTES[modulesAccess[0].module_name] || '/admin/dashboard';
        }
      } catch {
        allAllowedPrefixes = MODULE_ALLOWED_ROUTES[moduleName] || [];
      }
    } else if (moduleName) {
      allAllowedPrefixes = MODULE_ALLOWED_ROUTES[moduleName] || [];
    }

    // ── Also add project routes if this module_user has project assignments ──
    const projectsAccessStr = sessionStorage.getItem('projects_access');
    if (projectsAccessStr) {
      try {
        const projectsAccess = JSON.parse(projectsAccessStr);
        if (projectsAccess.length > 0) {
          // Allow all project-related routes
          allAllowedPrefixes = [
            ...allAllowedPrefixes,
            ...MODULE_ALLOWED_ROUTES['projects'],
          ];
        }
      } catch { /* ignore */ }
    }

    const currentPath = location.pathname;
    const isAllowed   = allAllowedPrefixes.some(prefix => currentPath.startsWith(prefix));
    if (!isAllowed) {
      return <Navigate to={homeRoute} replace />;
    }
  }

  // Project user isolation - only allow projects routes
  if (isProjectUser) {
    const allowedPrefixes = MODULE_ALLOWED_ROUTES['projects'] || [];
    const currentPath     = location.pathname;
    const isAllowed = allowedPrefixes.some(prefix => currentPath.startsWith(prefix));
    if (!isAllowed) {
      return <Navigate to="/admin/projects" replace />;
    }
  }
  
  // Session valid - render protected content
  return children;
};

export default ProtectedRoute;
