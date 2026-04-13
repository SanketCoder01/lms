import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatRent, safeFloat, parseSafe } from '../../../utils/formatters';

const FinancialValueMonthly = ({ leases = [], loading }) => {
  // Process lease data for the 4 categories - show current month and next 11 months
  const chartData = useMemo(() => {
    if (!leases || leases.length === 0) {
      console.log('FinancialValueMonthly: No leases data');
      return [];
    }

    console.log('FinancialValueMonthly: Processing leases:', leases.length, leases);

    // Generate current month and next 11 months (12 months total, starting from current)
    const now = new Date();
    const months = [];
    
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const yearShort = d.getFullYear().toString().slice(-2);
      months.push({
        key: d.toISOString().slice(0, 7),
        label: `${monthName} ${yearShort}`,
        fixedLockIn: 0,
        fixedPost: 0,
        mgLockIn: 0,
        mgPost: 0,
      });
    }

    console.log('FinancialValueMonthly: Generated months:', months.map(m => m.label));

    // Categorize leases and calculate monthly values
    leases.forEach(lease => {
      // Skip leases without proper dates
      if (!lease.lease_start) {
        console.log(`FinancialValueMonthly: Skipping lease ${lease.id} - missing lease_start`);
        return;
      }
      
      // Normalize dates to first of month for comparison
      const leaseStart = new Date(lease.lease_start);
      const leaseStartMonth = new Date(leaseStart.getFullYear(), leaseStart.getMonth(), 1);
      
      // If no lease_end, assume it's ongoing (use current date or far future)
      const leaseEnd = lease.lease_end ? new Date(lease.lease_end) : new Date(2030, 11, 31);
      const leaseEndMonth = new Date(leaseEnd.getFullYear(), leaseEnd.getMonth(), 1);
      
      // Issue #21 — no parseInt rounding; use parseSafe
      const lockInMonths = parseSafe(lease.lock_in_period || lease.lock_in_months, 36);
      const lockInEnd = new Date(leaseStart.getFullYear(), leaseStart.getMonth() + Math.floor(lockInMonths), 1);

      const monthlyRent = parseSafe(lease.monthly_rent);
      const mgAmount    = parseSafe(lease.mg_amount) || monthlyRent;

      // Determine rent model - check multiple variations
      const rentModel = (lease.rent_model || '').toLowerCase().replace(/\s+/g, '');
      const isFixed = rentModel === 'fixed';
      const isMG = rentModel === 'revenueshare' || rentModel === 'hybrid' || rentModel === 'mg';

      console.log(`FinancialValueMonthly: Lease ${lease.id}`);
      console.log(`  - rent_model: "${lease.rent_model}" -> isFixed=${isFixed}, isMG=${isMG}`);
      console.log(`  - monthly_rent: ${monthlyRent}, mg_amount: ${mgAmount}`);
      console.log(`  - lease_start: ${lease.lease_start}, lease_end: ${lease.lease_end}`);
      console.log(`  - lock_in_period: ${lease.lock_in_period} months, lock_in_ends: ${lockInEnd.toISOString().slice(0, 10)}`);

      months.forEach(month => {
        const monthDate = new Date(month.key + '-01');
        
        // Check if lease is active in this month (compare year-month)
        const isActive = monthDate >= leaseStartMonth && monthDate <= leaseEndMonth;
        
        if (isActive) {
          const isLockInPeriod = monthDate < lockInEnd;

          if (isFixed) {
            if (isLockInPeriod) {
              month.fixedLockIn += monthlyRent;
            } else {
              month.fixedPost += monthlyRent;
            }
          } else if (isMG) {
            if (isLockInPeriod) {
              month.mgLockIn += mgAmount;
            } else {
              month.mgPost += mgAmount;
            }
          }
        }
      });
    });

    console.log('FinancialValueMonthly: Monthly data:', months);

    // Return monthly values (not cumulative) for projection matrix
    const result = months.map(month => ({
      month: month.label,
      fixedLockIn: month.fixedLockIn,
      fixedPost: month.fixedPost,
      mgLockIn: month.mgLockIn,
      mgPost: month.mgPost,
    }));

    console.log('FinancialValueMonthly: Chart data result:', result);
    return result;
  }, [leases]);

  // Calculate totals - sum of all months for annual projection
  const totals = useMemo(() => {
    if (chartData.length === 0) return { fixedLockIn: 0, fixedPost: 0, mgLockIn: 0, mgPost: 0 };
    return chartData.reduce((acc, month) => ({
      fixedLockIn: acc.fixedLockIn + month.fixedLockIn,
      fixedPost: acc.fixedPost + month.fixedPost,
      mgLockIn: acc.mgLockIn + month.mgLockIn,
      mgPost: acc.mgPost + month.mgPost,
    }), { fixedLockIn: 0, fixedPost: 0, mgLockIn: 0, mgPost: 0 });
  }, [chartData]);

  // Use centralized formatRent from formatters.js
  const formatAmount = (val) => {
    return formatRent(safeFloat(val));
  };

  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>{label}</p>
          {payload.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: 12, height: 12, backgroundColor: p.color, borderRadius: 2 }} />
              <span style={{ color: '#475569', fontSize: 12 }}>
                {p.name}: {formatAmount(p.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="echo-card" style={{ border: 'none', height: '100%' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
        By Financial Value (Monthly)
      </h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
        Fixed & MG rent by lock-in status
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : chartData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No lease data available</div>
      ) : (
        <>
          {/* Legend - Compact */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 10, height: 3, backgroundColor: '#1e40af', borderRadius: 2 }} />
              <span style={{ fontSize: '10px', color: '#475569' }}>Fixed lock-in</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 10, height: 3, backgroundColor: '#3b82f6', borderRadius: 2 }} />
              <span style={{ fontSize: '10px', color: '#475569' }}>Fixed post</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 10, height: 3, backgroundColor: '#059669', borderRadius: 2 }} />
              <span style={{ fontSize: '10px', color: '#475569' }}>MG lock-in</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: 10, height: 3, backgroundColor: '#10b981', borderRadius: 2 }} />
              <span style={{ fontSize: '10px', color: '#475569' }}>MG post</span>
            </div>
          </div>

          {/* Scrollable Chart Container */}
          <style>
            {`
              .financial-scroll-container::-webkit-scrollbar {
                height: 6px;
              }
              .financial-scroll-container::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
              }
              .financial-scroll-container::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
              }
              .financial-scroll-container::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}
          </style>
          <div 
            className="financial-scroll-container"
            style={{ 
              overflowX: 'auto',
              paddingBottom: '4px',
              width: '100%'
            }}
          >
            <div style={{ minWidth: '720px', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={chartData} 
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={formatAmount}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {/* Fixed Lock-in - Dark Blue */}
                  <Line 
                    type="linear"
                    dataKey="fixedLockIn" 
                    stroke="#1e40af" 
                    strokeWidth={2.5}
                    dot={false}
                    name="Fixed lock-in"
                  />
                  {/* Fixed Post - Light Blue */}
                  <Line 
                    type="linear"
                    dataKey="fixedPost" 
                    stroke="#3b82f6" 
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Fixed post"
                  />
                  {/* MG Lock-in - Dark Green */}
                  <Line 
                    type="linear"
                    dataKey="mgLockIn" 
                    stroke="#059669" 
                    strokeWidth={2.5}
                    dot={false}
                    name="MG lock-in"
                  />
                  {/* MG Post - Light Green */}
                  <Line 
                    type="linear"
                    dataKey="mgPost" 
                    stroke="#10b981" 
                    strokeWidth={2.5}
                    strokeDasharray="5 5"
                    dot={false}
                    name="MG post"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Summary Stats - Compact */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '8px', 
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e40af', margin: 0 }}>
                {formatAmount(totals.fixedLockIn)}
              </p>
              <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0' }}>Fixed lock-in</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#3b82f6', margin: 0 }}>
                {formatAmount(totals.fixedPost)}
              </p>
              <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0' }}>Fixed post</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#059669', margin: 0 }}>
                {formatAmount(totals.mgLockIn)}
              </p>
              <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0' }}>MG lock-in</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#10b981', margin: 0 }}>
                {formatAmount(totals.mgPost)}
              </p>
              <p style={{ fontSize: '9px', color: '#64748b', margin: '2px 0 0' }}>MG post</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialValueMonthly;
