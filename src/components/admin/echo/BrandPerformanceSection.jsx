import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const BrandPerformanceSection = ({ leases = [], loading }) => {
  const navigate = useNavigate();
  // Process real lease data - only revenue share leases
  const brandData = useMemo(() => {
    if (!leases || leases.length === 0) return [];
    
    console.log('BrandPerformance: Processing leases:', leases.length);
    
    // Filter only revenue share leases
    const revenueShareLeases = leases.filter(lease => {
      const model = (lease.rent_model || '').toLowerCase();
      return model === 'revenueshare' || model === 'revenue share' || model === 'hybrid';
    });
    
    console.log('BrandPerformance: Revenue share leases:', revenueShareLeases.length);
    
    return revenueShareLeases.map(lease => {
      const brandName = lease.tenant?.brand_name || lease.tenant?.nickname || lease.tenant?.company_name || lease.brand_name || lease.tenant_name || 'Unknown';
      const targetSales = parseFloat(lease.target_sales || lease.monthly_target || lease.min_guarantee_sales || 0);
      const actualSales = parseFloat(lease.monthly_net_sales || lease.net_sales || lease.actual_sales || 0);
      const pct = targetSales > 0 ? Math.round((actualSales / targetSales) * 100) : 0;
      
      const barWidth = Math.min(pct, 100) + '%';
      let barColor = '#c0392b'; // red for underperforming
      if (pct >= 100) barColor = '#1a5c2a'; // green for outperforming
      else if (pct >= 80) barColor = '#1e3a5f'; // blue for on track
      
      const formatValue = (val) => {
        if (!val) return '0';
        if (val >= 10000000) return `${(val / 10000000).toFixed(1)}Cr`;
        if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
        return val.toLocaleString('en-IN');
      };
      
      return {
        name: brandName,
        target: formatValue(targetSales) + '/mo',
        actual: formatValue(actualSales),
        pct,
        barColor,
        barWidth,
        isNew: lease.status === 'active' && new Date(lease.lease_start) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [leases]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const outperforming = brandData.filter(b => b.pct >= 100).length;
    const onTrack = brandData.filter(b => b.pct >= 80 && b.pct < 100).length;
    const underReview = brandData.filter(b => b.pct < 80).length;
    return { outperforming, onTrack, underReview };
  }, [brandData]);

  const handleBrandClick = (brandName) => {
    navigate(`/admin/leases?brand=${encodeURIComponent(brandName)}`);
  };

  // Get underperforming brands for warning
  const underperformingBrands = brandData.filter(b => b.pct < 80).slice(0, 2);

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Brand sales performance</h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Avg monthly sales vs lease target - last 6 months (or since commencement)</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : brandData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No revenue share leases found</div>
      ) : (
        <>
          {/* Summary stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Outperforming</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1a5c2a', margin: '4px 0' }}>{stats.outperforming}</p>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>brands {">="}100%</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>On track</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#1e3a5f', margin: '4px 0' }}>{stats.onTrack}</p>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>80-99%</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Under review</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#c0392b', margin: '4px 0' }}>{stats.underReview}</p>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>brands {"<"}80%</p>
            </div>
          </div>

          {/* Table header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '100px 1fr 80px 50px', 
            gap: '8px', 
            fontSize: '10px', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: '#64748b',
            marginBottom: '12px',
            paddingBottom: '4px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <span>Brand</span>
            <span>Actual vs Target</span>
            <span style={{ textAlign: 'right' }}>Actual</span>
            <span style={{ textAlign: 'right' }}>%</span>
          </div>

          {/* Rows - Scrollable */}
          <style>
            {`
              .brand-scroll-container::-webkit-scrollbar {
                width: 6px;
              }
              .brand-scroll-container::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
              }
              .brand-scroll-container::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
              }
              .brand-scroll-container::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}
          </style>
          <div 
            className="brand-scroll-container"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              maxHeight: '300px', 
              overflowY: 'auto',
              paddingRight: '8px'
            }}
          >
            {brandData.map((b, i) => (
              <div 
                key={i} 
                onClick={() => handleBrandClick(b.name)}
                style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px 50px', gap: '8px', alignItems: 'center', cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a' }}>{b.name}</span>
                  {b.isNew && (
                    <span style={{ 
                      fontSize: '9px', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      backgroundColor: '#dbeafe', 
                      color: '#1d4ed8', 
                      fontWeight: 500 
                    }}>New</span>
                  )}
                </div>
                <div>
                  <div style={{ position: 'relative', height: '10px', backgroundColor: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ 
                      position: 'absolute', 
                      insetY: 0, 
                      left: 0, 
                      borderRadius: '9999px', 
                      backgroundColor: b.barColor,
                      width: b.barWidth 
                    }} />
                  </div>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0' }}>Target: {b.target}</p>
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>{b.actual}</span>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 600, 
                  textAlign: 'right',
                  color: b.pct >= 100 ? '#1a5c2a' : b.pct >= 80 ? '#0f172a' : '#c0392b'
                }}>{b.pct}%</span>
              </div>
            ))}
          </div>

          {/* Warning callout - only show if there are underperforming brands */}
          {underperformingBrands.length > 0 && (
            <div style={{ 
              marginTop: '20px', 
              backgroundColor: '#fefce8', 
              border: '1px solid #fef08a', 
              borderRadius: '6px', 
              padding: '12px' 
            }}>
              <p style={{ fontSize: '12px', color: '#854d0e', margin: 0 }}>
                {underperformingBrands.map(b => b.name).join(' & ')} {underperformingBrands.length === 1 ? 'is' : 'are'} significantly underperforming. Consider lease revision or exit triggers as per agreement terms.
              </p>
            </div>
          )}

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <a href="/admin/leases" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>
              Full brand analysis
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default BrandPerformanceSection;
