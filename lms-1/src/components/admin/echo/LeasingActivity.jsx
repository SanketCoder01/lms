import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const LeasingActivity = ({ chartData, newLeases, areaLeased, loading, loiCount = 0, executedCount = 0, registeredCount = 0 }) => {
  const displayAreaLeased = areaLeased || 0;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>{label}</p>

          {data.registeredUnits > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <div style={{ width: 12, height: 12, backgroundColor: '#1e40af', borderRadius: 2 }} />
                <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Registered: {data.registeredUnits} lease{data.registeredUnits !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '20px' }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>{data.registeredArea.toLocaleString('en-IN')} sqft</span>
              </div>
            </div>
          )}

          {data.executedUnits > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <div style={{ width: 12, height: 12, backgroundColor: '#fb923c', borderRadius: 2 }} />
                <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>Executed: {data.executedUnits} lease{data.executedUnits !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '20px' }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>{data.executedArea.toLocaleString('en-IN')} sqft</span>
              </div>
            </div>
          )}

          {data.loiUnits > 0 && (
            <div style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                <div style={{ width: 12, height: 12, backgroundColor: '#fbbf24', borderRadius: 2 }} />
                <span style={{ color: '#475569', fontSize: 13, fontWeight: 500 }}>LOI: {data.loiUnits} lease{data.loiUnits !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '20px' }}>
                <span style={{ color: '#64748b', fontSize: 12 }}>{data.loiArea.toLocaleString('en-IN')} sqft</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const hasRealData = (chartData && chartData.length > 0 && chartData.some(d => d.units > 0)) || loiCount > 0 || executedCount > 0 || registeredCount > 0;
  const displayData = hasRealData ? chartData : [];


  const getDateRange = () => {
    if (!hasRealData || displayData.length === 0) return '';
    const startStr = displayData[0].month;
    const endStr = displayData[displayData.length - 1].month;
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="echo-card" style={{ border: 'none', height: '100%' }}>
      <h3 className="echo-card-title">Leasing Activity</h3>
      <p className="echo-card-subtitle">
        {hasRealData
          ? `${getDateRange()} · ${displayAreaLeased.toLocaleString('en-IN')} sqft leased`
          : 'No leasing activity yet'}
      </p>

      {/* LOI / Executed / Registered — always visible with label + value */}
      <div className="echo-leasing-stats">
        <div className="echo-leasing-stat">
          <p className="echo-leasing-stat-label">LOI</p>
          <p className="echo-leasing-stat-value">{loading ? '...' : loiCount}</p>
        </div>
        <div className="echo-leasing-stat">
          <p className="echo-leasing-stat-label">Leasing Executed</p>
          <p className="echo-leasing-stat-value">{loading ? '...' : executedCount}</p>
        </div>
        <div className="echo-leasing-stat">
          <p className="echo-leasing-stat-label">Leased Registered</p>
          <p className="echo-leasing-stat-value">{loading ? '...' : registeredCount}</p>
        </div>
      </div>

      {/* Bar chart — only when real data exists */}
      {hasRealData && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={displayData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />

            <Bar yAxisId="left" stackId="units" dataKey="registeredUnits" fill="#1e40af" name="Registered (Units)" />
            <Bar yAxisId="left" stackId="units" dataKey="executedUnits" fill="#fb923c" name="Executed (Units)" />
            <Bar yAxisId="left" stackId="units" dataKey="loiUnits" fill="#fbbf24" name="LOI (Units)" radius={[2, 2, 0, 0]} />

            <Bar yAxisId="right" stackId="area" dataKey="registeredArea" fill="#93c5fd" name="Registered (Area)" />
            <Bar yAxisId="right" stackId="area" dataKey="executedArea" fill="#fed7aa" name="Executed (Area)" />
            <Bar yAxisId="right" stackId="area" dataKey="loiArea" fill="#fde68a" name="LOI (Area)" radius={[2, 2, 0, 0]} />

            <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
          </BarChart>
        </ResponsiveContainer>
      )}

      {!hasRealData && !loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>No leasing activity recorded yet</p>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>
            Lease data will appear here once created
          </p>
        </div>
      )}
    </div>
  );
};

export default LeasingActivity;
