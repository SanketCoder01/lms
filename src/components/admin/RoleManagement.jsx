import React, { useEffect, useState, useRef } from "react";
import Sidebar from "./Sidebar";
import "./RoleManagement.css";
// import api from services
import { userAPI, roleAPI, handleApiError } from "../../services/api";

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
    status: "active"
  });

  // UI State
  const [roles, setRoles] = useState([]);
  const [roleLoading, setRoleLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" }); // type: success | error
  const [activeActionMenu, setActiveActionMenu] = useState(null); // ID of user whose menu is open
  const actionMenuRef = useRef(null);

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
    userAPI.getUsers()
      .then(res => {
        const data = res.data;
        const formattedUsers = data.map(user => ({
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role_name || "User",
          roleClass: (user.role_name || "User").toLowerCase().replace(/\s+/g, "-"),
          isAll: ["admin", "administrator", "super admin"]
            .includes((user.role_name || "").toLowerCase()),
          status: (user.status || "active").toLowerCase()
        }));

        setUsers(formattedUsers);
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
      status: "active"
    });
    setIsEditing(false);
    setCurrentUserId(null);
    setSubmitting(false);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setFormData({
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      password: "", // User can leave blank to keep existing
      role_name: user.role,
      status: user.status
    });
    setIsEditing(true);
    setCurrentUserId(user.id);
    setShowModal(true);
    setActiveActionMenu(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await userAPI.deleteUser(id);
        showToast("User deleted successfully", "success");
        fetchUsers();
      } catch (error) {
        showToast("Failed to delete user: " + handleApiError(error), "error");
      }
      setActiveActionMenu(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditing) {
        // Update User
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Don't send empty password

        await userAPI.updateUser(currentUserId, payload);
        showToast("User updated successfully", "success");
      } else {
        // Create User
        await userAPI.createUser(formData);
        showToast("User created successfully", "success");
      }

      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error("Submission Error:", error);
      const msg = handleApiError(error);
      showToast(msg, "error");
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
          <div className="modal-overlay">
            <div className="modal-content premium-modal">
              <div className="modal-header">
                <h3>{isEditing ? "Edit User" : "Create New User"}</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      className="premium-input"
                      value={formData.first_name}
                      onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      className="premium-input"
                      value={formData.last_name}
                      onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

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
                  <div className="action-menu" ref={actionMenuRef}>
                    <button onClick={() => handleOpenEdit(user)}>Edit</button>
                    <button className="delete" onClick={() => handleDelete(user.id)}>Delete</button>
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
