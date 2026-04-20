/**
 * hooks/usePermissions.js
 * 
 * Reads the current user's permissions from sessionStorage.
 * - For full company admin (type=company_user): all can() return true
 * - For module users (type=module_user): can() checks specific feature permission
 * - isModuleUser: true if logged in as a sub-user
 * - moduleName: the module this sub-user is assigned to
 * - modulePermissions: object with view, create, edit, delete permissions for the module
 */

// Define all modules with their routes
export const MODULES = [
  { key: 'dashboard', label: 'Dashboard', route: '/admin/dashboard' },
  { key: 'projects', label: 'Projects', route: '/admin/projects' },
  { key: 'masters', label: 'Masters', route: '/admin/parties' },
  { key: 'ownership', label: 'Ownership', route: '/admin/ownership-mapping' },
  { key: 'leases', label: 'Leases', route: '/admin/leases' },
];

// Action types for permissions
export const ACTIONS = ['view', 'edit', 'delete'];

const usePermissions = () => {
  // Read from sessionStorage (no state - synchronous, fast)
  const isModuleUser = sessionStorage.getItem('is_module_user') === '1';
  const moduleName = sessionStorage.getItem('module_name') || '';
  const userType = sessionStorage.getItem('user_type') || 'company_user';

  let permissions = {};
  let modulePermissions = { view: false, edit: false, delete: false };

  try {
    const raw = sessionStorage.getItem('permissions');
    if (raw) {
      permissions = JSON.parse(raw);
      // Parse module permissions if available, else the permissions object itself might be the module permissions
      if (permissions.module_permissions) {
        modulePermissions = permissions.module_permissions;
      } else if (isModuleUser) {
        modulePermissions = permissions;
      }
    }
  } catch {
    permissions = {};
  }

  /**
   * Check if the current user can perform a specific action.
   * @param {string} action - action key e.g. 'view', 'create', 'edit', 'delete'
   * @returns {boolean}
   */
  const can = (action) => {
    if (!isModuleUser) return true; // Company admins can do everything
    return !!modulePermissions[action];
  };

  /**
   * Check if user has access to a specific module
   * @param {string} moduleKey - module key e.g. 'projects', 'leases'
   * @returns {boolean}
   */
  const hasModuleAccess = (moduleKey) => {
    if (!isModuleUser) return true; // Company admins have access to everything
    return moduleName === moduleKey;
  };

  /**
   * Get all accessible modules for the current user
   * @returns {Array} - array of module objects with access info
   */
  const getAccessibleModules = () => {
    return MODULES.map(module => ({
      ...module,
      hasAccess: hasModuleAccess(module.key),
      permissions: hasModuleAccess(module.key) ? modulePermissions : null
    }));
  };

  return {
    can,
    isModuleUser,
    moduleName,
    permissions,
    modulePermissions,
    hasModuleAccess,
    getAccessibleModules,
    userType
  };
};

export default usePermissions;
