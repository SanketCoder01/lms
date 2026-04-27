import React, { useState, useEffect, useCallback } from 'react';
import SuperAdminLayout, { SA_API, saFetch } from './SuperAdminLayout';

const RegistrationApprovals = () => {
  const [regs, setRegs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [viewReg, setViewReg] = useState(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejectId, setRejectId] = useState(null);
  const [processing, setProcessing] = useState(null); // holds the ID being processed
  const [msg, setMsg] = useState(null);

  const notify = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = filter === 'all'
        ? `${SA_API}/api/super-admin/registrations`
        : `${SA_API}/api/super-admin/registrations?status=${filter}`;
      const res = await saFetch(url);
      if (res.success) setRegs(res.registrations || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Real-time poll every 6s when viewing pending tab
  useEffect(() => {
    const interval = setInterval(() => { if (filter === 'pending') load(); }, 6000);
    return () => clearInterval(interval);
  }, [filter, load]);

  // ── Approve ──────────────────────────────────────────────────
  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/registrations/${id}/approve`, { method: 'POST' });
      if (res.success) {
        notify('success', '✅ Registration approved! The company can now login.');
        if (viewReg?.id === id) setViewReg(null);
        load();
      } else {
        notify('error', res.message || 'Failed to approve');
      }
    } catch { notify('error', 'Network error. Try again.'); }
    setProcessing(null);
  };

  // ── Reject ───────────────────────────────────────────────────
  const handleReject = async () => {
    setProcessing(rejectId);
    try {
      const res = await saFetch(`${SA_API}/api/super-admin/registrations/${rejectId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejection_note: rejectNote }),
      });
      if (res.success) {
        notify('success', '🚫 Registration rejected.');
        setRejectId(null);
        setRejectNote('');
        load();
      } else {
        notify('error', res.message || 'Failed to reject');
      }
    } catch { notify('error', 'Network error. Try again.'); }
    setProcessing(null);
  };

  const pending = regs.filter(r => r.status === 'pending').length;

  const docUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const base = process.env.REACT_APP_API_URL?.endsWith('/api')
      ? process.env.REACT_APP_API_URL.slice(0, -4)
      : (process.env.REACT_APP_API_URL || 'http://localhost:5000');
    return `${base}${path}`;
  };

  return (
    <SuperAdminLayout title="Registration Approvals" subtitle="Review and approve self-registration requests" pendingCount={pending}>

      {/* Flash message */}
      {msg && (
        <div style={{
          background: msg.type === 'success' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: msg.type === 'success' ? '#6ee7b7' : '#fca5a5',
          padding: '12px 16px', borderRadius: 10, marginBottom: 16,
          fontSize: 14, fontWeight: 600,
        }}>{msg.text}</div>
      )}

      <div className="sa-card">
        {/* ── Filter tabs ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div className="sa-card-title" style={{ marginBottom: 0 }}>
            📋 Registrations
            {filter === 'pending' && pending > 0 && (
              <>
                <span className="sa-live-dot" style={{ marginLeft: 8 }} />
                <span style={{ fontSize: 13, color: 'var(--sa-warning)', fontWeight: 700, marginLeft: 4 }}>
                  {pending} pending
                </span>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['pending', 'approved', 'rejected', 'all'].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: '1px solid var(--sa-border)', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', textTransform: 'capitalize',
                  background: filter === s ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                  color: filter === s ? 'var(--sa-primary)' : 'var(--sa-muted)',
                  transition: 'all 0.15s',
                }}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div className="sa-loading"><span className="sa-spinner" /> Loading registrations…</div>
        ) : regs.length === 0 ? (
          <div className="sa-empty">
            <div className="sa-empty-icon">{filter === 'pending' ? '✅' : '📋'}</div>
            <p>No {filter === 'all' ? '' : filter} registrations found</p>
          </div>
        ) : (
          <div className="sa-table-wrap">
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Company</th><th>Email</th><th>Phone</th>
                  <th>Document</th><th>Submitted</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regs.map(reg => (
                  <tr key={reg.id}>
                    <td><div style={{ fontWeight: 600 }}>{reg.company_name}</div></td>
                    <td style={{ color: 'var(--sa-muted)', fontSize: 12.5 }}>{reg.email}</td>
                    <td style={{ color: 'var(--sa-muted)' }}>{reg.phone || '—'}</td>
                    <td>
                      {reg.proof_document
                        ? <a href={docUrl(reg.proof_document)} target="_blank" rel="noreferrer"
                          style={{ color: 'var(--sa-primary)', fontSize: 12, textDecoration: 'none', fontWeight: 600 }}>
                          📎 View Doc
                        </a>
                        : <span style={{ color: 'var(--sa-muted)', fontSize: 12 }}>—</span>
                      }
                    </td>
                    <td style={{ color: 'var(--sa-muted)', fontSize: 12 }}>
                      {new Date(reg.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td><span className={`sa-status ${reg.status}`}>{reg.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={() => setViewReg(reg)}>
                          👁 View
                        </button>
                        {reg.status === 'pending' && (
                          <>
                            <button
                              className="sa-btn sa-btn-success sa-btn-sm"
                              disabled={processing === reg.id}
                              onClick={() => handleApprove(reg.id)}
                            >
                              {processing === reg.id ? '…' : '✅ Approve'}
                            </button>
                            <button
                              className="sa-btn sa-btn-danger sa-btn-sm"
                              disabled={processing === reg.id}
                              onClick={() => { setRejectId(reg.id); setRejectNote(''); }}
                            >
                              ❌ Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── View Detail Modal ── */}
      {viewReg && (
        <div className="sa-modal-overlay" onClick={() => setViewReg(null)}>
          <div className="sa-modal" onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>📋 Registration Details</h3>
              <button className="sa-modal-close" onClick={() => setViewReg(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                ['Company Name', viewReg.company_name],
                ['Email Address', viewReg.email],
                ['Phone Number', viewReg.phone || '—'],
                ['Address', viewReg.address || '—'],
                ['Submitted On', new Date(viewReg.created_at).toLocaleString()],
                ['Status', viewReg.status],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 12, borderBottom: '1px solid var(--sa-border)', paddingBottom: 12 }}>
                  <div style={{ width: 140, color: 'var(--sa-muted)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>{label}</div>
                  <div style={{ flex: 1, fontSize: 13.5, textTransform: label === 'Status' ? 'capitalize' : 'none' }}>{value}</div>
                </div>
              ))}

              {viewReg.proof_document && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 140, color: 'var(--sa-muted)', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>Proof Document</div>
                  <a href={docUrl(viewReg.proof_document)} target="_blank" rel="noreferrer"
                    style={{ color: 'var(--sa-primary)', fontSize: 13.5, fontWeight: 600 }}>
                    📎 Download / View
                  </a>
                </div>
              )}

              {viewReg.rejection_note && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 12, marginTop: 4 }}>
                  <div style={{ color: 'var(--sa-danger)', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>REJECTION REASON</div>
                  <div style={{ color: 'var(--sa-muted)', fontSize: 13 }}>{viewReg.rejection_note}</div>
                </div>
              )}
            </div>

            <div className="sa-modal-actions">
              {viewReg.status === 'pending' && (
                <>
                  <button
                    className="sa-btn sa-btn-success"
                    disabled={processing === viewReg.id}
                    onClick={() => handleApprove(viewReg.id)}
                  >
                    ✅ Approve
                  </button>
                  <button
                    className="sa-btn sa-btn-danger"
                    onClick={() => { setRejectId(viewReg.id); setViewReg(null); }}
                  >
                    ❌ Reject
                  </button>
                </>
              )}
              <button className="sa-btn sa-btn-ghost" onClick={() => setViewReg(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Reason Modal ── */}
      {rejectId && (
        <div className="sa-modal-overlay" onClick={() => setRejectId(null)}>
          <div className="sa-modal" style={{ width: 420 }} onClick={e => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>❌ Reject Registration</h3>
              <button className="sa-modal-close" onClick={() => setRejectId(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p style={{ color: 'var(--sa-muted)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 16 }}>
              The applicant will be notified that their request was not approved.
            </p>
            <div className="sa-form-group">
              <label>Reason for Rejection <span style={{ color: 'var(--sa-muted)', fontWeight: 400, fontSize: 12 }}>(optional)</span></label>
              <textarea
                placeholder="Help the applicant understand why their registration was not approved…"
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                style={{ minHeight: 90 }}
              />
            </div>
            <div className="sa-modal-actions">
              <button className="sa-btn sa-btn-ghost" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="sa-btn sa-btn-danger" disabled={!!processing} onClick={handleReject}>
                {processing ? <><span className="sa-spinner" />Processing…</> : '❌ Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  );
};

export default RegistrationApprovals;
