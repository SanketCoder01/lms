import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeBrandName, formatRent, safeFloat } from '../../../utils/formatters';

const UpcomingEscalations = ({ leases = [], loading }) => {
  const navigate = useNavigate();

  const handleLeaseClick = (leaseId) => {
    navigate(`/admin/view-lease/${leaseId}`);
  };

  // Color coding based on days until escalation
  // Red: < 30 days, Yellow: 30-90 days, Green: > 90 days
  const getEscalationColor = (days) => {
    if (days <= 30) return { bg: '#fee2e2', text: '#991b1b', status: 'Critical' };
    if (days <= 90) return { bg: '#fef3c7', text: '#854d0e', status: 'Warning' };
    return { bg: '#dcfce7', text: '#166534', status: 'Scheduled' };
  };

  // Calculate escalations from lease data
  const escalationData = useMemo(() => {
    if (!leases || leases.length === 0) {
      return [];
    }

    const now = new Date();
    const escalations = [];

    // Filter active leases first
    const activeLeases = leases.filter(lease => {
      const status = (lease.status || '').toLowerCase();
      return status === 'active' || status === 'approved' || status === 'occupied';
    });

    activeLeases.forEach(lease => {
      // Check for escalation dates in lease data
      const escalationDate = lease.next_escalation_date || lease.escalation_date;

      if (escalationDate) {
        const escDate = new Date(escalationDate);
        const daysDiff = Math.ceil((escDate - now) / (1000 * 60 * 60 * 24));

        if (daysDiff > 0) {
          // Get brand name - use brand_name directly from lease, show '-' if not defined
          const rawBrandName = lease.brand_name ||
            lease.tenant?.brand_name ||
            lease.brandName ||
            lease.tenant?.company_name ||
            lease.tenant?.name ||
            lease.tenant_name ||
            lease.tenantName || '-';
          const brandName = sanitizeBrandName(rawBrandName);

          // Get unit number
          const unitNumber = lease.unit_number || lease.units?.unit_number || lease.unit?.unit_number || 'N/A';

          // Get rent amount
          const rentAmount = lease.monthly_rent || 0;

          escalations.push({
            leaseId: lease.id,
            unitNumber: unitNumber,
            brandName: brandName,
            currentRent: rentAmount,
            newRent: lease.escalated_rent || (rentAmount * 1.1),
            days: daysDiff,
            escalationDate: escDate
          });
        }
      }

      // Also check for rent escalations based on tenure (every 3 years)
      if (lease.lease_start && !escalationDate) {
        const leaseStart = new Date(lease.lease_start);
        const yearsActive = (now - leaseStart) / (1000 * 60 * 60 * 24 * 365);

        const escalationInterval = 3; // years
        const nextEscalationYear = Math.ceil(yearsActive / escalationInterval) * escalationInterval;
        const nextEscalationDate = new Date(leaseStart);
        nextEscalationDate.setFullYear(nextEscalationDate.getFullYear() + nextEscalationYear);

        if (nextEscalationDate > now) {
          const daysDiff = Math.ceil((nextEscalationDate - now) / (1000 * 60 * 60 * 24));

          // Avoid duplicates
          const existing = escalations.find(e => e.leaseId === lease.id);
          if (!existing && daysDiff > 0) {
            const rawBrandName = lease.brand_name ||
              lease.tenant?.brand_name ||
              lease.brandName ||
              lease.tenant?.company_name ||
              lease.tenant?.name ||
              lease.tenant_name ||
              lease.tenantName || '-';
            const brandName = sanitizeBrandName(rawBrandName);

            const unitNumber = lease.unit_number || lease.units?.unit_number || lease.unit?.unit_number || 'N/A';
            const rentAmount = lease.monthly_rent || 0;

            escalations.push({
              leaseId: lease.id,
              unitNumber: unitNumber,
              brandName: brandName,
              currentRent: rentAmount,
              newRent: rentAmount * 1.1,
              days: daysDiff,
              escalationDate: nextEscalationDate
            });
          }
        }
      }
    });

    // Sort by days ascending
    escalations.sort((a, b) => a.days - b.days);
    return escalations;
  }, [leases]);


  // Use centralized formatRent from formatters.js

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Upcoming Escalations</h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Rent escalation status · Sorted by urgency</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : escalationData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No upcoming escalations found</div>
      ) : (
        <>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '300px',
            overflowY: 'auto',
            paddingRight: '8px'
          }}>
            <style>
              {`
                .escalation-scroll::-webkit-scrollbar {
                  width: 6px;
                }
                .escalation-scroll::-webkit-scrollbar-track {
                  background: #f1f5f9;
                  border-radius: 3px;
                }
                .escalation-scroll::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 3px;
                }
                .escalation-scroll::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
              `}
            </style>
            {escalationData.map((esc, i) => {
              const colorInfo = getEscalationColor(esc.days);
              return (
                <div
                  key={i}
                  onClick={() => handleLeaseClick(esc.leaseId)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', minWidth: '60px' }}>{esc.unitNumber}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: '#0f172a', margin: 0, fontWeight: 500 }}>{esc.brandName}</p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}> {formatRent(safeFloat(esc.currentRent))} <span style={{ color: '#0ea5e9' }}>to</span>  {formatRent(safeFloat(esc.newRent))}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: colorInfo.text }}>{esc.days} days</span>
                    <span style={{
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontWeight: 500,
                      backgroundColor: colorInfo.bg,
                      color: colorInfo.text
                    }}>{colorInfo.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default UpcomingEscalations;
