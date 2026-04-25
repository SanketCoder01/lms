import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import "./RoleManagement.css";
// import api from services
import { userAPI, roleAPI, handleApiError } from "../../services/api";

// Module definitions for assignment
const MODULE_DEFS = {
  dashboard: { label: 'Dashboard', icon: 'Dashboard', color: '#6366f1', features: ['view', 'edit', 'delete'] },
  projects: { label: 'Projects', icon: 'Projects', color: '#8b5cf6', features: ['view', 'edit', 'delete'], isProjectModule: true },
  masters: { label: 'Masters', icon: 'Masters', color: '#f59e0b', features: ['view', 'edit', 'delete'] },
  ownership: { label: 'Ownership', icon: 'Ownership', color: '#ec4899', features: ['view', 'edit', 'delete'] },
  leases: { label: 'Leases', icon: 'Leases', color: '#10b981', features: ['view', 'edit', 'delete'] },
};

const RoleManagement = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    role_name: "User",
    status: "active",
    is_module_user: false,
    is_project_user: false,
    module_name: "",
    project_id: "",
    module_permissions: { view: true, create: false, edit: false, delete: false },
    // For multiple modules support
    selected_modules: [], // Array of { name, permissions }
    user_raw_ids: [] // For editing - array of rawIds
  });

  // Projects state for project user assignment
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // UI State
  const [roles, setRoles] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" }); // type: success | error
  const [activeActionMenu, setActiveActionMenu] = useState(null); // ID of user whose menu is open
  const actionMenuRef = useRef(null);

  // "Also grant module access" state for project user form
  const [grantModuleAccess, setGrantModuleAccess] = useState(false);
  const [projectUserModules, setProjectUserModules] = useState([]); // [{name, permissions}]

  const fetchProjects = () => {
    setLoadingProjects(true);
    userAPI.getProjects()
      .then(res => {
        const data = res.data.data || res.data || [];
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(err => console.error("Failed to load projects", err))
      .finally(() => setLoadingProjects(false));
  };

  const fetchRoles = () => {
    setRoleLoading(true);
    roleAPI.getRoles()
      .then(res => {
        const data = res.data.data || res.data;
        if (Array.isArray(data)) {
          setRoles(data);
          // Set default role if available and not already set
          if (data.length > 0 && !formData.role_name) {
            setFormData(prev => ({ ...prev, role_name: data[0].role_name }));
          }
        }
      })
      .catch(err => console.error("Failed to load roles", err))
      .finally(() => setRoleLoading(false));
  };

  const fetchUsers = () => {
    setLoading(true);
    let moduleUsersReq = userAPI.getModuleUsers ? userAPI.getModuleUsers() : Promise.resolve({ data: { moduleUsers: [] } });
    let projectUsersReq = userAPI.getAllProjectUsers ? userAPI.getAllProjectUsers() : Promise.resolve({ data: { projectUsers: [] } });

    Promise.all([userAPI.getUsers(), moduleUsersReq, projectUsersReq])
      .then(([companyRes, moduleRes, projectRes]) => {
        const cUsers = companyRes.data.map(user => ({
          id: `c_${user.id}`,
          rawId: user.id,
          name: `${user.first_name} ${user.last_name}`,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role_name || "User",
          roleClass: (user.role_name || "User").toLowerCase().replace(/\s+/g, "-"),
          isAll: ["admin", "administrator", "super admin"]
            .includes((user.role_name || "").toLowerCase()),
          status: (user.status || "active").toLowerCase(),
          is_module_user: false,
          is_project_user: false
        }));

        let modData = moduleRes.data.moduleUsers || moduleRes.data || [];
        if (!Array.isArray(modData)) modData = [];

        // Group module users by email to show multiple modules per user
        const moduleUsersByEmail = {};
        modData.forEach(u => {
          const email = u.email;
          if (!moduleUsersByEmail[email]) {
            moduleUsersByEmail[email] = {
              id: `m_${u.id}`,
              rawIds: [u.id],
              name: `${u.module_name?.charAt(0).toUpperCase() + u.module_name?.slice(1) || 'Module'} User`,
              firstName: u.first_name || '',
              lastName: u.last_name || '',
              email: email,
              role: '',
              roleClass: 'module-user',
              isAll: false,
              status: (u.status || "active").toLowerCase(),
              is_module_user: true,
              is_project_user: false,
              modules: [{ name: u.module_name, permissions: u.permissions || { view: true, edit: false, delete: false } }],
              module_permissions: u.permissions || { view: true, edit: false, delete: false }
            };
          } else {
            // Add module to existing user
            moduleUsersByEmail[email].rawIds.push(u.id);
            moduleUsersByEmail[email].modules.push({
              name: u.module_name,
              permissions: u.permissions || { view: true, edit: false, delete: false }
            });
          }
        });

        // Convert to array and format role display
        const mUsers = Object.values(moduleUsersByEmail).map(u => {
          const displayName = `${u.modules[0]?.name?.charAt(0).toUpperCase() + u.modules[0]?.name?.slice(1) || 'Module'} User`;
          return {
            ...u,
            id: `m_${u.rawIds[0]}`,
            name: displayName,
            role: u.modules.map(m => m.name.charAt(0).toUpperCase() + m.name.slice(1)).join(', ') + ' Module(s)',
            module_name: u.modules[0]?.name || '',
            rawId: u.rawIds[0] // Keep first rawId for backward compatibility
          };
        });

        let projData = projectRes.data.projectUsers || projectRes.data || [];
        if (!Array.isArray(projData)) projData = [];

        const pUsers = projData.map(u => ({
          id: `p_${u.id}`,
          rawId: u.id,
          name: u.project_name ? `${u.project_name} User` : 'Project User',
          firstName: '',
          lastName: '',
          email: u.email,
          role: u.project_name ? `${u.project_name}` : 'Project',
          roleClass: 'project-user',
          isAll: false,
          status: (u.status || "active").toLowerCase(),
          is_module_user: false,
          is_project_user: true,
          project_id: u.project_id,
          project_name: u.project_name,
          module_permissions: u.permissions || { view: true, edit: false, delete: false }
        }));

        setUsers([...cUsers, ...mUsers, ...pUsers]);
      })
      .catch(err => {
        console.error("Failed to load users", err);
        showToast("Failed to load users", "error");
      })
      .finally(() => setLoading(false));
  };

  /* =============================
     LOAD USERS FROM DATABASE
  ============================== */
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchProjects();

    // Click outside to close action menu
    const handleClickOutside = (event) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target)) {
        setActiveActionMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      email: "",
      password: "",
      role_name: roles.length > 0 ? roles[0].role_name : "Admin",
      status: "active",
      is_module_user: false,
      is_project_user: false,
      module_name: "",
      project_id: "",
      module_permissions: { view: true, edit: false, delete: false },
      selected_modules: [],
      user_raw_ids: []
    });
    setIsEditing(false);
    setCurrentUserId(null);
    setSubmitting(false);
    setGrantModuleAccess(false);
    setProjectUserModules([]);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    // Properly build selected_modules for module users
    let selectedModules = [];
    if (user.is_module_user) {
      if (user.modules && user.modules.length > 0) {
        selectedModules = user.modules.map(m => ({
          name: m.name,
          permissions: m.permissions || { view: true, edit: false, delete: false }
        }));
      } else if (user.module_name) {
        selectedModules = [{
          name: user.module_name,
          permissions: user.module_permissions || { view: true, edit: false, delete: false }
        }];
      }
    }

    setFormData({
      first_name: user.firstName || '',
      last_name: user.lastName || '',
      email: user.email,
      password: '', // Leave blank to keep existing password
      role_name: user.is_module_user || user.is_project_user ? 'User' : (user.role || 'User'),
      status: user.status || 'active',
      is_module_user: user.is_module_user || false,
      is_project_user: user.is_project_user || false,
      module_name: user.module_name || '',
      project_id: user.project_id || '',
      module_permissions: user.module_permissions || user.permissions || { view: true, edit: false, delete: false },
      selected_modules: selectedModules,
      user_raw_ids: user.rawIds || [user.rawId]
    });
    setIsEditing(true);
    setCurrentUserId(user.rawId || user.id);
    setShowModal(true);
    setActiveActionMenu(null);
  };

  const handleDelete = async (user) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        if (user.is_module_user) {
          // Delete all module assignments for this email
          if (user.rawIds && user.rawIds.length > 0) {
            // Pass module names so merged rows only lose that specific module
            const modNames = user.module_names || [];
            for (let i = 0; i < user.rawIds.length; i++) {
              await userAPI.deleteModuleUser(user.rawIds[i], modNames[i]);
            }
          } else {
            await userAPI.deleteModuleUser(user.rawId, user.module_name);
          }
        } else if (user.is_project_user) {
          await userAPI.deleteProjectUser(user.rawId);
        } else {
          await userAPI.deleteUser(user.rawId);
        }

        showToast("User deleted successfully", "success");
        // Always re-fetch from DB to ensure list is in sync
        setActiveActionMenu(null);
        fetchUsers();
      } catch (error) {
        showToast("Failed to delete user: " + handleApiError(error), "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formData.is_project_user) {
        // Project-specific user
        const company_id = sessionStorage.getItem('company_id');
        const payload = {
          company_id: company_id,
          project_id: formData.project_id,
          email: formData.email,
          password: formData.password,
          permissions: formData.module_permissions,
          first_name: formData.first_name,
          last_name: formData.last_name
        };
        if (!payload.password && !isEditing) {
          showToast("Password is required for new project users", "error");
          setSubmitting(false);
          return;
        }
        if (!payload.password) delete payload.password;
        if (!payload.company_id) {
          showToast("Company ID not found. Please re-login.", "error");
          setSubmitting(false);
          return;
        }

        if (isEditing) await userAPI.updateProjectUser(currentUserId, payload);
        else await userAPI.createProjectUser(payload);

        // If admin also wants to grant module access, create module_user rows
        if (grantModuleAccess && projectUserModules.length > 0) {
          for (const mod of projectUserModules) {
            try {
              const modPayload = {
                company_id,
                module_name: mod.name,
                email: formData.email,
                password: formData.password,
                permissions: mod.permissions,
                status: 'active',
              };
              await userAPI.createModuleUser(modPayload);
            } catch (modErr) {
              console.warn(`[grantModuleAccess] Failed for module ${mod.name}:`, modErr);
            }
          }
        }
      } else if (formData.is_module_user) {
        const company_id = sessionStorage.getItem('company_id');

        if (!company_id) {
          showToast("Company ID not found. Please re-login.", "error");
          setSubmitting(false);
          return;
        }

        if (formData.selected_modules.length === 0) {
          showToast("Please select at least one module", "error");
          setSubmitting(false);
          return;
        }

        if (isEditing) {
          // Smart edit strategy:
          // - For modules that still exist → updateModuleUser (preserves password hash)
          // - For newly added modules → createModuleUser (requires password)
          // - For removed modules → deleteModuleUser

          const newModules = formData.selected_modules;

          // Get the original module assignments from DB to build rawId→moduleName map
          const company_id_for_fetch = sessionStorage.getItem('company_id');
          let existingMap = {}; // module_name -> rawId
          try {
            const existingRes = await userAPI.getModuleUsers();
            const existingData = existingRes.data.moduleUsers || existingRes.data || [];
            existingData.forEach(mu => {
              if (mu.email === formData.email) {
                existingMap[mu.module_name] = mu.id;
              }
            });
          } catch (err) {
            console.warn('Could not fetch existing module users for smart edit:', err);
          }

          // Which module names are in the new selection
          const newModuleNames = new Set(newModules.map(m => m.name));

          // Delete removed modules — pass modName so merged rows only lose that module
          for (const [modName, rawId] of Object.entries(existingMap)) {
            if (!newModuleNames.has(modName)) {
              await userAPI.deleteModuleUser(rawId, modName);
            }
          }

          // Update or create
          for (const mod of newModules) {
            const existingRawId = existingMap[mod.name];
            if (existingRawId) {
              // Module existed — update permissions, status, name, and optionally password
              const updatePayload = {
                permissions: mod.permissions,
                status: formData.status || 'active',
              };
              if (formData.password) updatePayload.password = formData.password;
              await userAPI.updateModuleUser(existingRawId, updatePayload);
            } else {
              // New module — must create (requires password)
              if (!formData.password) {
                showToast(`Password is required when adding new module: ${mod.name}`, 'error');
                setSubmitting(false);
                return;
              }
              const createPayload = {
                company_id: company_id_for_fetch,
                module_name: mod.name,
                email: formData.email,
                password: formData.password,
                permissions: mod.permissions,
                status: formData.status || 'active',
              };
              await userAPI.createModuleUser(createPayload);
            }
          }

        } else {
          // For creating: create module entry for each selected module
          if (!formData.password) {
            showToast("Password is required for new module users", "error");
            setSubmitting(false);
            return;
          }

          for (const mod of formData.selected_modules) {
            const payload = {
              company_id,
              module_name: mod.name,
              email: formData.email,
              password: formData.password,
              permissions: mod.permissions,
              status: 'active',
            };
            await userAPI.createModuleUser(payload);
          }
        }
      } else {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;

        if (isEditing) await userAPI.updateUser(currentUserId, payload);
        else await userAPI.createUser(payload);
      }

      showToast(isEditing ? "User updated successfully" : "User created successfully", "success");
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Submission Error:", error);
      showToast(handleApiError(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActionMenu = (id, e) => {
    e.stopPropagation();
    setActiveActionMenu(activeActionMenu === id ? null : id);
  };

  /* =============================
     SEARCH FILTER
  ============================== */
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="role-management-container">
      <Sidebar />

      {/* TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`toast-notification ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <main className="role-content">

        {/* SEARCH BAR */}
        <div className="top-search-bar">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by name, email or mobile..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* HEADER */}
        <header className="role-header">
          <div className="role-title">
            <h2>Role Management</h2>
            <p>Manage user access, assign roles, and configure module permissions.</p>
          </div>

          <button className="create-user-btn" onClick={handleOpenCreate}>
            + Create New User
          </button>
        </header>

        {/* MODAL */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content premium-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header" style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10, borderRadius: '12px 12px 0 0' }}>
                <h3>{isEditing ? "Edit User" : "Create New User"}</h3>
                <button className="close-btn" onClick={() => setShowModal(false)} aria-label="Close">×</button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>User Type</label>
                  <select
                    className="premium-select"
                    value={formData.is_project_user ? "project" : (formData.is_module_user ? "module" : "company")}
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({
                        ...formData,
                        is_module_user: val === "module",
                        is_project_user: val === "project",
                        module_name: val === "project" ? "projects" : formData.module_name,
                        project_id: val === "project" ? formData.project_id : ""
                      });
                    }}
                    disabled={isEditing}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%' }}
                  >
                    <option value="company">Full Company User (Admin & Roles)</option>
                    <option value="module">Specific Module User (Restricted)</option>
                    <option value="project">Project-Specific User (Single Project Access)</option>
                  </select>
                </div>

                {!formData.is_module_user && !formData.is_project_user && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        className="premium-input"
                        value={formData.first_name}
                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                        required={!formData.is_module_user && !formData.is_project_user}
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        className="premium-input"
                        value={formData.last_name}
                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                        required={!formData.is_module_user && !formData.is_project_user}
                      />
                    </div>
                  </div>
                )}

                {formData.is_module_user && !formData.is_project_user && (
                  <>
                    {/* Show name fields for module users too */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={formData.first_name}
                          onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={formData.last_name}
                          onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Assigned Modules (select multiple)</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                        {Object.keys(MODULE_DEFS).map(key => {
                          const isSelected = formData.selected_modules.some(m => m.name === key);
                          return (
                            <label
                              key={key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                border: `2px solid ${isSelected ? MODULE_DEFS[key].color : '#e2e8f0'}`,
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? `${MODULE_DEFS[key].color}15` : 'white',
                                fontWeight: isSelected ? '600' : '400'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setFormData({
                                      ...formData,
                                      selected_modules: [...formData.selected_modules, { name: key, permissions: { view: true, edit: false, delete: false } }]
                                    });
                                  } else {
                                    setFormData({
                                      ...formData,
                                      selected_modules: formData.selected_modules.filter(m => m.name !== key)
                                    });
                                  }
                                }}
                                style={{ accentColor: MODULE_DEFS[key].color, width: '16px', height: '16px' }}
                              />
                              {MODULE_DEFS[key].label}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Show permissions for each selected module */}
                    {formData.selected_modules.length > 0 && (
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Module Permissions</label>
                        {formData.selected_modules.map((mod, idx) => (
                          <div key={mod.name} style={{ marginTop: '12px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                            <div style={{ fontWeight: '600', marginBottom: '8px', color: MODULE_DEFS[mod.name]?.color || '#333' }}>
                              {MODULE_DEFS[mod.name]?.label || mod.name}
                            </div>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                              {['view', 'edit', 'delete'].map(feat => (
                                <label key={feat} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={!!mod.permissions[feat]}
                                    onChange={e => {
                                      const updatedModules = [...formData.selected_modules];
                                      updatedModules[idx] = {
                                        ...mod,
                                        permissions: { ...mod.permissions, [feat]: e.target.checked }
                                      };
                                      setFormData({ ...formData, selected_modules: updatedModules });
                                    }}
                                    style={{ accentColor: 'var(--primary-color)', width: '14px', height: '14px' }}
                                  />
                                  {feat.charAt(0).toUpperCase() + feat.slice(1)}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {formData.is_project_user && (
                  <>
                    {/* Show name fields for project users too */}
                    <div className="form-row">
                      <div className="form-group">
                        <label>First Name</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={formData.first_name}
                          onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name</label>
                        <input
                          type="text"
                          className="premium-input"
                          value={formData.last_name}
                          onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Assigned Project</label>
                      <select
                        className="premium-select"
                        value={formData.project_id}
                        onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                        required={formData.is_project_user}
                        disabled={loadingProjects}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', width: '100%' }}
                      >
                        <option value="">{loadingProjects ? 'Loading projects...' : 'Select a project...'}</option>
                        {projects.map(p => (
                          <option key={p.id} value={p.id}>{p.project_name} {p.location ? `(${p.location})` : ''}</option>
                        ))}
                      </select>
                    </div>

                    {formData.project_id && (
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label>Project Permissions</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                          {['view', 'edit', 'delete'].map(feat => (
                            <label key={feat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={!!formData.module_permissions[feat]}
                                onChange={e => setFormData({ ...formData, module_permissions: { ...formData.module_permissions, [feat]: e.target.checked } })}
                                style={{ accentColor: 'var(--primary-color)', width: '14px', height: '14px' }}
                              />
                              {feat.charAt(0).toUpperCase() + feat.slice(1)} Access
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Also grant module access ──────────────────────── */}
                    <div className="form-group" style={{ marginTop: 8, padding: '12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13.5 }}>
                        <input
                          type="checkbox"
                          checked={grantModuleAccess}
                          onChange={e => {
                            setGrantModuleAccess(e.target.checked);
                            if (!e.target.checked) setProjectUserModules([]);
                          }}
                          style={{ accentColor: 'var(--primary-color)', width: 15, height: 15 }}
                        />
                        Also grant module access to this user
                      </label>

                      {grantModuleAccess && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>Select modules and permissions:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                            {Object.keys(MODULE_DEFS).map(key => {
                              const isSel = projectUserModules.some(m => m.name === key);
                              return (
                                <label key={key} style={{
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  padding: '6px 10px', border: `2px solid ${isSel ? MODULE_DEFS[key].color : '#e2e8f0'}`,
                                  borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontWeight: isSel ? 600 : 400,
                                  background: isSel ? `${MODULE_DEFS[key].color}15` : 'white',
                                }}>
                                  <input
                                    type="checkbox"
                                    checked={isSel}
                                    onChange={ev => {
                                      if (ev.target.checked) {
                                        setProjectUserModules(prev => [...prev, { name: key, permissions: { view: true, edit: false, delete: false } }]);
                                      } else {
                                        setProjectUserModules(prev => prev.filter(m => m.name !== key));
                                      }
                                    }}
                                    style={{ accentColor: MODULE_DEFS[key].color, width: 13, height: 13 }}
                                  />
                                  {MODULE_DEFS[key].label}
                                </label>
                              );
                            })}
                          </div>
                          {projectUserModules.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {projectUserModules.map((mod, idx) => (
                                <div key={mod.name} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 7, background: 'white' }}>
                                  <div style={{ fontWeight: 600, fontSize: 12, color: MODULE_DEFS[mod.name]?.color || '#333', marginBottom: 6 }}>{MODULE_DEFS[mod.name]?.label}</div>
                                  <div style={{ display: 'flex', gap: 12 }}>
                                    {['view', 'edit', 'delete'].map(feat => (
                                      <label key={feat} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, cursor: 'pointer' }}>
                                        <input
                                          type="checkbox"
                                          checked={!!mod.permissions[feat]}
                                          onChange={ev => {
                                            const updated = [...projectUserModules];
                                            updated[idx] = { ...mod, permissions: { ...mod.permissions, [feat]: ev.target.checked } };
                                            setProjectUserModules(updated);
                                          }}
                                          style={{ accentColor: 'var(--primary-color)', width: 13, height: 13 }}
                                        />
                                        {feat.charAt(0).toUpperCase() + feat.slice(1)}
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    className="premium-input"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isEditing} // Prevent changing email on edit if desired, or allow it
                  />
                  {isEditing && <span className="helper-text">Email acts as unique identifier</span>}
                </div>

                <div className="form-group">
                  <label>{isEditing ? "Password (Leave blank to keep current)" : "Password"}</label>
                  <input
                    type="password"
                    className="premium-input"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required={!isEditing}
                  />
                </div>

                {!formData.is_module_user && !formData.is_project_user && (
                  <>
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        className="premium-select"
                        value={formData.role_name}
                        onChange={e => setFormData({ ...formData, role_name: e.target.value })}
                        disabled={roleLoading}
                      >
                        {roles.length === 0 && <option value="">Loading roles...</option>}
                        {roles.map(r => (
                          <option key={r.id} value={r.role_name}>{r.role_name}</option>
                        ))}
                      </select>
                    </div>

                    {isEditing && (
                      <div className="form-group">
                        <label>Status</label>
                        <select
                          className="premium-select"
                          value={formData.status}
                          onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {/* Status for module/project users in edit mode */}
                {isEditing && (formData.is_module_user || formData.is_project_user) && (
                  <div className="form-group">
                    <label>Account Status</label>
                    <select
                      className="premium-select"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                )}

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create User")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STATS SECTION */}
        <section className="stats-grid">
          <div className="stats-card">
            <h3>Total Users</h3>
            <div className="stat-value">{users.length}</div>
          </div>

          <div className="stats-card">
            <h3>Active Administrators</h3>
            <div className="stat-value">
              {users.filter(
                u => u.role?.toLowerCase().includes("admin") && u.status === "active"
              ).length}
            </div>
          </div>

          <div className="stats-card">
            <h3>Lease Managers</h3>
            <div className="stat-value">
              {users.filter(u => u.role?.toLowerCase().includes("manager")).length}
            </div>
          </div>

          <div className="stats-card">
            <h3>Pending Invites</h3>
            <div className="stat-value">0</div>
          </div>
        </section>

        {/* USERS TABLE */}
        <section className="role-table-container">

          {/* TABLE HEADER */}
          <div className="role-table-header">
            <div></div>
            <div>User Info</div>
            <div>Role</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {loading ? <div className="loading-row">Loading users...</div> : filteredUsers.map(user => (
            <div className="user-row" key={user.id}>

              {/* RADIO */}
              <div className="checkbox-wrapper">
                <input type="radio" />
              </div>

              {/* USER INFO */}
              <div className="user-info">
                <div className="user-avatar-initials" style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: `hsl(${(user.name.charCodeAt(0) * 37) % 360}, 55%, 55%)`,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  flexShrink: 0,
                  letterSpacing: '0.5px'
                }}>
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="user-details">
                  <h4>{user.name}</h4>
                  <span>{user.email}</span>
                </div>
              </div>

              {/* ROLE */}
              <div>
                <span className={`role-badge ${user.roleClass}`}>
                  {user.role}
                </span>
              </div>

              {/* STATUS */}
              <div className="status-column">
                <span className={`status ${user.status}`}>
                  {user.status === "inactive" ? "Inactive" : "Active"}
                </span>
              </div>

              {/* ACTIONS */}
              <div className="actions-column">
                <button className="action-btn" onClick={(e) => toggleActionMenu(user.id, e)}>⋮</button>
                {activeActionMenu === user.id && (
                  <div className="action-menu" ref={actionMenuRef} style={{ bottom: user.id === filteredUsers[filteredUsers.length - 1]?.id ? '100%' : 'auto', top: user.id === filteredUsers[filteredUsers.length - 1]?.id ? 'auto' : '100%' }}>
                    <button onClick={() => handleOpenEdit(user)}>✏️ Edit</button>
                    <button className="delete" onClick={() => handleDelete(user)}>🗑️ Delete</button>
                  </div>
                )}
              </div>

            </div>
          ))}
          {!loading && filteredUsers.length === 0 && <div className="loading-row">No users found.</div>}
        </section>

        {/* FOOTER */}
        <footer className="table-footer">
          Showing {filteredUsers.length} of {users.length} users
        </footer>

      </main>
    </div>
  );
};

export default RoleManagement;
