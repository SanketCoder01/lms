import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout, { SA_API, saFetch } from './SuperAdminLayout';

const TYPES = ['info', 'warning', 'critical'];

const Announcements = () => {
  const [anns, setAnns]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState(null);
  const [form, setForm]         = useState({ title: '', message: '', type: 'info', expires_at: '' });

  const notify = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const load = useCallback(async () => {
    const res = await saFetch(`${SA_API}/api/super-admin/announcements`);
    if (res.success) setAnns(res.announcements || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title || !form.message) return notify('error', 'Title and message are required');
    setSaving(true);
    const res = await saFetch(`${SA_API}/api/super-admin/announcements`, {
      method: 'POST',
      body: JSON.stringify({ ...form, expires_at: form.expires_at || null }),
    });
    setSaving(false);
    if (res.success) { notify('success', '📢 Announcement created!'); setShowCreate(false); setForm({ title:'', message:'', type:'info', expires_at:'' }); load(); }
    else notify('error', res.message);
  };

  const handleToggle = async (id, is_active) => {
    const res = await saFetch(`${SA_API}/api/super-admin/announcements/${id}`, {
      method: 'PUT', body: JSON.stringify({ is_active: !is_active }),
    });
    if (res.success) load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    const res = await saFetch(`${SA_API}/api/super-admin/announcements/${id}`, { method: 'DELETE' });
    if (res.success) { notify('success', 'Deleted'); load(); }
  };

  const typeColors = { info: 'var(--sa-info)', warning: 'var(--sa-warning)', critical: 'var(--sa-danger)' };

  return (
    <SuperAdminLayout title="Announcements" subtitle="Broadcast system-wide messages to all company users">
      {msg && (
        <div style={{
          background: msg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: msg.type === 'success' ? '#6ee7b7' : '#fca5a5',
          padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14,
        }}>{msg.text}</div>
      )}

      <div className="sa-card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div className="sa-card-title" style={{ marginBottom:0 }}>📢 Announcements ({anns.length})</div>
          <button className="sa-btn sa-btn-primary" onClick={() => setShowCreate(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Announcement
          </button>
        </div>

        {loading ? (
          <div className="sa-loading"><span className="sa-spinner" />Loading…</div>
        ) : anns.length === 0 ? (
          <div className="sa-empty"><div className="sa-empty-icon">📢</div><p>No announcements yet. Create one above.</p></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {anns.map(a => (
              <div key={a.id} className="sa-ann-card"
                style={{ opacity: a.is_active ? 1 : 0.5 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <span className={`sa-ann-type ${a.type}`}>{a.type}</span>
                    <span className="sa-ann-title">{a.title}</span>
                    {!a.is_active && <span style={{ fontSize:11, color:'var(--sa-muted)', marginLeft:4 }}>(inactive)</span>}
                  </div>
                  <div className="sa-ann-msg">{a.message}</div>
                  <div className="sa-ann-time">
                    Created {new Date(a.created_at).toLocaleString()}
                    {a.expires_at && ` · Expires ${new Date(a.expires_at).toLocaleDateString()}`}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                  <button
                    className={`sa-btn sa-btn-sm ${a.is_active ? 'sa-btn-warning' : 'sa-btn-success'}`}
                    onClick={() => handleToggle(a.id, a.is_active)}
                  >
                    {a.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="sa-btn sa-btn-danger sa-btn-sm" onClick={() => handleDelete(a.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="sa-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>📢 Create Announcement</h3>
              <button className="sa-modal-close" onClick={() => setShowCreate(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="sa-form">
              <div className="sa-form-row">
                <div className="sa-form-group" style={{ gridColumn:'span 2' }}>
                  <label>Title *</label>
                  <input placeholder="e.g. Scheduled Maintenance" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
                </div>
              </div>
              <div className="sa-form-group">
                <label>Message *</label>
                <textarea
                  placeholder="Write your announcement message here…"
                  value={form.message}
                  onChange={e => setForm({...form, message: e.target.value})}
                  style={{ minHeight:100 }}
                />
              </div>
              <div className="sa-form-row">
                <div className="sa-form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="sa-form-group">
                  <label>Expires On (optional)</label>
                  <input type="datetime-local" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} />
                </div>
              </div>
              {/* Preview */}
              {form.title && (
                <div style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${typeColors[form.type]}33`, borderLeft:`3px solid ${typeColors[form.type]}`, borderRadius:8, padding:14 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:typeColors[form.type], textTransform:'uppercase', marginBottom:4 }}>Preview — {form.type}</div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{form.title}</div>
                  <div style={{ color:'var(--sa-muted)', fontSize:13, marginTop:4 }}>{form.message}</div>
                </div>
              )}
            </div>
            <div className="sa-modal-actions">
              <button className="sa-btn sa-btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="sa-btn sa-btn-primary" disabled={saving} onClick={handleCreate}>
                {saving ? <><span className="sa-spinner" />Creating…</> : '📢 Publish Announcement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default Announcements;
