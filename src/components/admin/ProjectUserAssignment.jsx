/**
 * ProjectUserAssignment.jsx
 * Admin component to assign users to specific projects with permissions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import usePermissions from '../../hooks/usePermissions';
import './ProjectUserAssignment.css';

const API = process.env.REACT_APP_API_URL || '/api';

const ProjectUserAssignment = () => {
  const navigate = useNavigate();
  const { isProjectUser, projectId } = usePermissions();
  
  // Project users shouldn't access this page
  useEffect(() => {
    if (isProjectUser) {
      navigate(`/admin/projects/${projectId}`);
    }
  }, [isProjectUser, projectId, navigate]);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    permissions: { view: true, edit: false, delete: false }
  });

  // Get company_id from session
  const companyUser = JSON.parse(sessionStorage.getItem('company_user') || '{}');
  const companyId = companyUser.company_id || companyUser.id;

  // Fetch projects on mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProjects(data.data || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectUsers = async (projectId) => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API}/project-users/project/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProjectUsers(data.projectUsers || []);
    } catch (err) {
      console.error('Failed to fetch project users:', err);
    }
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    fetchProjectUsers(project.id);
  };

  const handleOpenCreate = () => {
    setFormData({
      email: '',
      password: '',
      permissions: { view: true, edit: false, delete: false }
    });
    setEditingUser(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user) => {
    setFormData({
      email: user.email,
      password: '',
      permissions: user.permissions || { view: true, edit: false, delete: false }
    });
    setEditingUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = sessionStorage.getItem('token');
      
      if (editingUser) {
        // Update existing user
        const res = await fetch(`${API}/project-users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            permissions: formData.permissions,
            password: formData.password || undefined
          })
        });
        const data = await res.json();
        
        if (data.success) {
          showToast('User permissions updated successfully', 'success');
          fetchProjectUsers(selectedProject.id);
          setShowModal(false);
        } else {
          showToast(data.message || 'Failed to update user', 'error');
        }
      } else {
        // Create new user
        const res = await fetch(`${API}/project-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            company_id: companyId,
            project_id: selectedProject.id,
            email: formData.email,
            password: formData.password,
            permissions: formData.permissions
          })
        });
        const data = await res.json();
        
        if (data.success) {
          showToast('User assigned to project successfully', 'success');
          fetchProjectUsers(selectedProject.id);
          setShowModal(false);
        } else {
          showToast(data.message || 'Failed to assign user', 'error');
        }
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user from the project?')) return;
    
    try {
      const token = sessionStorage.getItem('token');
      const res = await fetch(`${API}/project-users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        showToast('User removed from project', 'success');
        fetchProjectUsers(selectedProject.id);
      } else {
        showToast(data.message || 'Failed to remove user', 'error');
      }
    } catch (err) {
      showToast('Network error. Please try again.', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const togglePermission = (perm) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [perm]: !prev.permissions[perm]
      }
    }));
  };

  if (loading) {
    return (
      <div className="pua-layout">
        <Sidebar />
        <div className="pua-main">
          <div className="pua-loading">Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pua-layout">
      <Sidebar />
      
      <div className="pua-main">
        <div className="pua-header">
          <h1>Project User Assignment</h1>
          <p>Assign users to specific projects with granular permissions</p>
        </div>

        {toast && (
          <div className={`pua-toast pua-toast-${toast.type}`}>
            {toast.message}
          </div>
        )}

        <div className="pua-content">
          {/* Project List */}
          <div className="pua-projects-panel">
            <h2>Select a Project</h2>
            <div className="pua-project-list">
              {projects.length === 0 ? (
                <div className="pua-empty">No projects available</div>
              ) : (
                projects.map(project => (
                  <div
                    key={project.id}
                    className={`pua-project-card ${selectedProject?.id === project.id ? 'selected' : ''}`}
                    onClick={() => handleSelectProject(project)}
                  >
                    <div className="pua-project-name">{project.project_name}</div>
                    <div className="pua-project-location">{project.location || 'No location'}</div>
                    <div className={`pua-project-status status-${project.status}`}>
                      {project.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User Assignment Panel */}
          <div className="pua-users-panel">
            {selectedProject ? (
              <>
                <div className="pua-panel-header">
                  <div>
                    <h2>{selectedProject.project_name}</h2>
                    <p>Manage user access for this project</p>
                  </div>
                  <button className="pua-btn pua-btn-primary" onClick={handleOpenCreate}>
                    + Assign User
                  </button>
                </div>

                <div className="pua-user-list">
                  {projectUsers.length === 0 ? (
                    <div className="pua-empty-state">
                      <div className="pua-empty-icon">Users</div>
                      <p>No users assigned to this project yet</p>
                      <button className="pua-btn pua-btn-secondary" onClick={handleOpenCreate}>
                        Assign First User
                      </button>
                    </div>
                  ) : (
                    <table className="pua-table">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Status</th>
                          <th>View</th>
                          <th>Edit</th>
                          <th>Delete</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectUsers.map(user => (
                          <tr key={user.id}>
                            <td>{user.email}</td>
                            <td>
                              <span className={`pua-status status-${user.status}`}>
                                {user.status}
                              </span>
                            </td>
                            <td>
                              <span className={`pua-perm ${user.permissions?.view ? 'granted' : 'denied'}`}>
                                {user.permissions?.view ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td>
                              <span className={`pua-perm ${user.permissions?.edit ? 'granted' : 'denied'}`}>
                                {user.permissions?.edit ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td>
                              <span className={`pua-perm ${user.permissions?.delete ? 'granted' : 'denied'}`}>
                                {user.permissions?.delete ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td>
                              <div className="pua-actions">
                                <button
                                  className="pua-btn-icon"
                                  onClick={() => handleOpenEdit(user)}
                                  title="Edit permissions"
                                >
                                  Edit
                                </button>
                                <button
                                  className="pua-btn-icon pua-btn-danger"
                                  onClick={() => handleDelete(user.id)}
                                  title="Remove user"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            ) : (
              <div className="pua-empty-state">
                <div className="pua-empty-icon">Select</div>
                <p>Select a project from the left panel to manage user access</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="pua-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="pua-modal" onClick={e => e.stopPropagation()}>
            <div className="pua-modal-header">
              <h3>{editingUser ? 'Edit User Permissions' : 'Assign User to Project'}</h3>
              <button className="pua-modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="pua-form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  disabled={!!editingUser}
                  required
                />
                {editingUser && (
                  <span className="pua-helper">Email cannot be changed</span>
                )}
              </div>

              <div className="pua-form-group">
                <label>{editingUser ? 'New Password (leave blank to keep current)' : 'Password *'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter password"
                  required={!editingUser}
                />
              </div>

              <div className="pua-form-group">
                <label>Permissions</label>
                <div className="pua-permissions">
                  <label className={`pua-checkbox ${formData.permissions.view ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={formData.permissions.view}
                      onChange={() => togglePermission('view')}
                    />
                    <span>View</span>
                    <span className="pua-perm-desc">Can view project details and units</span>
                  </label>

                  <label className={`pua-checkbox ${formData.permissions.edit ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={formData.permissions.edit}
                      onChange={() => togglePermission('edit')}
                    />
                    <span>Edit</span>
                    <span className="pua-perm-desc">Can add/edit units and project details</span>
                  </label>

                  <label className={`pua-checkbox ${formData.permissions.delete ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={formData.permissions.delete}
                      onChange={() => togglePermission('delete')}
                    />
                    <span>Delete</span>
                    <span className="pua-perm-desc">Can delete units and data</span>
                  </label>
                </div>
              </div>

              <div className="pua-modal-actions">
                <button type="button" className="pua-btn pua-btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="pua-btn pua-btn-primary">
                  {editingUser ? 'Save Changes' : 'Assign User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectUserAssignment;
