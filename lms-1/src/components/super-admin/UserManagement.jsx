import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout, { SA_API, saFetch } from './SuperAdminLayout';

const UserManagement = () => {
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser]   = useState(null);
  const [deleteId, setDeleteId]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');

  const [form, setForm] = useState({ company_name: '', email: '', phone: '', address: '', password: '' });

  const loadUsers = useCallback(async () => {
    const res = await saFetch(`${SA_API}/api/super-admin/users`);
    if (res.success) setUsers(res.users || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const msg = (type, text) => {
    if (type === 'success') { setSuccess(text); setTimeout(() => setSuccess(''), 3000); }
    else { setError(text); setTimeout(() => setError(''), 4000); }
  };

  const handleCreate = async () => {
    if (!form.company_name || !form.email || !form.password)
      return msg('error', 'Company name, email and password are required');
    setSaving(true);
    const res = await saFetch(`${SA_API}/api/super-admin/users`, {
      method: 'POST', body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.success) { 
      msg('success', 'Company user created successfully!'); 
      setShowCreate(false); 
      setForm({ company_name: '', email: '', phone: '', address: '', password: '' }); 
      loadUsers(); 
    }
    else msg('error', res.message);
  };

  const handleUpdate = async () => {
    setSaving(true);
    const res = await saFetch(`${SA_API}/api/super-admin/users/${editUser.id}`, {
      method: 'PUT', body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.success) { msg('success', 'User updated!'); setEditUser(null); loadUsers(); }
    else msg('error', res.message);
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const res = await saFetch(`${SA_API}/api/super-admin/users/${user.id}/status`, {
      method: 'PUT', body: JSON.stringify({ status: newStatus }),
    });
    if (res.success) { msg('success', `User ${newStatus}!`); loadUsers(); }
    else msg('error', res.message);
  };

  const handleDelete = async () => {
    const res = await saFetch(`${SA_API}/api/super-admin/users/${deleteId}`, { method: 'DELETE' });
    if (res.success) { msg('success', 'User deleted!'); setDeleteId(null); loadUsers(); }
    else msg('error', res.message);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ company_name: u.company_name, email: u.email, phone: u.phone || '', address: u.address || '', password: '' });
  };

  const filtered = users.filter(u =>
    u.company_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SuperAdminLayout title="Company Management" subtitle="Create and manage company credentials" pendingCount={0}>
      {success && <div style={{ background: 'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', color:'#6ee7b7', padding:'12px 16px', borderRadius:10, marginBottom:16, fontSize:14 }}>{success}</div>}
      {error   && <div style={{ background: 'rgba(239,68,68,0.12)',  border:'1px solid rgba(239,68,68,0.3)',  color:'#fca5a5', padding:'12px 16px', borderRadius:10, marginBottom:16, fontSize:14 }}>{error}</div>}

      <div className="sa-card">
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div className="sa-card-title" style={{ marginBottom:0 }}>🏢 All Companies ({users.length})</div>
          <div style={{ display:'flex', gap:12 }}>
            <div className="sa-search-wrap">
              <span className="sa-search-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
              <input placeholder="Search company or email…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="sa-btn sa-btn-primary" onClick={() => { setShowCreate(true); setForm({ company_name:'', email:'', phone:'', address:'', password:'' }); }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Company
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="sa-loading"><span className="sa-spinner" /> Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="sa-empty"><div className="sa-empty-icon">🏢</div><p>No companies yet. Create one above.</p></div>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Company</th><th>Email</th><th>Phone</th>
                  <th>Status</th><th>Last Login</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td><div style={{ fontWeight:600 }}>{u.company_name}</div></td>
                    <td style={{ color:'var(--sa-muted)' }}>{u.email}</td>
                    <td style={{ color:'var(--sa-muted)' }}>{u.phone || '—'}</td>
                    <td><span className={`sa-status ${u.status}`}>{u.status}</span></td>
                    <td style={{ color:'var(--sa-muted)', fontSize:12 }}>
                      {u.last_login ? new Date(u.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                        <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        <button
                          className={`sa-btn sa-btn-sm ${u.status === 'active' ? 'sa-btn-warning' : 'sa-btn-success'}`}
                          onClick={() => handleToggleStatus(u)}
                        >
                          {u.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                        <button className="sa-btn sa-btn-danger sa-btn-sm" onClick={() => setDeleteId(u.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(showCreate || editUser) && (
        <div className="sa-modal-overlay" onClick={() => { setShowCreate(false); setEditUser(null); }}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>{showCreate ? '🏢 Create New Company' : '✏️ Edit Company'}</h3>
              <button className="sa-modal-close" onClick={() => { setShowCreate(false); setEditUser(null); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="sa-form">
              <div className="sa-form-group">
                <label>Company Name *</label>
                <input placeholder="e.g. Acme Corp" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} />
              </div>
              <div className="sa-form-group">
                <label>Email Address *</label>
                <input type="email" placeholder="company@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="sa-form-row">
                <div className="sa-form-group">
                  <label>Phone Number</label>
                  <input placeholder="+91 9000000000" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="sa-form-group">
                  <label>Password {editUser ? '(leave blank to keep)' : '*'}</label>
                  <input type="password" placeholder={editUser ? 'New password (optional)' : 'Set password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} />
                </div>
              </div>
              <div className="sa-form-group">
                <label>Address</label>
                <textarea placeholder="Full office address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
            </div>
            <div className="sa-modal-actions">
              <button className="sa-btn sa-btn-ghost" onClick={() => { setShowCreate(false); setEditUser(null); }}>Cancel</button>
              <button className="sa-btn sa-btn-primary" disabled={saving} onClick={editUser ? handleUpdate : handleCreate}>
                {saving ? <><span className="sa-spinner" />Saving…</> : (showCreate ? '✅ Create Company' : '💾 Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="sa-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="sa-modal" style={{ width:380 }} onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>⚠️ Confirm Delete</h3>
              <button className="sa-modal-close" onClick={() => setDeleteId(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p style={{ color:'var(--sa-muted)', fontSize:14 }}>
              Are you sure you want to delete this company? This action <strong>cannot be undone</strong>.
            </p>
            <div className="sa-modal-actions">
              <button className="sa-btn sa-btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="sa-btn sa-btn-danger" onClick={handleDelete}>🗑️ Delete Company</button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default UserManagement;
