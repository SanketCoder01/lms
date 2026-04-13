import React from 'react';
import { useNavigate } from 'react-router-dom';
import { sanitizeBrandName, formatRent, safeFloat } from '../../../utils/formatters';

const LockInExpirySection = ({ leases = [], loading }) => {
  const navigate = useNavigate();

  const handleLeaseClick = (leaseId) => {
    navigate(`/admin/view-lease/${leaseId}`);
  };
  // Color coding based on days until lock-in expiry
  // Red: < 30 days, Yellow: 30-90 days, Green: > 90 days
  const getLockInColor = (days) => {
    if (days <= 30) return { bg: '#fee2e2', text: '#991b1b', status: 'Critical' };
    if (days <= 90) return { bg: '#fef3c7', text: '#854d0e', status: 'Warning' };
    return { bg: '#dcfce7', text: '#166534', status: 'Secure' };
  };

  // Process real lease data for lock-in expiry
  const processLockInLeases = (leaseData) => {
    if (!leaseData || leaseData.length === 0) {
      console.log('LockInExpiry: No lease data provided');
      return [];
    }

    console.log('LockInExpiry: Processing leases:', leaseData.length, leaseData);
    const now = new Date();

    const processed = leaseData
      .filter(lease => {
        // Only include active/approved leases with a valid lease_start date
        const status = (lease.status || '').toLowerCase();
        const isActive = status === 'active' || status === 'approved' || status === 'occupied';
        const hasStartDate = lease.lease_start || lease.lease_start_date || lease.startDate;
        console.log(`LockInExpiry: Lease ${lease.id}, status: ${lease.status}, isActive: ${isActive}, hasStartDate: ${hasStartDate}`);
        return isActive && hasStartDate;
      })
      .map(lease => {
        // Try multiple field name variations
        const leaseStart = new Date(lease.lease_start || lease.lease_start_date || lease.startDate);
        const lockInMonths = parseInt(lease.lock_in_period || lease.lock_in_months || lease.lockInPeriod || lease.lockin_period_months) || 36;
        const lockInExpiry = new Date(leaseStart);
        lockInExpiry.setMonth(lockInExpiry.getMonth() + lockInMonths);

        const diffTime = lockInExpiry - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Get brand name from tenant/company details - use brand_name directly from lease
        const rawBrandName = lease.brand_name ||
          lease.tenant?.brand_name ||
          lease.brandName ||
          lease.tenant?.company_name ||
          lease.tenant?.name ||
          lease.tenant_name ||
          lease.tenantName || '-';
        const brandName = sanitizeBrandName(rawBrandName);

        // Get tenant name from various possible locations
        const tenantName = lease.tenant?.company_name || lease.tenant?.name || lease.tenant_name || lease.tenantName || '-';

        // Get area from various possible fields
        const areaValue = lease.area_leased || lease.areaLeased || lease.units?.chargeable_area || lease.unit?.chargeable_area || lease.area || 0;

        // Get rent amount
        const rentAmount = lease.monthly_rent || lease.monthlyRent || lease.rent || 0;

        console.log(`LockInExpiry: Lease ${lease.id}, brand: ${brandName}, tenant: ${tenantName}, days: ${diffDays}, lockInMonths: ${lockInMonths}`);

        // Get unit number
        const unitNumber = lease.unit_number || lease.units?.unit_number || lease.unit?.unit_number || 'N/A';

        return {
          leaseId: lease.id,
          unitNumber: unitNumber,
          brandName: brandName,
          tenant: tenantName,
          area: `${safeFloat(areaValue).toLocaleString('en-IN')} sqft`,
          amount: formatRent(safeFloat(rentAmount)),
          days: diffDays,
          lockInMonths: lockInMonths,
          lockInExpiry: lockInExpiry
        };
      })
      .filter(l => l.days > 0) // Only show future lock-in expiries
      .sort((a, b) => a.days - b.days); // Sort by days ascending (most urgent first)

    console.log('LockInExpiry: Processed leases count:', processed.length);
    return processed;
  };

  const processedLeases = processLockInLeases(leases);

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Lock in Nearing Expiry</h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Lock-in periods status · Sorted by urgency</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : processedLeases.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No active leases found</div>
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
                .lockin-scroll::-webkit-scrollbar {
                  width: 6px;
                }
                .lockin-scroll::-webkit-scrollbar-track {
                  background: #f1f5f9;
                  border-radius: 3px;
                }
                .lockin-scroll::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 3px;
                }
                .lockin-scroll::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
              `}
            </style>
            {processedLeases.map((l, i) => {
              const colorInfo = getLockInColor(l.days);
              return (
                <div
                  key={i}
                  onClick={() => handleLeaseClick(l.leaseId)}
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
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', minWidth: '60px' }}>{l.unitNumber}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '14px', color: '#0f172a', margin: 0, fontWeight: 500 }}>{l.brandName}</p>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{l.area} ·  {l.amount} PM</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: colorInfo.text }}>{l.days} days</span>
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

export default LockInExpirySection;
