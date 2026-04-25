/**
 * hooks/usePermissions.js
 * 
 * Reads the current user's permissions from sessionStorage.
 * - For full company admin (type=company_user): all can() return true
 * - For module users (type=module_user): supports MULTIPLE modules via modules_access array
 * - For project users (type=project_user): checks project-specific permissions
 * - hasModuleAccess(key) returns true if ANY of the user's assigned modules matches
 * - can(action) checks permissions on the module matching the current page
 */

// Define all modules with their routes (home/landing route for each)
export const MODULES = [
  { key: 'dashboard', label: 'Dashboard',  route: '/admin/dashboard' },
  { key: 'projects',  label: 'Projects',   route: '/admin/projects' },
  { key: 'masters',   label: 'Masters',    route: '/admin/filter-options' }, // also covers /admin/parties
  { key: 'ownership', label: 'Ownership',  route: '/admin/ownership-mapping' },
  { key: 'leases',    label: 'Leases',     route: '/admin/leases' },
];

// Action types for permissions
export const ACTIONS = ['view', 'create', 'edit', 'delete'];

const usePermissions = () => {
  // Read from sessionStorage (no state - synchronous, fast)
  const isModuleUser  = sessionStorage.getItem('is_module_user') === '1';
  const isProjectUser = sessionStorage.getItem('is_project_user') === '1';
  const moduleName    = sessionStorage.getItem('module_name') || ''; // primary module (legacy)
  const userType      = sessionStorage.getItem('user_type') || 'company_user';

  // Project-specific data
  const projectId   = sessionStorage.getItem('project_id') || '';
  const projectName = sessionStorage.getItem('project_name') || '';

  // ── Parse the full modules_access array (multi-module support) ──────────────
  // Shape: [{ module_name: 'leases', permissions: { view, edit, delete } }, ...]
  let modulesAccess = []; // array of { module_name, permissions }
  try {
    const raw = sessionStorage.getItem('modules_access');
    if (raw) {
      modulesAccess = JSON.parse(raw);
    }
  } catch { modulesAccess = []; }

  // ── Parse projects_access (module_user who also has project assignments) ────
  // Shape: [{ project_id, project_name, permissions, status }, ...]
  let projectsAccess = [];
  try {
    const raw = sessionStorage.getItem('projects_access');
    if (raw) projectsAccess = JSON.parse(raw);
  } catch { projectsAccess = []; }

  // Fallback: if modules_access is empty but module_name is set, build a single-entry array
  if (modulesAccess.length === 0 && moduleName) {
    let singlePerms = { view: true, edit: false, delete: false };
    try {
      const raw = sessionStorage.getItem('permissions');
      if (raw) singlePerms = JSON.parse(raw);
    } catch { /* ignore */ }
    modulesAccess = [{ module_name: moduleName, permissions: singlePerms }];
  }

  // Build a fast lookup map: module_name → permissions
  const modulePermissionsMap = {};
  modulesAccess.forEach(({ module_name, permissions }) => {
    modulePermissionsMap[module_name] = permissions || { view: true, edit: false, delete: false };
  });

  // ── Legacy single-module permissions (for components that call can() without a moduleKey) ──
  // Use primary module's permissions, or the first assigned module
  let permissions = {};
  let modulePermissions = { view: false, create: false, edit: false, delete: false };
  let projectPermissions = { view: false, edit: false, delete: false };

  try {
    const raw = sessionStorage.getItem('permissions');
    if (raw) {
      permissions = JSON.parse(raw);
      if (permissions.module_permissions) {
        modulePermissions = permissions.module_permissions;
      } else {
        // permissions IS the module permissions object
        modulePermissions = permissions;
      }
    }
  } catch { permissions = {}; }

  // Override modulePermissions from modulesAccess for the primary module
  if (moduleName && modulePermissionsMap[moduleName]) {
    modulePermissions = modulePermissionsMap[moduleName];
  }

  try {
    const projectPermsRaw = sessionStorage.getItem('project_permissions');
    if (projectPermsRaw) {
      projectPermissions = JSON.parse(projectPermsRaw);
    }
  } catch { /* ignore */ }

  /**
   * Check if the current user can perform a specific action.
   * Optionally pass a moduleKey to check permissions for a specific module.
   * @param {string} action - action key e.g. 'view', 'edit', 'delete'
   * @param {string} [forModule] - optional module key to check specific module perms
   * @returns {boolean}
   */
  // ── Helper: combined permissions across all assigned projects ───────────────
  const combinedProjectPerms = projectsAccess.reduce(
    (acc, p) => ({
      view:   acc.view   || !!p.permissions?.view,
      edit:   acc.edit   || !!p.permissions?.edit,
      delete: acc.delete || !!p.permissions?.delete,
    }),
    { view: false, edit: false, delete: false }
  );

  const can = (action, forModule) => {
    // Company admins can do everything
    if (!isModuleUser && !isProjectUser) return true;

    // Project users check project permissions
    if (isProjectUser) {
      if (projectsAccess.length > 0) {
        return !!combinedProjectPerms[action];
      }
      return !!projectPermissions[action];
    }

    // Module users
    if (isModuleUser) {
      // Special case: 'projects' module — use combined project permissions if available
      if (forModule === 'projects' && projectsAccess.length > 0) {
        return !!combinedProjectPerms[action];
      }
      if (forModule && modulePermissionsMap[forModule]) {
        return !!modulePermissionsMap[forModule][action];
      }
      // Fallback: use primary module permissions
      return !!modulePermissions[action];
    }

    return false;
  };

  /**
   * Check if user has access to a specific module.
   * For multi-module users, returns true if ANY assigned module matches.
   * @param {string} moduleKey - module key e.g. 'projects', 'leases'
   * @returns {boolean}
   */
  const hasModuleAccess = (moduleKey) => {
    // Company admins have access to everything
    if (!isModuleUser && !isProjectUser) return true;

    // Project users only have access to projects module
    if (isProjectUser) return moduleKey === 'projects';

    // Module users: check against ALL assigned modules
    if (isModuleUser) {
      // Special case: check projects_access for the 'projects' module key
      if (moduleKey === 'projects' && projectsAccess.length > 0) return true;

      // Check module_users assignments
      if (modulesAccess.length > 0) {
        return modulesAccess.some(m => m.module_name === moduleKey);
      }
      // Fallback to single module_name
      return moduleName === moduleKey;
    }

    return false;
  };

  /**
   * Get permissions for a specific module (for the current user).
   * @param {string} moduleKey
   * @returns {object} - { view, edit, delete }
   */
  const getModulePermissions = (moduleKey) => {
    if (!isModuleUser) return { view: true, edit: true, delete: true };
    // If this is the 'projects' key and the user has project assignments, derive from those
    if (moduleKey === 'projects' && projectsAccess.length > 0) {
      return combinedProjectPerms;
    }
    return modulePermissionsMap[moduleKey] || { view: false, edit: false, delete: false };
  };

  /**
   * Check if user has access to a specific project
   * @param {number} checkProjectId - project ID to check
   * @returns {boolean}
   */
  const hasProjectAccess = (checkProjectId) => {
    // Pure project_user: only their single assigned project
    if (isProjectUser) return String(projectId) === String(checkProjectId);
    // Module user with project assignments: check projectsAccess list
    if (isModuleUser && projectsAccess.length > 0) {
      return projectsAccess.some(p => String(p.project_id) === String(checkProjectId));
    }
    // Company admin or module user without project restrictions: allow all
    return true;
  };

  /**
   * Get all accessible modules for the current user with per-module permissions.
   * @returns {Array}
   */
  const getAccessibleModules = () => {
    return MODULES.map(module => {
      const access = hasModuleAccess(module.key);
      const perms  = access ? (modulePermissionsMap[module.key] || modulePermissions) : null;
      return { ...module, hasAccess: access, permissions: perms };
    });
  };

  // Names of all modules the user has access to (useful for display)
  const assignedModuleNames = modulesAccess.map(m => m.module_name);
  // Project IDs accessible to this user (for filtering project lists)
  const assignedProjectIds  = projectsAccess.map(p => p.project_id);

  return { 
    can,
    isModuleUser,
    isProjectUser,
    moduleName,
    assignedModuleNames,
    assignedProjectIds,
    modulesAccess,
    projectsAccess,
    permissions,
    modulePermissions,
    modulePermissionsMap,
    projectPermissions,
    projectId,
    projectName,
    hasModuleAccess,
    hasProjectAccess,
    getModulePermissions,
    getAccessibleModules,
    userType,
  };
};

export default usePermissions;
