import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import SuperAdminLayout, { SA_API, saFetch } from './SuperAdminLayout';

const SADashboard = () => {
  const [stats, setStats]             = useState({ totalCompanies: 0, pendingApprovals: 0, activeNow: 0, activeAnnouncements: 0 });
  const [pendingRegs, setPendingRegs] = useState([]);
  const [sessions, setSessions]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionMsg, setActionMsg]     = useState('');

  const flash = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [statsRes, regsRes, sessionsRes] = await Promise.all([
        saFetch(`${SA_API}/api/super-admin/dashboard-stats`),
        saFetch(`${SA_API}/api/super-admin/registrations?status=pending`),
        saFetch(`${SA_API}/api/super-admin/sessions`),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (regsRes.success)  setPendingRegs(regsRes.registrations || []);
      if (sessionsRes.success) setSessions(sessionsRes.sessions || []);
    } catch (e) {
      console.error('Dashboard load error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 8000); // refresh every 8s
    return () => clearInterval(interval);
  }, [load]);

  // Quick approve
  const handleApprove = async (id, companyName) => {
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/registrations/${id}/approve`, { method: 'POST' });
      if (res.success) {
        flash(`✅ ${companyName} approved! They can now login.`);
        load();
      } else {
        flash(`❌ Error: ${res.message}`);
      }
    } catch (e) {
      flash('❌ Network error. Try again.');
    }
  };

  // Quick reject
  const handleReject = async (id, companyName) => {
    const note = window.prompt(`Reason for rejecting ${companyName}? (optional)`);
    if (note === null) return; // cancelled
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/registrations/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ note }),
      });
      if (res.success) {
        flash(`🚫 ${companyName} rejected.`);
        load();
      }
    } catch (e) {
      flash('❌ Network error. Try again.');
    }
  };

  // Kill session
  const handleKillSession = async (sessionId, companyName) => {
    if (!window.confirm(`Terminate session for ${companyName}?`)) return;
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.success) {
        flash(`⚡ Session terminated for ${companyName}`);
        load();
      }
    } catch (e) {
      flash('❌ Network error. Try again.');
    }
  };

  const statCards = [
    { label: 'Total Companies',    value: stats.totalCompanies,       icon: '🏢', color: 'purple' },
    { label: 'Pending Approvals',  value: stats.pendingApprovals,     icon: '⏳', color: 'orange' },
    { label: 'Online Now',         value: stats.activeNow,            icon: '🟢', color: 'green'  },
    { label: 'Active Announcements', value: stats.activeAnnouncements, icon: '📢', color: 'blue'  },
  ];

  return (
    <SuperAdminLayout title="Dashboard" subtitle="Real-time platform overview" pendingCount={pendingRegs.length}>

      {/* Action flash message */}
      {actionMsg && (
        <div style={{
          background: actionMsg.startsWith('✅') || actionMsg.startsWith('⚡') ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${actionMsg.startsWith('✅') || actionMsg.startsWith('⚡') ? '#86efac' : '#fca5a5'}`,
          color: actionMsg.startsWith('✅') || actionMsg.startsWith('⚡') ? '#166534' : '#991b1b',
          padding: '12px 18px', borderRadius: 10, marginBottom: 18,
          fontWeight: 600, fontSize: 14,
        }}>
          {actionMsg}
        </div>
      )}

      {loading ? (
        <div className="sa-loading"><span className="sa-spinner" /> Loading dashboard…</div>
      ) : (
        <>
          {/* ── Stat Cards ─────────────────────────────────── */}
          <div className="sa-stats-grid">
            {statCards.map((s, i) => (
              <div key={i} className="sa-stat-card">
                <div className={`sa-stat-icon ${s.color}`}>{s.icon}</div>
                <div>
                  <div className="sa-stat-value">{s.value}</div>
                  <div className="sa-stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="sa-dashboard-grid">

            {/* ── Pending Approvals ──────────────────────── */}
            <div className="sa-card">
              <div className="sa-card-title">
                ⏳ Pending Approvals
                {pendingRegs.length > 0 && (
                  <span className="sa-badge" style={{ marginLeft: 'auto' }}>{pendingRegs.length}</span>
                )}
              </div>

              {pendingRegs.length === 0 ? (
                <div className="sa-empty">
                  <div className="sa-empty-icon">✅</div>
                  <p>No pending registrations</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingRegs.slice(0, 5).map(reg => (
                    <div key={reg.id} className="sa-pending-item">
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{reg.company_name}</div>
                          <div style={{ color: 'var(--sa-muted)', fontSize: 12, marginTop: 2 }}>{reg.email}</div>
                          {reg.phone && (
                            <div style={{ color: 'var(--sa-muted)', fontSize: 11.5, marginTop: 1 }}>📞 {reg.phone}</div>
                          )}
                          <div style={{ color: 'var(--sa-muted)', fontSize: 11, marginTop: 4 }}>
                            {new Date(reg.created_at).toLocaleString()}
                          </div>
                        </div>
                        <span className="sa-status pending">Pending</span>
                      </div>
                      <div className="sa-pending-actions">
                        <button
                          onClick={() => handleApprove(reg.id, reg.company_name)}
                          className="sa-approve-btn"
                        >✅ Approve</button>
                        <button
                          onClick={() => handleReject(reg.id, reg.company_name)}
                          className="sa-reject-btn"
                        >🚫 Reject</button>
                      </div>
                    </div>
                  ))}
                  {pendingRegs.length > 5 && (
                    <Link to="/super-admin/approvals" style={{ textAlign: 'center', fontSize: 12, color: 'var(--sa-muted)' }}>
                      +{pendingRegs.length - 5} more → View all
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* ── Live Sessions ──────────────────────────── */}
            <div className="sa-card">
              <div className="sa-card-title">
                <span className="sa-live-dot" />
                Live Sessions
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--sa-muted)' }}>
                  Updates every 8s
                </span>
              </div>

              {sessions.length === 0 ? (
                <div className="sa-empty">
                  <div className="sa-empty-icon">😴</div>
                  <p>No active sessions right now</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sessions.slice(0, 6).map(s => (
                    <div key={s.id} className="sa-session-item">
                      <div className="sa-session-icon">🏢</div>
                      <div className="sa-session-info">
                        <div className="sa-session-company">
                          {s.company_name}
                        </div>
                        <div className="sa-session-meta">
                          {s.current_page || '/'} · {s.ip_address}
                        </div>
                      </div>
                      <span className="sa-live-dot" />
                      <button
                        onClick={() => handleKillSession(s.id, s.company_name)}
                        title="Terminate session"
                        className="sa-kill-btn"
                      >⚡ Kill</button>
                    </div>
                  ))}
                  {sessions.length > 6 && (
                    <Link to="/super-admin/live-activity" style={{ textAlign: 'center', fontSize: 12, color: 'var(--sa-muted)' }}>
                      +{sessions.length - 6} more → View all
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </SuperAdminLayout>
  );
};

export default SADashboard;
