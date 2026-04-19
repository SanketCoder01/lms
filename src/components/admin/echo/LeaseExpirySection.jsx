import React from 'react';
import { useNavigate } from 'react-router-dom';
import { resolveBrandName, formatRent, safeFloat } from '../../../utils/formatters';

const LeaseExpirySection = ({ leases = [], loading }) => {
  const navigate = useNavigate();

  const handleLeaseClick = (leaseId) => {
    navigate(`/admin/view-lease/${leaseId}`);
  };
  // Color coding based on days until expiry
  // Red: < 30 days, Yellow: 30-90 days, Green: > 90 days
  const getExpiryColor = (days) => {
    if (days <= 30) return { bg: '#fee2e2', text: '#991b1b', status: 'Critical' };
    if (days <= 90) return { bg: '#fef3c7', text: '#854d0e', status: 'Warning' };
    return { bg: '#dcfce7', text: '#166534', status: 'Active' };
  };

  // Process real lease data
  const processLeases = (leaseData) => {
    if (!leaseData || leaseData.length === 0) {
      console.log('LeaseExpiry: No lease data provided');
      return [];
    }

    console.log('LeaseExpiry: Processing leases:', leaseData.length, leaseData);
    const now = new Date();

    const processed = leaseData
      .filter(lease => {
        // Only include active/approved leases with a valid lease_end date
        const status = (lease.status || '').toLowerCase();
        const isActive = status === 'active' || status === 'approved' || status === 'occupied';
        const hasEndDate = lease.lease_end || lease.lease_end_date || lease.endDate;
        console.log(`LeaseExpiry: Lease ${lease.id}, status: ${lease.status}, isActive: ${isActive}, hasEndDate: ${hasEndDate}`);
        return isActive && hasEndDate;
      })
      .map(lease => {
        const expiryDate = new Date(lease.lease_end || lease.lease_end_date || lease.endDate);
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const brandName = resolveBrandName(lease);

        console.log(`LeaseExpiry: Lease ${lease.id}, brand_name: ${lease.brand_name}, tenant:`, lease.tenant, `resolved: ${brandName}`);

        // Get tenant name from various possible locations
        const tenantName = lease.tenant?.company_name || lease.tenant?.name || lease.tenant_name || lease.tenantName || '-';

        // Get area from various possible fields
        const areaValue = lease.area_leased || lease.areaLeased || lease.units?.chargeable_area || lease.unit?.chargeable_area || lease.area || 0;

        // Get rent amount
        const rentAmount = lease.monthly_rent || lease.monthlyRent || lease.rent || 0;

        console.log(`LeaseExpiry: Lease ${lease.id}, brand: ${brandName}, tenant: ${tenantName}, days: ${diffDays}`);

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
          expiryDate: expiryDate
        };
      })
      .filter(l => l.days > 0) // Only show future expiries
      .sort((a, b) => a.days - b.days); // Sort by days ascending (most urgent first)

    console.log('LeaseExpiry: Processed leases count:', processed.length);
    return processed;
  };

  const processedLeases = processLeases(leases);

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Leases nearing expiry</h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Lease expiry status · Sorted by urgency</p>

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
                .lease-expiry-scroll::-webkit-scrollbar {
                  width: 6px;
                }
                .lease-expiry-scroll::-webkit-scrollbar-track {
                  background: #f1f5f9;
                  border-radius: 3px;
                }
                .lease-expiry-scroll::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 3px;
                }
                .lease-expiry-scroll::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
              `}
            </style>
            {processedLeases.map((l, i) => {
              const colorInfo = getExpiryColor(l.days);
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

export default LeaseExpirySection;
