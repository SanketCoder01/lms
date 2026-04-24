import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout, { SA_API, saFetch } from './SuperAdminLayout';

// ─── Per-module feature labels ───────────────────────────────────────────────
const MODULE_DEFS = {
  dashboard: {
    label: 'Dashboard',
    icon: 'Dashboard',
    color: '#6366f1',
    features: {
      view: 'View Access',
      edit: 'Create/Edit',
      delete: 'Delete/Remove',
    },
  },
  masters: {
    label: 'Masters',
    icon: 'Masters',
    color: '#f59e0b',
    features: {
      view: 'View Access',
      edit: 'Create/Edit',
      delete: 'Delete/Remove',
    },
  },
  leases: {
    label: 'Leases',
    icon: 'Leases',
    color: '#10b981',
    features: {
      view: 'View Access',
      edit: 'Create/Edit',
      delete: 'Delete/Remove',
    },
  },
  ownership: {
    label: 'Ownership',
    icon: 'Ownership',
    color: '#ec4899',
    features: {
      view: 'View Access',
      edit: 'Create/Edit',
      delete: 'Delete/Remove',
    },
  },
  projects: {
    label: 'Projects',
    icon: 'Projects',
    color: '#8b5cf6',
    features: {
      view: 'View Access',
      edit: 'Create/Edit (Add Units)',
      delete: 'Delete/Remove',
    },
    isProjectModule: true, // Special flag for project-specific assignment
  },
};

const MODULE_KEYS = Object.keys(MODULE_DEFS);

// ─── Assign Modal ─────────────────────────────────────────────────────────────
const AssignModal = ({ company, moduleName, onClose, onSave }) => {
  const def = MODULE_DEFS[moduleName];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [perms, setPerms] = useState({
    view: true,
    edit: false,
    delete: false
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const toggleAll = (val) => {
    const p = {};
    Object.keys(def.features).forEach(k => { p[k] = val; });
    setPerms(p);
  };

  const handleSave = async () => {
    if (!email || !password) { setErr('Email and password are required.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/module-users`, {
        method: 'POST',
        body: JSON.stringify({
          company_id: company.id,
          module_name: moduleName,
          email,
          password,
          permissions: perms,
        }),
      });
      if (res.success) { onSave(); onClose(); }
      else setErr(res.message || 'Failed to assign user.');
    } catch (e) { setErr(e.message || 'Network error.'); }
    setSaving(false);
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>{def.icon} Assign User — {def.label}</h3>
          <button className="sa-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '0 4px' }}>
          <p style={{ color: 'var(--sa-muted)', fontSize: 13, marginBottom: 16 }}>
            Company: <strong style={{ color: 'var(--sa-text)' }}>{company.company_name}</strong>
          </p>

          {err && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
              {err}
            </div>
          )}

          <div className="sa-form-group">
            <label>Email Address *</label>
            <input type="email" placeholder="user@company.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="sa-form-group">
            <label>Password *</label>
            <input type="password" placeholder="Set login password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          {/* Feature Permissions */}
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sa-text)' }}>Feature Permissions</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={() => toggleAll(true)}>Select All</button>
                <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={() => toggleAll(false)}>Clear All</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(def.features).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--sa-border)', background: perms[key] ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'all 0.15s' }}>
                  <input
                    type="checkbox"
                    checked={!!perms[key]}
                    onChange={e => setPerms({ ...perms, [key]: e.target.checked })}
                    style={{ accentColor: 'var(--sa-primary)', width: 15, height: 15 }}
                  />
                  <span style={{ fontSize: 12.5, color: perms[key] ? 'var(--sa-text)' : 'var(--sa-muted)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="sa-modal-actions" style={{ marginTop: 20 }}>
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="sa-btn sa-btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? <><span className="sa-spinner" />Saving…</> : '✅ Assign User'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Edit Permissions Modal ───────────────────────────────────────────────────
const EditPermsModal = ({ moduleUser, moduleName, onClose, onSave }) => {
  const def = MODULE_DEFS[moduleName];
  const [perms, setPerms] = useState({ ...moduleUser.permissions });
  const [password, setPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const toggleAll = (val) => {
    const p = {};
    Object.keys(def.features).forEach(k => { p[k] = val; });
    setPerms(p);
  };

  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      const body = { permissions: perms };
      if (password) body.password = password;
      const res = await saFetch(`${SA_API}/api/super-admin/module-users/${moduleUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      if (res.success) { onSave(); onClose(); }
      else setErr(res.message || 'Failed to update.');
    } catch (e) { setErr(e.message || 'Network error.'); }
    setSaving(false);
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" style={{ width: 520, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>✏️ Edit — {def.icon} {def.label}</h3>
          <button className="sa-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: '0 4px' }}>
          <p style={{ color: 'var(--sa-muted)', fontSize: 13, marginBottom: 16 }}>
            Assigned to: <strong style={{ color: 'var(--sa-text)' }}>{moduleUser.email}</strong>
          </p>

          {err && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
              {err}
            </div>
          )}

          <div className="sa-form-group">
            <label>New Password <span style={{ color: 'var(--sa-muted)', fontWeight: 400, fontSize: 12 }}>(leave blank to keep current)</span></label>
            <input type="password" placeholder="New password (optional)" value={password} onChange={e => setPass(e.target.value)} />
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--sa-text)' }}>Feature Permissions</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={() => toggleAll(true)}>Select All</button>
                <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={() => toggleAll(false)}>Clear All</button>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {Object.entries(def.features).map(([key, label]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--sa-border)', background: perms[key] ? 'rgba(99,102,241,0.08)' : 'transparent', transition: 'all 0.15s' }}>
                  <input
                    type="checkbox"
                    checked={!!perms[key]}
                    onChange={e => setPerms({ ...perms, [key]: e.target.checked })}
                    style={{ accentColor: 'var(--sa-primary)', width: 15, height: 15 }}
                  />
                  <span style={{ fontSize: 12.5, color: perms[key] ? 'var(--sa-text)' : 'var(--sa-muted)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="sa-modal-actions" style={{ marginTop: 20 }}>
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="sa-btn sa-btn-primary" disabled={saving} onClick={handleSave}>
            {saving ? <><span className="sa-spinner" />Saving…</> : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Project Assign Modal (for project-specific users) ---
const ProjectAssignModal = ({ company, onClose, onSave, notify }) => {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'create'
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    permissions: { view: true, edit: false, delete: false }
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Create-project form
  const [createForm, setCreateForm] = useState({
    project_name: '', location: '', address: '', project_type: '',
    calculation_type: 'Chargeable Area', total_floors: '', total_project_area: '', description: '',
    project_limit: ''
  });
  const [createSaving, setCreateSaving] = useState(false);
  const [createErr, setCreateErr] = useState('');
  const [createdProject, setCreatedProject] = useState(null);
  const [assignAfter, setAssignAfter] = useState({ email: '', password: '', permissions: { view: true, edit: false, delete: false } });
  const [limitInfo, setLimitInfo] = useState(null); // { project_limit, current_count, remaining }

  // Manage-Quota tab state
  const [quotaInput, setQuotaInput] = useState('');
  const [quotaSaving, setQuotaSaving] = useState(false);
  const [quotaMsg, setQuotaMsg] = useState({ type: '', text: '' });

  // Load projects + limit for this company
  useEffect(() => {
    const loadProjects = async () => {
      setLoadingProjects(true);
      try {
        const [projRes, limitRes] = await Promise.all([
          saFetch(`${SA_API}/api/super-admin/company-projects/${company.id}`),
          saFetch(`${SA_API}/api/super-admin/company-project-limit/${company.id}`),
        ]);
        if (projRes.success) setProjects(projRes.projects || []);
        if (limitRes.success) setLimitInfo(limitRes);
      } catch (e) { console.error(e); }
      setLoadingProjects(false);
    };
    loadProjects();
  }, [company.id]);

  // Load project users when project selected
  const loadProjectUsers = async (projectId) => {
    try {
      const res = await saFetch(`${SA_API}/api/project-users/project/${projectId}`);
      if (res.success) setProjectUsers(res.projectUsers || []);
    } catch (e) { console.error(e); }
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setProjectUsers([]);
    setShowUserForm(false);
    setEditingUser(null);
    loadProjectUsers(project.id);
  };

  const togglePerm = (key) => {
    setFormData(prev => ({
      ...prev,
      permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
    }));
  };

  const handleSaveUser = async () => {
    if (!formData.email || (!formData.password && !editingUser)) {
      setErr('Email and password are required.');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      if (editingUser) {
        // Update existing
        const body = { permissions: formData.permissions };
        if (formData.password) body.password = formData.password;
        const res = await saFetch(`${SA_API}/api/project-users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
        if (res.success) {
          notify('success', 'User permissions updated!');
          loadProjectUsers(selectedProject.id);
          setShowUserForm(false);
          setEditingUser(null);
        } else setErr(res.message || 'Failed to update.');
      } else {
        // Create new
        const res = await saFetch(`${SA_API}/api/project-users`, {
          method: 'POST',
          body: JSON.stringify({
            company_id: company.id,
            project_id: selectedProject.id,
            email: formData.email,
            password: formData.password,
            permissions: formData.permissions,
          }),
        });
        if (res.success) {
          notify('success', 'User assigned to project!');
          loadProjectUsers(selectedProject.id);
          setShowUserForm(false);
        } else setErr(res.message || 'Failed to assign.');
      }
    } catch (e) { setErr(e.message || 'Network error.'); }
    setSaving(false);
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Remove this user from the project?')) return;
    try {
      const res = await saFetch(`${SA_API}/api/project-users/${userId}`, { method: 'DELETE' });
      if (res.success) {
        notify('success', 'User removed from project.');
        loadProjectUsers(selectedProject.id);
      }
    } catch (e) { notify('error', 'Failed to remove.'); }
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      permissions: user.permissions || { view: true, edit: false, delete: false }
    });
    setShowUserForm(true);
  };

  const openAddUser = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', permissions: { view: true, edit: false, delete: false } });
    setShowUserForm(true);
  };

  const reloadProjects = async () => {
    setLoadingProjects(true);
    try {
      const [projRes, limitRes] = await Promise.all([
        saFetch(`${SA_API}/api/super-admin/company-projects/${company.id}`),
        saFetch(`${SA_API}/api/super-admin/company-project-limit/${company.id}`),
      ]);
      if (projRes.success) setProjects(projRes.projects || []);
      if (limitRes.success) setLimitInfo(limitRes);
    } catch (e) { console.error(e); }
    setLoadingProjects(false);
  };

  // ── Delete a company project (SA only) ─────────────────────────────
  const [deletingProjectId, setDeletingProjectId] = useState(null);

  const handleDeleteProject = async (project, e) => {
    e.stopPropagation(); // don't select the project on click
    if (!window.confirm(`Delete project "${project.project_name}" for ${company.company_name}?\n\nThis will permanently remove it along with all associated units and assignments.`)) return;
    setDeletingProjectId(project.id);
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/company-projects/${project.id}`, { method: 'DELETE' });
      if (res.success) {
        notify('success', `Project "${project.project_name}" deleted.`);
        if (selectedProject?.id === project.id) { setSelectedProject(null); setProjectUsers([]); }
        await reloadProjects();
      } else {
        notify('error', res.message || 'Failed to delete project.');
      }
    } catch (e2) { notify('error', e2.message || 'Network error.'); }
    setDeletingProjectId(null);
  };

  const handleCreateProject = async () => {
    if (!createForm.project_name.trim()) { setCreateErr('Project name is required.'); return; }
    setCreateSaving(true); setCreateErr('');
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/company-projects`, {
        method: 'POST',
        body: JSON.stringify({ company_id: company.id, ...createForm }),
      });
      if (res.success) {
        notify('success', `Project "${res.project.project_name}" created!`);
        setCreatedProject(res.project);
        // Update limit info from the response
        if (res.project_limit !== undefined) {
          setLimitInfo(prev => ({ ...prev, current_count: res.current_count, project_limit: res.project_limit, remaining: res.project_limit ? Math.max(0, res.project_limit - res.current_count) : null }));
          // Sync quota input with new limit
          if (res.project_limit) setQuotaInput(String(res.project_limit));
        }
        reloadProjects();
      } else setCreateErr(res.message || 'Failed.');
    } catch (e) { setCreateErr(e.message || 'Network error.'); }
    setCreateSaving(false);
  };

  const handleAssignAfterCreate = async () => {
    if (!assignAfter.email || !assignAfter.password) { setCreateErr('Email and password required.'); return; }
    setCreateSaving(true); setCreateErr('');
    try {
      const res = await saFetch(`${SA_API}/api/project-users`, {
        method: 'POST',
        body: JSON.stringify({ company_id: company.id, project_id: createdProject.id, email: assignAfter.email, password: assignAfter.password, permissions: assignAfter.permissions }),
      });
      if (res.success) {
        notify('success', 'User assigned to new project!');
        setCreatedProject(null);
        setCreateForm({ project_name: '', location: '', address: '', project_type: '', calculation_type: 'Chargeable Area', total_floors: '', total_project_area: '', description: '' });
        setActiveTab('users');
      } else setCreateErr(res.message || 'Failed.');
    } catch (e) { setCreateErr(e.message || 'Network error.'); }
    setCreateSaving(false);
  };

  // ── Standalone quota update (no project creation) ─────────────────────────
  const handleUpdateQuota = async () => {
    if (!quotaInput || isNaN(parseInt(quotaInput))) { setQuotaMsg({ type: 'err', text: 'Enter a valid number (1–50).' }); return; }
    const newLimit = parseInt(quotaInput);
    if (newLimit < 1 || newLimit > 50) { setQuotaMsg({ type: 'err', text: 'Limit must be between 1 and 50.' }); return; }
    setQuotaSaving(true); setQuotaMsg({ type: '', text: '' });
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/update-company-quota`, {
        method: 'POST',
        body: JSON.stringify({ company_id: company.id, project_limit: newLimit }),
      });
      if (res.success) {
        setLimitInfo(prev => ({
          ...prev,
          project_limit: newLimit,
          remaining: Math.max(0, newLimit - (prev?.current_count || 0)),
        }));
        setQuotaMsg({ type: 'ok', text: `✅ Quota updated to ${newLimit} project${newLimit !== 1 ? 's' : ''} successfully.` });
        notify('success', `Quota for ${company.company_name} set to ${newLimit}.`);
      } else {
        setQuotaMsg({ type: 'err', text: res.message || 'Failed to update quota.' });
      }
    } catch (e) { setQuotaMsg({ type: 'err', text: e.message || 'Network error.' }); }
    setQuotaSaving(false);
  };

  const handleRemoveQuota = async () => {
    if (!window.confirm('Remove the project limit for this company? They will have unlimited projects.')) return;
    setQuotaSaving(true); setQuotaMsg({ type: '', text: '' });
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/update-company-quota`, {
        method: 'POST',
        body: JSON.stringify({ company_id: company.id, project_limit: null }),
      });
      if (res.success) {
        setLimitInfo(prev => ({ ...prev, project_limit: null, remaining: null }));
        setQuotaInput('');
        setQuotaMsg({ type: 'ok', text: '✅ Quota removed — company now has unlimited projects.' });
        notify('success', `Quota removed for ${company.company_name}.`);
      } else {
        setQuotaMsg({ type: 'err', text: res.message || 'Failed.' });
      }
    } catch (e) { setQuotaMsg({ type: 'err', text: e.message || 'Network error.' }); }
    setQuotaSaving(false);
  };

  const inpS = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid var(--sa-border)', fontSize: 13, background: 'transparent', color: 'var(--sa-text)', boxSizing: 'border-box' };
  const lblS = { fontSize: 11, color: 'var(--sa-muted)', display: 'block', marginBottom: 4 };
  const permBadge = (v) => (
    <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: v ? 'rgba(16,185,129,0.15)' : 'rgba(156,163,175,0.15)', color: v ? '#34d399' : 'var(--sa-muted)' }}>{v ? 'Yes' : 'No'}</span>
  );

  return (

    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" style={{ width: 860, maxHeight: '92vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>🏗️ Projects — {company.company_name}</h3>
          <button className="sa-modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--sa-border)', marginBottom: 16 }}>
          {[
            { key: 'users', label: '👥 Manage Project Users' },
            { key: 'create', label: '➕ Create New Project' },
            { key: 'quota', label: '📊 Manage Quota' },
          ].map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setCreatedProject(null); setCreateErr(''); setErr(''); setQuotaMsg({ type: '', text: '' }); }}
              style={{ padding: '10px 20px', border: 'none', borderBottom: activeTab === tab.key ? '2px solid var(--sa-primary)' : '2px solid transparent', background: 'transparent', color: activeTab === tab.key ? 'var(--sa-primary)' : 'var(--sa-muted)', fontWeight: activeTab === tab.key ? 700 : 400, fontSize: 13, cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '0 4px' }}>
          {/* ── TAB 1: Manage Users ─────────────────────────── */}
          {activeTab === 'users' && (
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
              {/* Project list */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sa-text)', marginBottom: 8 }}>Select Project</div>
                {loadingProjects ? (
                  <div className="sa-loading" style={{ padding: 20 }}><span className="sa-spinner" /> Loading...</div>
                ) : projects.length === 0 ? (
                  <div style={{ padding: 16, textAlign: 'center', color: 'var(--sa-muted)', fontSize: 12, border: '1px dashed var(--sa-border)', borderRadius: 8 }}>
                    No projects yet.<br />Use "Create New Project" tab.
                  </div>
                ) : (
                  <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid var(--sa-border)', borderRadius: 8 }}>
                    {projects.map(p => (
                      <div key={p.id}
                        onClick={() => handleSelectProject(p)}
                        style={{
                          padding: '11px 14px', cursor: 'pointer', borderBottom: '1px solid var(--sa-border)',
                          background: selectedProject?.id === p.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                          borderLeft: selectedProject?.id === p.id ? '3px solid var(--sa-primary)' : '3px solid transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                        }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--sa-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.project_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>{p.location || 'No location'}</div>
                        </div>
                        <button
                          title="Delete project"
                          disabled={deletingProjectId === p.id}
                          onClick={(e) => handleDeleteProject(p, e)}
                          style={{
                            flexShrink: 0, padding: '4px 7px', borderRadius: 5, border: '1px solid rgba(239,68,68,0.3)',
                            background: 'rgba(239,68,68,0.07)', color: '#f87171',
                            cursor: deletingProjectId === p.id ? 'not-allowed' : 'pointer',
                            fontSize: 12, lineHeight: 1, opacity: deletingProjectId === p.id ? 0.5 : 1,
                          }}
                        >
                          {deletingProjectId === p.id ? '…' : '🗑️'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: users panel */}
              <div>
                {!selectedProject ? (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--sa-muted)', fontSize: 13, border: '1px dashed var(--sa-border)', borderRadius: 8 }}>Select a project to manage access</div>
                ) : (
                  <>
                    {err && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 10 }}>{err}</div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sa-text)' }}>{selectedProject.project_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>Assign users with permissions</div>
                      </div>
                      <button className="sa-btn sa-btn-primary sa-btn-sm" onClick={openAddUser}>+ Assign User</button>
                    </div>

                    {showUserForm && (
                      <div style={{ background: 'var(--sa-card)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: 14, marginBottom: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{editingUser ? `Edit: ${editingUser.email}` : 'New Project User'}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                          <div>
                            <label style={lblS}>Email *</label>
                            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editingUser} placeholder="user@email.com" style={inpS} />
                          </div>
                          <div>
                            <label style={lblS}>Password {editingUser ? '(blank = keep)' : '*'}</label>
                            <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" style={inpS} />
                          </div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: 'var(--sa-muted)', marginBottom: 6 }}>Permissions</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            {['view', 'edit', 'delete'].map(key => (
                              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 10px', borderRadius: 6, border: '1px solid var(--sa-border)', background: formData.permissions[key] ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                                <input type="checkbox" checked={formData.permissions[key]} onChange={() => togglePerm(key)} style={{ accentColor: 'var(--sa-primary)' }} />
                                <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{key}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={() => { setShowUserForm(false); setEditingUser(null); }}>Cancel</button>
                          <button className="sa-btn sa-btn-primary sa-btn-sm" disabled={saving} onClick={handleSaveUser}>{saving ? 'Saving…' : editingUser ? 'Update' : 'Assign'}</button>
                        </div>
                      </div>
                    )}

                    {projectUsers.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: 'var(--sa-muted)', fontSize: 13, border: '1px dashed var(--sa-border)', borderRadius: 8 }}>No users assigned yet</div>
                    ) : (
                      <div style={{ border: '1px solid var(--sa-border)', borderRadius: 8, overflow: 'hidden' }}>
                        <table style={{ width: '100%', fontSize: 12 }}>
                          <thead><tr style={{ background: 'var(--sa-bg)' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Email</th>
                            <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 600 }}>View</th>
                            <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 600 }}>Edit</th>
                            <th style={{ padding: '8px 8px', textAlign: 'center', fontWeight: 600 }}>Delete</th>
                            <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                          </tr></thead>
                          <tbody>
                            {projectUsers.map(u => (
                              <tr key={u.id} style={{ borderTop: '1px solid var(--sa-border)' }}>
                                <td style={{ padding: '10px 12px' }}>{u.email}</td>
                                <td style={{ padding: '10px 8px', textAlign: 'center' }}>{permBadge(u.permissions?.view)}</td>
                                <td style={{ padding: '10px 8px', textAlign: 'center' }}>{permBadge(u.permissions?.edit)}</td>
                                <td style={{ padding: '10px 8px', textAlign: 'center' }}>{permBadge(u.permissions?.delete)}</td>
                                <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                                  <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={() => openEditUser(u)} style={{ padding: '4px 8px', fontSize: 11 }}>Edit</button>
                                  <button className="sa-btn sa-btn-danger sa-btn-sm" onClick={() => handleDeleteUser(u.id)} style={{ padding: '4px 8px', fontSize: 11, marginLeft: 4 }}>Remove</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 2: Create New Project ───────────────────── */}
          {activeTab === 'create' && (
            <div style={{ maxWidth: 600 }}>
              {createErr && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>{createErr}</div>}

              {/* After creation — show user assignment form */}
              {createdProject ? (
                <div>
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
                    ✅ Project <strong>"{createdProject.project_name}"</strong> created! Now assign a user (optional).
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sa-text)', marginBottom: 12 }}>Assign User to "{createdProject.project_name}"</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div>
                      <label style={lblS}>Email *</label>
                      <input type="email" value={assignAfter.email} onChange={e => setAssignAfter(p => ({ ...p, email: e.target.value }))} placeholder="user@email.com" style={inpS} />
                    </div>
                    <div>
                      <label style={lblS}>Password *</label>
                      <input type="password" value={assignAfter.password} onChange={e => setAssignAfter(p => ({ ...p, password: e.target.value }))} placeholder="Set password" style={inpS} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={lblS}>Permissions</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {['view', 'edit', 'delete'].map(key => (
                        <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--sa-border)', background: assignAfter.permissions[key] ? 'rgba(99,102,241,0.08)' : 'transparent' }}>
                          <input type="checkbox" checked={assignAfter.permissions[key]} onChange={() => setAssignAfter(p => ({ ...p, permissions: { ...p.permissions, [key]: !p.permissions[key] } }))} style={{ accentColor: 'var(--sa-primary)' }} />
                          <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{key}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="sa-btn sa-btn-ghost" onClick={() => { setCreatedProject(null); setActiveTab('users'); }}>Skip — Go to Projects</button>
                    <button className="sa-btn sa-btn-primary" disabled={createSaving} onClick={handleAssignAfterCreate}>{createSaving ? 'Assigning…' : '✅ Assign User'}</button>
                  </div>
                </div>
              ) : (
                /* Project creation form */
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sa-text)', marginBottom: 14 }}>New Project for {company.company_name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={lblS}>Project Name *</label>
                      <input type="text" value={createForm.project_name} onChange={e => setCreateForm(p => ({ ...p, project_name: e.target.value }))} placeholder="e.g. Nexus Commercial Tower" style={inpS} />
                    </div>
                    <div>
                      <label style={lblS}>Location / City</label>
                      <input type="text" value={createForm.location} onChange={e => setCreateForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Mumbai" style={inpS} />
                    </div>
                    <div>
                      <label style={lblS}>Project Type</label>
                      <select value={createForm.project_type} onChange={e => setCreateForm(p => ({ ...p, project_type: e.target.value }))} style={inpS}>
                        <option value="">Select type…</option>
                        {['Commercial', 'Retail / Shop', 'Industrial', 'Mixed Use', 'Office', 'Warehouse', 'Mall'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lblS}>Total Floors</label>
                      <input type="number" value={createForm.total_floors} onChange={e => setCreateForm(p => ({ ...p, total_floors: e.target.value }))} placeholder="e.g. 12" style={inpS} min="0" />
                    </div>
                    <div>
                      <label style={lblS}>Total Project Area (sq ft)</label>
                      <input type="number" value={createForm.total_project_area} onChange={e => setCreateForm(p => ({ ...p, total_project_area: e.target.value }))} placeholder="e.g. 50000" style={inpS} min="0" />
                    </div>
                    <div>
                      <label style={lblS}>Calculation Type</label>
                      <select value={createForm.calculation_type} onChange={e => setCreateForm(p => ({ ...p, calculation_type: e.target.value }))} style={inpS}>
                        <option value="Chargeable Area">Chargeable Area</option>
                        <option value="Carpet Area">Carpet Area</option>
                        <option value="Built-up Area">Built-up Area</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={lblS}>Address</label>
                      <input type="text" value={createForm.address} onChange={e => setCreateForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" style={inpS} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={lblS}>Description</label>
                      <textarea value={createForm.description} onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description…" rows={3} style={{ ...inpS, resize: 'vertical' }} />
                    </div>
                  </div>

                  {/* ── Project Quota Section ─────────────────────────────── */}
                  <div style={{ border: '1px solid var(--sa-border)', borderRadius: 10, padding: 16, marginBottom: 16, background: 'rgba(99,102,241,0.04)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sa-text)', marginBottom: 10 }}>📊 Project Quota for {company.company_name}</div>

                    {/* Current usage bar */}
                    {limitInfo && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--sa-muted)', marginBottom: 6 }}>
                          <span>Projects Used</span>
                          <span style={{ fontWeight: 700, color: limitInfo.project_limit && limitInfo.current_count >= limitInfo.project_limit ? '#f87171' : 'var(--sa-primary)' }}>
                            {limitInfo.current_count} / {limitInfo.project_limit ?? '∞'}
                          </span>
                        </div>
                        {limitInfo.project_limit && (
                          <div style={{ height: 6, borderRadius: 4, background: 'var(--sa-border)', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              borderRadius: 4,
                              background: limitInfo.current_count >= limitInfo.project_limit ? '#f87171' : limitInfo.current_count / limitInfo.project_limit > 0.75 ? '#fbbf24' : 'var(--sa-primary)',
                              width: `${Math.min(100, (limitInfo.current_count / limitInfo.project_limit) * 100)}%`,
                              transition: 'width 0.4s',
                            }} />
                          </div>
                        )}
                        {limitInfo.project_limit && limitInfo.remaining === 0 && (
                          <div style={{ marginTop: 8, fontSize: 12, color: '#f87171', fontWeight: 600 }}>
                            ⚠️ Limit reached — increase the limit below or the company cannot create more projects.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Set limit field */}
                    <label style={lblS}>
                      Max Projects Allowed for This Company
                      <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--sa-muted)', fontWeight: 400 }}>(1 – 12, leave blank = unlimited)</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="number"
                        value={createForm.project_limit}
                        onChange={e => setCreateForm(p => ({ ...p, project_limit: e.target.value }))}
                        placeholder={limitInfo?.project_limit ? `Current: ${limitInfo.project_limit}` : 'e.g. 5'}
                        min="1" max="12" step="1"
                        style={{ ...inpS, width: 140 }}
                      />
                      {/* Quick-pick buttons */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setCreateForm(p => ({ ...p, project_limit: String(n) }))}
                            style={{
                              padding: '3px 8px', borderRadius: 4, fontSize: 11, border: '1px solid var(--sa-border)',
                              background: createForm.project_limit === String(n) ? 'var(--sa-primary)' : 'transparent',
                              color: createForm.project_limit === String(n) ? '#fff' : 'var(--sa-muted)',
                              cursor: 'pointer',
                            }}
                          >{n}</button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: 'var(--sa-muted)' }}>
                      Setting this will restrict how many projects the company admin can create. Super Admin can always update it.
                    </div>
                  </div>

                  <button className="sa-btn sa-btn-primary" disabled={createSaving} onClick={handleCreateProject}>
                    {createSaving ? <><span className="sa-spinner" /> Creating…</> : '🏗️ Create Project'}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* ── TAB 3: Manage Quota ─────────────────────────────────────────── */}
          {activeTab === 'quota' && (
            <div style={{ maxWidth: 540, margin: '0 auto' }}>

              {/* Current status card */}
              <div style={{ border: '1px solid var(--sa-border)', borderRadius: 12, padding: 20, marginBottom: 20, background: 'rgba(99,102,241,0.04)' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sa-text)', marginBottom: 14 }}>📊 Current Quota — {company.company_name}</div>

                {limitInfo ? (
                  <>
                    <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                      {[
                        { label: 'Projects Used', value: limitInfo.current_count, color: '#6366f1' },
                        { label: 'Quota Limit', value: limitInfo.project_limit ?? '∞ Unlimited', color: limitInfo.project_limit ? '#f59e0b' : '#10b981' },
                        { label: 'Remaining', value: limitInfo.project_limit ? Math.max(0, limitInfo.project_limit - limitInfo.current_count) : '∞', color: (!limitInfo.project_limit || (limitInfo.project_limit - limitInfo.current_count) > 2) ? '#10b981' : '#ef4444' },
                      ].map(s => (
                        <div key={s.label} style={{ flex: 1, background: 'var(--sa-surface)', border: '1px solid var(--sa-border)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: 'var(--sa-muted)', marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {limitInfo.project_limit && (
                      <>
                        <div style={{ height: 8, borderRadius: 6, background: 'var(--sa-border)', overflow: 'hidden', marginBottom: 6 }}>
                          <div style={{
                            height: '100%', borderRadius: 6, transition: 'width 0.4s',
                            background: limitInfo.current_count >= limitInfo.project_limit ? '#ef4444'
                              : (limitInfo.current_count / limitInfo.project_limit) > 0.75 ? '#f59e0b'
                              : '#6366f1',
                            width: `${Math.min(100, (limitInfo.current_count / limitInfo.project_limit) * 100)}%`,
                          }} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--sa-muted)', textAlign: 'right' }}>
                          {Math.round((limitInfo.current_count / limitInfo.project_limit) * 100)}% used
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div style={{ color: 'var(--sa-muted)', fontSize: 13 }}>Loading quota information…</div>
                )}
              </div>

              {/* Set new quota */}
              <div style={{ border: '1px solid var(--sa-border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sa-text)', marginBottom: 4 }}>Set New Quota Limit</div>
                <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 14 }}>
                  Define the maximum number of projects this company can have. Use "Remove Limit" to make it unlimited.
                </div>

                <div style={{ fontSize: 11, color: 'var(--sa-muted)', marginBottom: 6 }}>Quick select:</div>
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 50].map(n => (
                    <button key={n} type="button" onClick={() => setQuotaInput(String(n))}
                      style={{
                        padding: '4px 10px', borderRadius: 5, fontSize: 12, border: '1px solid var(--sa-border)',
                        background: quotaInput === String(n) ? 'var(--sa-primary)' : 'transparent',
                        color: quotaInput === String(n) ? '#fff' : 'var(--sa-muted)',
                        cursor: 'pointer', fontWeight: quotaInput === String(n) ? 700 : 400,
                      }}>{n}</button>
                  ))}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={lblS}>Or enter a custom number (1 – 50)</label>
                  <input
                    type="number" min="1" max="50" step="1"
                    value={quotaInput}
                    onChange={e => setQuotaInput(e.target.value)}
                    placeholder={limitInfo?.project_limit ? `Current limit: ${limitInfo.project_limit}` : 'e.g. 8'}
                    style={{ ...inpS, maxWidth: 200 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="sa-btn sa-btn-primary" disabled={quotaSaving || !quotaInput} onClick={handleUpdateQuota} style={{ flex: 1 }}>
                    {quotaSaving ? <><span className="sa-spinner" /> Saving…</> : '💾 Update Quota'}
                  </button>
                  {limitInfo?.project_limit && (
                    <button className="sa-btn sa-btn-ghost" disabled={quotaSaving} onClick={handleRemoveQuota}
                      style={{ color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>
                      🗑️ Remove Limit
                    </button>
                  )}
                </div>

                {quotaMsg.text && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
                    background: quotaMsg.type === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${quotaMsg.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    color: quotaMsg.type === 'ok' ? '#34d399' : '#fca5a5',
                  }}>
                    {quotaMsg.text}
                  </div>
                )}
              </div>

              <div style={{ fontSize: 11, color: 'var(--sa-muted)', textAlign: 'center' }}>
                💡 This limit applies to the company admin's ability to create projects. Super Admin can always update or override it.
              </div>
            </div>
          )}

        </div>

        <div className="sa-modal-actions" style={{ marginTop: 20 }}>
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};


// --- Module Card ---
const ModuleCard = ({ moduleName, assignedUsers = [], selected, onSelect, onAssign, onEdit, onRemove, onManageProjects }) => {
  const def = MODULE_DEFS[moduleName];
  const hasUsers = assignedUsers.length > 0;
  const isProjectModule = def.isProjectModule;

  return (
    <div
      onClick={() => onSelect(moduleName)}
      style={{
        border: `1.5px solid ${selected ? def.color : 'var(--sa-border)'}`,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        background: selected ? `rgba(${hexToRgb(def.color)}, 0.06)` : 'var(--sa-card)',
        transition: 'all 0.2s',
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontSize: 22 }}>{def.icon}</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sa-text)' }}>{def.label}</div>
          <div style={{ fontSize: 11, color: 'var(--sa-muted)' }}>
            {isProjectModule ? 'Project-specific access' : `${Object.keys(def.features).length} features`}
          </div>
        </div>
        {isProjectModule && (
          <span style={{
            marginLeft: 'auto',
            padding: '3px 8px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            background: 'rgba(139, 92, 246, 0.15)',
            color: '#8b5cf6',
          }}>
            Special
          </span>
        )}
        {!isProjectModule && (
          <span style={{
            marginLeft: 'auto',
            padding: '3px 8px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            background: hasUsers ? 'rgba(16,185,129,0.15)' : 'rgba(156,163,175,0.15)',
            color: hasUsers ? '#34d399' : 'var(--sa-muted)',
          }}>
            {hasUsers ? `${assignedUsers.length} User${assignedUsers.length > 1 ? 's' : ''}` : 'Empty'}
          </span>
        )}
      </div>

      {isProjectModule ? (
        <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 10 }}>
          Assign users to specific projects with granular permissions
        </div>
      ) : hasUsers ? (
        <div style={{ marginBottom: 10 }}>
          {assignedUsers.map((user, idx) => (
            <div key={user.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              marginBottom: idx < assignedUsers.length - 1 ? '4px' : 0,
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 6,
              fontSize: 12,
            }}>
              <div>
                <span style={{ color: 'var(--sa-text)', fontWeight: 500 }}>{user.email}</span>
                <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                  {Object.entries(user.permissions || {}).filter(([, v]) => v).slice(0, 4).map(([k]) => (
                    <span key={k} style={{ fontSize: 9, padding: '1px 4px', borderRadius: 3, background: `rgba(${hexToRgb(def.color)}, 0.12)`, color: def.color, fontWeight: 600 }}>
                      {k.replace(/_/g, ' ').slice(0, 8)}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="sa-btn sa-btn-ghost sa-btn-sm"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                  onClick={e => { e.stopPropagation(); onEdit(user, moduleName); }}
                >Edit</button>
                <button
                  className="sa-btn sa-btn-danger sa-btn-sm"
                  style={{ padding: '4px 8px', fontSize: 11 }}
                  onClick={e => { e.stopPropagation(); onRemove(user.id); }}
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: 'var(--sa-muted)', marginBottom: 10 }}>No user assigned</div>
      )}

      {/* Permissions summary - removed, now shown per user above */}

      <div style={{ display: 'flex', gap: 6 }}>
        {isProjectModule ? (
          <button
            className="sa-btn sa-btn-primary sa-btn-sm"
            onClick={e => { e.stopPropagation(); onManageProjects(); }}
          >
            Manage Project Users
          </button>
        ) : (
          <button
            className="sa-btn sa-btn-primary sa-btn-sm"
            onClick={e => { e.stopPropagation(); onAssign(moduleName); }}
          >
            + Assign User
          </button>
        )}
      </div>
    </div>
  );
};

// Utility: hex to rgb for rgba() usage
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ModuleAssignment = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelected] = useState(null);
  const [moduleUsers, setModuleUsers] = useState([]);
  const [loadingCompanies, setLoadingC] = useState(true);
  const [loadingModules, setLoadingM] = useState(false);
  const [assignModal, setAssignModal] = useState(null); // moduleName
  const [editModal, setEditModal] = useState(null); // {moduleUser, moduleName}
  const [deleteId, setDeleteId] = useState(null);
  const [projectModal, setProjectModal] = useState(false); // for project-specific users
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);

  const notify = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  // Load all companies
  const loadCompanies = useCallback(async () => {
    setLoadingC(true);
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/users`);
      if (res.success) setCompanies(res.users || []);
    } catch (e) { console.error(e); }
    setLoadingC(false);
  }, []);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  // Load module users for selected company
  const loadModuleUsers = useCallback(async (companyId) => {
    setLoadingM(true);
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/module-users/${companyId}`);
      if (res.success) setModuleUsers(res.moduleUsers || []);
    } catch (e) { console.error(e); }
    setLoadingM(false);
  }, []);

  const selectCompany = (company) => {
    setSelected(company);
    setModuleUsers([]);
    loadModuleUsers(company.id);
  };

  const handleRemove = async (id) => {
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/module-users/${id}`, { method: 'DELETE' });
      if (res.success) {
        // Immediately remove from local state for instant UI update
        setModuleUsers(prev => prev.filter(u => u.id !== id));
        notify('success', 'Module user removed.');
      } else notify('error', res.message || 'Failed to remove.');
    } catch { notify('error', 'Network error.'); }
    setDeleteId(null);
  };

  const getAssignedUsers = (moduleName) => moduleUsers.filter(u => u.module_name === moduleName);

  const filteredCompanies = companies.filter(c =>
    c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SuperAdminLayout title="Module Access" subtitle="Assign per-module users with granular feature permissions" pendingCount={0}>

      {/* Flash message */}
      {msg && (
        <div style={{
          background: msg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: msg.type === 'success' ? '#6ee7b7' : '#fca5a5',
          padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600,
        }}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>

        {/* ── Left: Company List ─────────────────────────────────────────────── */}
        <div className="sa-card" style={{ padding: 0, overflow: 'hidden', height: 'fit-content' }}>
          <div style={{ padding: '16px 16px 10px', borderBottom: '1px solid var(--sa-border)' }}>
            <div className="sa-card-title" style={{ marginBottom: 10, fontSize: 14 }}>🏢 Companies</div>
            <div className="sa-search-wrap">
              <span className="sa-search-icon">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loadingCompanies ? (
            <div className="sa-loading" style={{ padding: 20 }}><span className="sa-spinner" /> Loading…</div>
          ) : filteredCompanies.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--sa-muted)', fontSize: 13 }}>No companies found</div>
          ) : (
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {filteredCompanies.map(c => (
                <div
                  key={c.id}
                  onClick={() => selectCompany(c)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--sa-border)',
                    background: selectedCompany?.id === c.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                    borderLeft: selectedCompany?.id === c.id ? '3px solid var(--sa-primary)' : '3px solid transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--sa-text)', marginBottom: 2 }}>{c.company_name}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--sa-muted)' }}>{c.email}</div>
                  <span style={{
                    display: 'inline-block', marginTop: 4, padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: c.status === 'active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    color: c.status === 'active' ? '#34d399' : '#f87171',
                  }}>{c.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: Module Cards ─────────────────────────────────────────────── */}
        <div>
          {!selectedCompany ? (
            <div className="sa-card sa-empty" style={{ minHeight: 300 }}>
              <div className="sa-empty-icon">🔐</div>
              <p>Select a company on the left to manage module access</p>
            </div>
          ) : (
            <div className="sa-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div className="sa-card-title" style={{ marginBottom: 2 }}>
                    🔐 {selectedCompany.company_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sa-muted)' }}>
                    Assign one user per module — each with granular feature permissions
                  </div>
                </div>
                {loadingModules && <span className="sa-spinner" />}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {MODULE_KEYS.map(mod => (
                  <ModuleCard
                    key={mod}
                    moduleName={mod}
                    assignedUsers={getAssignedUsers(mod)}
                    selected={false}
                    onSelect={() => { }}
                    onAssign={mn => setAssignModal(mn)}
                    onEdit={(u, mn) => setEditModal({ moduleUser: u, moduleName: mn })}
                    onRemove={id => setDeleteId(id)}
                    onManageProjects={() => setProjectModal(true)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Assign Modal ──────────────────────────────────────────────────────── */}
      {assignModal && selectedCompany && (
        <AssignModal
          company={selectedCompany}
          moduleName={assignModal}
          onClose={() => setAssignModal(null)}
          onSave={() => {
            notify('success', `User assigned to ${MODULE_DEFS[assignModal].label} successfully!`);
            loadModuleUsers(selectedCompany.id);
          }}
        />
      )}

      {/* ── Edit Permissions Modal ────────────────────────────────────────────── */}
      {editModal && (
        <EditPermsModal
          moduleUser={editModal.moduleUser}
          moduleName={editModal.moduleName}
          onClose={() => setEditModal(null)}
          onSave={() => {
            notify('success', 'Permissions updated successfully!');
            loadModuleUsers(selectedCompany.id);
          }}
        />
      )}

      {/* ── Project User Assignment Modal ─────────────────────────────────────── */}
      {projectModal && selectedCompany && (
        <ProjectAssignModal
          company={selectedCompany}
          onClose={() => setProjectModal(false)}
          onSave={() => { }}
          notify={notify}
        />
      )}

      {/* ── Delete Confirm ────────────────────────────────────────────────────── */}
      {deleteId && (
        <div className="sa-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="sa-modal" style={{ width: 380 }} onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>⚠️ Remove Module User</h3>
              <button className="sa-modal-close" onClick={() => setDeleteId(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p style={{ color: 'var(--sa-muted)', fontSize: 14, lineHeight: 1.6 }}>
              Are you sure you want to remove this module user? They will immediately lose access.
            </p>
            <div className="sa-modal-actions">
              <button className="sa-btn sa-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="sa-btn sa-btn-danger" onClick={() => handleRemove(deleteId)}>🗑️ Remove User</button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default ModuleAssignment;
