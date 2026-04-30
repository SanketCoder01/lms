import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveUnitDisplay } from '../../../utils/formatters';

const fmtDate = (d) => {
  if (!d) return '-';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return '-';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/**
 * Resolve brand name exclusively from Masters (parties table).
 * Sources in priority order — all come from the parties table via FK join or partiesMap:
 *   1. partiesMap lookup by party_tenant_id (separate parties API)
 *   2. lease.tenant.brand_name  (FK join from parties table in getAllLeases SELECT)
 *   3. lease.tenant.company_name (FK join from parties table)
 * Never uses first_name, last_name, tenant_name or any individual name.
 */
const resolveBrandFromMasters = (lease, partiesMap) => {
  // Try partiesMap first (from getAllParties API)
  if (partiesMap && lease.party_tenant_id) {
    const p = partiesMap[lease.party_tenant_id];
    if (p?.brand_name?.trim()) return p.brand_name.trim();
    if (p?.company_name?.trim()) return p.company_name.trim();
  }
  // Fall back to FK-joined tenant data (also from parties/Masters table)
  if (lease.tenant?.brand_name?.trim()) return lease.tenant.brand_name.trim();
  if (lease.tenant?.company_name?.trim()) return lease.tenant.company_name.trim();
  return null;
};

const LeaseExpirySection = ({ leases = [], partiesMap = {}, loading }) => {
  const navigate = useNavigate();

  const getExpiryColor = (days) => {
    if (days <= 30) return { bg: '#fee2e2', text: '#991b1b', status: 'Critical' };
    if (days <= 90) return { bg: '#fef3c7', text: '#854d0e', status: 'Warning' };
    return { bg: '#dcfce7', text: '#166534', status: 'Active' };
  };

  const processedLeases = useMemo(() => {
    if (!leases || leases.length === 0) return [];
    const now = new Date();
    return leases
      .filter(lease => {
        const status = (lease.status || '').toLowerCase().trim();
        const isActive = ['active', 'approved', 'executed', 'registered', 'occupied'].includes(status);
        return isActive && !!(lease.lease_end || lease.lease_end_date);
      })
      .map(lease => {
        const expiryDate = new Date(lease.lease_end || lease.lease_end_date);
        const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        const unitNumber = resolveUnitDisplay(lease);
        const brandName = resolveBrandFromMasters(lease, partiesMap);
        if (!brandName) return null; // skip if no brand in Masters
        return { leaseId: lease.id, unitNumber: unitNumber || '-', brandName, expiryDate, days: diffDays };
      })
      .filter(l => l !== null && l.days > 0)
      .sort((a, b) => a.days - b.days);
  }, [leases, partiesMap]);

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Leases Nearing Expiry</h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Expiry date · Sorted by urgency</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : processedLeases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No leases nearing expiry</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
          {processedLeases.slice(0, 6).map((l, i) => {
            const colorInfo = getExpiryColor(l.days);
            return (
              <div
                key={i}
                onClick={() => navigate(`/admin/view-lease/${l.leaseId}`)}
                style={{
                  display: 'grid', gridTemplateColumns: '60px 1fr auto',
                  alignItems: 'center', gap: '10px', cursor: 'pointer',
                  padding: '10px 12px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', transition: 'all 0.15s', background: '#fff'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
              >
                <div style={{ background: '#eff6ff', borderRadius: '6px', padding: '6px 4px', textAlign: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', display: 'block' }}>{l.unitNumber}</span>
                  <span style={{ fontSize: '9px', color: '#93c5fd' }}>unit</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: '#0f172a', margin: '0 0 2px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.brandName}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>Expires: <strong>{fmtDate(l.expiryDate)}</strong></p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: colorInfo.text }}>{l.days}d</div>
                  <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '9999px', fontWeight: 600, backgroundColor: colorInfo.bg, color: colorInfo.text }}>{colorInfo.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LeaseExpirySection;
