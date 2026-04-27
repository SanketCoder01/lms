import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout, { SA_API, saFetch } from './SuperAdminLayout';

const LiveActivity = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [killId, setKillId]     = useState(null);
  const [killing, setKilling]   = useState(false);
  const [msg, setMsg]           = useState(null);

  const notify = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 3000); };

  const load = useCallback(async () => {
    const res = await saFetch(`${SA_API}/api/super-admin/sessions`);
    if (res.success) setSessions(res.sessions || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000); // live refresh every 5s
    return () => clearInterval(interval);
  }, [load]);

  const handleKill = async () => {
    setKilling(true);
    const res = await saFetch(`${SA_API}/api/super-admin/sessions/${killId}`, { method: 'DELETE' });
    setKilling(false);
    setKillId(null);
    if (res.success) { notify('success', '🔴 Session terminated successfully'); load(); }
    else notify('error', res.message);
  };

  const duration = (start) => {
    const diff = Math.floor((Date.now() - new Date(start)) / 1000);
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ${diff%60}s`;
    return `${Math.floor(diff/3600)}h ${Math.floor((diff%3600)/60)}m`;
  };

  const lastSeenAgo = (ts) => {
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    return `${Math.floor(diff/60)}m ago`;
  };

  return (
    <SuperAdminLayout title="Live Activity" subtitle="Real-time monitoring of all active sessions" pendingCount={0}>
      {msg && (
        <div style={{
          background: msg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: msg.type === 'success' ? '#6ee7b7' : '#fca5a5',
          padding: '12px 16px', borderRadius: 10, marginBottom: 16, fontSize: 14,
        }}>{msg.text}</div>
      )}

      {/* Stats bar */}
      <div style={{ display:'flex', gap:14, marginBottom:24, flexWrap:'wrap' }}>
        <div className="sa-stat-card" style={{ flex:'1', minWidth:160 }}>
          <div className="sa-stat-icon green">🟢</div>
          <div><div className="sa-stat-value">{sessions.length}</div><div className="sa-stat-label">Active Now</div></div>
        </div>
        <div style={{ flex:3, minWidth:250, display:'flex', alignItems:'center', gap:12,
          background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)',
          borderRadius:14, padding:'16px 22px' }}>
          <div>
            <span className="sa-live-dot">LIVE</span>
            <div style={{ color:'var(--sa-muted)', fontSize:12.5, marginTop:4 }}>
              Auto-refreshes every 5 seconds. Sessions inactive for 15+ minutes are automatically removed.
            </div>
          </div>
        </div>
      </div>

      <div className="sa-card">
        <div className="sa-card-title">
          <span className="sa-live-dot" />
          Active Sessions
          <span style={{ marginLeft:'auto', fontSize:12, color:'var(--sa-muted)', fontWeight:400 }}>
            Refreshes every 5s
          </span>
        </div>

        {loading ? (
          <div className="sa-loading"><span className="sa-spinner" /> Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="sa-empty">
            <div className="sa-empty-icon">😴</div>
            <p>No active sessions at the moment.</p>
          </div>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Company</th><th>Email</th><th>Current Page</th>
                  <th>IP Address</th><th>Duration</th><th>Last Seen</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ width:8, height:8, background:'var(--sa-success)', borderRadius:'50%', boxShadow:'0 0 0 3px rgba(16,185,129,0.2)', flexShrink:0 }} />
                        <span style={{ fontWeight:600 }}>{s.company_name}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--sa-muted)', fontSize:12.5 }}>{s.email}</td>
                    <td>
                      <span style={{
                        background:'rgba(99,102,241,0.12)', color:'var(--sa-primary)',
                        padding:'3px 9px', borderRadius:6, fontSize:12, fontWeight:600,
                      }}>{s.current_page || '/'}</span>
                    </td>
                    <td style={{ color:'var(--sa-muted)', fontSize:12.5 }}>{s.ip_address || '—'}</td>
                    <td>
                      <span style={{ color:'var(--sa-text)', fontSize:13, fontWeight:600 }}>
                        {duration(s.logged_in_at)}
                      </span>
                    </td>
                    <td style={{ color:'var(--sa-muted)', fontSize:12 }}>{lastSeenAgo(s.last_seen)}</td>
                    <td>
                      <button
                        className="sa-btn sa-btn-danger sa-btn-sm"
                        onClick={() => setKillId(s.id)}
                        title="Terminate this session (force logout)"
                      >
                        🔴 Kill Session
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Device info tooltip panel (quick view) could be added here */}

      {/* Kill Session Confirm */}
      {killId && (
        <div className="sa-modal-overlay" onClick={() => setKillId(null)}>
          <div className="sa-modal" style={{ width:380 }} onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>🔴 Terminate Session</h3>
              <button className="sa-modal-close" onClick={() => setKillId(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <p style={{ color:'var(--sa-muted)', fontSize:14, lineHeight:1.6 }}>
              This will immediately log out the user. They will be redirected to the login page when they next interact with the app.
            </p>
            <div className="sa-modal-actions">
              <button className="sa-btn sa-btn-ghost" onClick={() => setKillId(null)}>Cancel</button>
              <button className="sa-btn sa-btn-danger" disabled={killing} onClick={handleKill}>
                {killing ? <><span className="sa-spinner" />Terminating…</> : '🔴 Terminate Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default LiveActivity;
