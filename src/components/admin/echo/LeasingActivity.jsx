import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const LeasingActivity = ({ chartData, newLeases, areaLeased, loading, loiCount = 0, executedCount = 0, registeredCount = 0 }) => {
  // Use the actual areaLeased prop directly without rounding
  const displayAreaLeased = areaLeased || 0;

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const unitsData = payload.find(p => p.dataKey === 'units');
      const areaData = payload.find(p => p.dataKey === 'area');

      return (
        <div style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>{label}</p>
          {unitsData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: 12, height: 12, backgroundColor: '#1e40af', borderRadius: 2 }} />
              <span style={{ color: '#475569', fontSize: 13 }}>{unitsData.value} leases created</span>
            </div>
          )}
          {areaData && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 12, height: 12, backgroundColor: '#93c5fd', borderRadius: 2 }} />
              <span style={{ color: '#475569', fontSize: 13 }}>{areaData.value.toLocaleString('en-IN')} sqft leased</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Use real data from props - no fake data
  const hasRealData = chartData && chartData.length > 0 && chartData.some(d => d.units > 0 || d.area > 0);
  const displayData = hasRealData ? chartData : [];

  // Calculate date range from actual data
  const getDateRange = () => {
    if (!hasRealData || displayData.length === 0) return '';
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endStr = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  return (
    <div className="echo-card" style={{ border: 'none', height: '100%' }}>
      <h3 className="echo-card-title">Leasing Activity</h3>
      <p className="echo-card-subtitle">
        {hasRealData ? getDateRange() : 'No leasing activity yet'} · {displayAreaLeased.toLocaleString('en-IN')} sqft leased
      </p>

      {/* LOI, Executed, Registered stats - Above the graph */}
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

      {hasRealData && (
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={displayData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar yAxisId="left" dataKey="units" fill="#1e40af" radius={[2, 2, 0, 0]} barSize={16} name="Leases" />
          <Bar yAxisId="right" dataKey="area" fill="#93c5fd" radius={[2, 2, 0, 0]} barSize={16} name="Area leased (sqft)" />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
        </BarChart>
      </ResponsiveContainer>
      )}

      {!hasRealData && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <p style={{ margin: 0, fontSize: '14px' }}>No leasing activity recorded yet</p>
          <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#94a3b8' }}>Lease data will appear here once created</p>
        </div>
      )}
    </div>
  );
};

export default LeasingActivity;
