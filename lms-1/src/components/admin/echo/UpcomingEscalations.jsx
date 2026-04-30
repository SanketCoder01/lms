import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveUnitDisplay, formatRent, safeFloat } from '../../../utils/formatters';

const fmtDate = (d) => {
  if (!d) return '-';
  const dt = d instanceof Date ? d : new Date(d);
  if (isNaN(dt)) return '-';
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const resolveBrandFromMasters = (lease, partiesMap) => {
  if (partiesMap && lease.party_tenant_id) {
    const p = partiesMap[lease.party_tenant_id];
    if (p?.brand_name?.trim()) return p.brand_name.trim();
    if (p?.company_name?.trim()) return p.company_name.trim();
  }
  if (lease.tenant?.brand_name?.trim()) return lease.tenant.brand_name.trim();
  if (lease.tenant?.company_name?.trim()) return lease.tenant.company_name.trim();
  return null;
};

const UpcomingEscalations = ({ leases = [], partiesMap = {}, loading }) => {
  const navigate = useNavigate();

  const getEscalationColor = (days) => {
    if (days <= 30) return { bg: '#fee2e2', text: '#991b1b', status: 'Critical' };
    if (days <= 90) return { bg: '#fef3c7', text: '#854d0e', status: 'Warning' };
    return { bg: '#f0fdf4', text: '#166534', status: 'Scheduled' };
  };

  const escalationData = useMemo(() => {
    if (!leases || leases.length === 0) return [];
    const now = new Date();
    const escalations = [];

    leases
      .filter(lease => {
        const status = (lease.status || '').toLowerCase().trim();
        return ['active', 'approved', 'executed', 'registered', 'occupied'].includes(status);
      })
      .forEach(lease => {
        const brandName = resolveBrandFromMasters(lease, partiesMap);
        if (!brandName) return; // skip if no brand in Masters

        const leaseEscalations = Array.isArray(lease.escalations) ? lease.escalations : [];
        if (leaseEscalations.length === 0) return;

        const upcomingEsc = leaseEscalations
          .filter(e => e.effective_from && new Date(e.effective_from) > now)
          .sort((a, b) => new Date(a.effective_from) - new Date(b.effective_from))[0];

        if (!upcomingEsc) return;

        const escDate = new Date(upcomingEsc.effective_from);
        const daysDiff = Math.ceil((escDate - now) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 0) return;

        const unitNumber = resolveUnitDisplay(lease);
        const area = safeFloat(lease.chargeable_area || lease.area_leased || lease.units?.chargeable_area || 0);
        const currentRent = safeFloat(lease.monthly_rent || 0);

        let newRent = currentRent;
        if (upcomingEsc.increase_type === 'Percentage' && upcomingEsc.value) {
          newRent = currentRent * (1 + parseFloat(upcomingEsc.value) / 100);
        } else if (upcomingEsc.increase_type === 'Fixed' && upcomingEsc.value) {
          newRent = currentRent + parseFloat(upcomingEsc.value);
        } else if (upcomingEsc.rate_per_sqft) {
          newRent = parseFloat(upcomingEsc.rate_per_sqft) * area;
        }

        escalations.push({
          leaseId: lease.id,
          unitNumber: unitNumber || '-',
          brandName,
          currentRent,
          newRent,
          days: daysDiff,
          escalationDate: escDate,
        });
      });

    return escalations.sort((a, b) => a.days - b.days);
  }, [leases, partiesMap]);

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Upcoming Escalations</h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Escalation date · Sorted by urgency</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : escalationData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No upcoming escalations found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', paddingRight: '4px' }}>
          {escalationData.slice(0, 6).map((esc, i) => {
            const colorInfo = getEscalationColor(esc.days);
            return (
              <div
                key={i}
                onClick={() => navigate(`/admin/view-lease/${esc.leaseId}`)}
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
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', display: 'block' }}>{esc.unitNumber}</span>
                  <span style={{ fontSize: '9px', color: '#93c5fd' }}>unit</span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '13px', color: '#0f172a', margin: '0 0 2px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{esc.brandName}</p>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 1px' }}>On: <strong>{fmtDate(esc.escalationDate)}</strong></p>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                    {formatRent(esc.currentRent)} <span style={{ color: '#0ea5e9' }}>→</span> {formatRent(esc.newRent)} PM
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: colorInfo.text }}>{esc.days}d</div>
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

export default UpcomingEscalations;
