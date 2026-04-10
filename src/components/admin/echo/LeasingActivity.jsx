import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const LeasingActivity = ({ chartData, newLeases, areaLeased, loisSigned, loading }) => {
  // Use the actual areaLeased prop directly (it's already calculated correctly in EchoDashboard)
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
              <span style={{ color: '#475569', fontSize: 13 }}>{(areaData.value * 1000).toLocaleString('en-IN')} sqft leased</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Default chart data if empty - shows last 6 months dynamically
  const getDefaultData = () => {
    const now = new Date();
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      data.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        units: 0,
        area: 0
      });
    }
    return data;
  };

  const displayData = chartData && chartData.length > 0 ? chartData : getDefaultData();

  return (
    <div className="echo-card" style={{ border: 'none', height: '100%' }}>
      <h3 className="echo-card-title">Leasing activity — last 6 months</h3>
      <p className="echo-card-subtitle">New agreements, LOIs and area leased by month</p>

      <div className="echo-leasing-stats">
        <div className="echo-leasing-stat">
          <p className="echo-leasing-stat-label">New leases</p>
          <p className="echo-leasing-stat-value">{loading ? '...' : newLeases}</p>
          <p className="echo-leasing-stat-change positive">in 6 months</p>
        </div>
        <div className="echo-leasing-stat">
          <p className="echo-leasing-stat-label">Area leased</p>
          <p className="echo-leasing-stat-value">{loading ? '...' : displayAreaLeased.toLocaleString('en-IN')}</p>
          <p className="echo-leasing-stat-change">sqft in 6 months</p>
        </div>
        <div className="echo-leasing-stat">
          <p className="echo-leasing-stat-label">LOIs signed</p>
          <p className="echo-leasing-stat-value">{loading ? '...' : loisSigned}</p>
          <p className="echo-leasing-stat-change">in pipeline</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={displayData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar yAxisId="left" dataKey="units" fill="#1e40af" radius={[2, 2, 0, 0]} barSize={16} name="Units leased" />
          <Bar yAxisId="right" dataKey="area" fill="#93c5fd" radius={[2, 2, 0, 0]} barSize={16} name="Area ('000 sqft)" />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LeasingActivity;
