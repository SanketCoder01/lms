import React, { useMemo } from 'react';

const RentalProjectionTable = ({ leases = [], loading }) => {
  // Process real lease data
  const categories = useMemo(() => {
    if (!leases || leases.length === 0) {
      return [];
    }
    
    const now = new Date();
    const grouped = {
      fixedLockIn: { dot: "#1e3a5f", label: "Fixed rent - lock-in", units: 0, area: 0, type: "Fixed" },
      fixedPostLockIn: { dot: "#4a8ab5", label: "Fixed rent - post lock-in", units: 0, area: 0, type: "Fixed" },
      mgLockIn: { dot: "#1a8a5a", label: "MG rent - lock-in", units: 0, area: 0, type: "Fixed" },
      mgPostLockIn: { dot: "#3cc48a", label: "MG rent - post lock-in", units: 0, area: 0, type: "Fixed" },
      revShareLockIn: { dot: "#b8860b", label: "Rev. share - lock-in", units: 0, area: 0, type: "Variable" },
      revSharePostLockIn: { dot: "#e8a830", label: "Rev. share - post lock-in", units: 0, area: 0, type: "Variable" },
    };
    
    leases.forEach(lease => {
      const rentModel = (lease.rent_model || 'Fixed').toLowerCase();
      const leaseStart = new Date(lease.lease_start);
      const lockInMonths = parseInt(lease.lock_in_period) || 36;
      const lockInExpiry = new Date(leaseStart);
      lockInExpiry.setMonth(lockInExpiry.getMonth() + lockInMonths);
      const isLockInActive = lockInExpiry > now;
      
      const area = parseFloat(lease.area_leased || lease.units?.chargeable_area || 0);
      
      if (rentModel === 'fixed') {
        if (isLockInActive) {
          grouped.fixedLockIn.units += 1;
          grouped.fixedLockIn.area += area;
        } else {
          grouped.fixedPostLockIn.units += 1;
          grouped.fixedPostLockIn.area += area;
        }
      } else if (rentModel === 'revenueshare' || rentModel === 'revenue share' || rentModel === 'hybrid') {
        if (isLockInActive) {
          grouped.mgLockIn.units += 1;
          grouped.mgLockIn.area += area;
        } else {
          grouped.mgPostLockIn.units += 1;
          grouped.mgPostLockIn.area += area;
        }
      }
    });
    
    return Object.values(grouped).filter(c => c.units > 0);
  }, [leases]);

  const getTypeColor = (type) => {
    return type === 'Fixed' 
      ? { bg: '#dbeafe', text: '#1d4ed8' }
      : { bg: '#fed7aa', text: '#c2410c' };
  };

  const formatArea = (area) => {
    if (area >= 100000) return `${(area / 100000).toFixed(1)}L`;
    return area.toLocaleString('en-IN');
  };

  const totalUnits = categories.reduce((sum, c) => sum + c.units, 0);
  const totalArea = categories.reduce((sum, c) => sum + c.area, 0);

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '16px' }}>
        By Units & Area (SQFT)
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : (
        <>
          {/* Header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 60px 90px 70px', 
            gap: '8px', 
            fontSize: '10px', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: '#64748b',
            marginBottom: '8px',
            paddingBottom: '4px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <span>Rental Category</span>
            <span style={{ textAlign: 'right' }}>Units</span>
            <span style={{ textAlign: 'right' }}>Area (SQFT)</span>
            <span style={{ textAlign: 'center' }}>Type</span>
          </div>

          {/* Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categories.map((c, i) => {
              const typeColor = getTypeColor(c.type);
              return (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 70px', gap: '8px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: '14px', color: '#0f172a' }}>{c.label}</span>
                  </div>
                  <span style={{ fontSize: '14px', color: '#0f172a', textAlign: 'right' }}>{c.units}</span>
                  <span style={{ fontSize: '14px', color: '#0f172a', textAlign: 'right' }}>{formatArea(c.area)}</span>
                  <span style={{ display: 'flex', justifyContent: 'center' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      padding: '2px 8px', 
                      borderRadius: '9999px', 
                      fontWeight: 500,
                      backgroundColor: typeColor.bg,
                      color: typeColor.text
                    }}>{c.type}</span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div style={{ marginTop: '16px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 90px 70px', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>Total leased</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}></span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}></span>
              <span />
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{totalUnits} units · {formatArea(totalArea)} sqft</p>
          </div>
        </>
      )}
    </div>
  );
};

export default RentalProjectionTable;
