import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const LeasingActivity = ({ chartData, newLeases, areaLeased, loading, loiCount = 0, executedCount = 0, registeredCount = 0 }) => {
  const displayAreaLeased = areaLeased || 0;

  // Colors matching the requirement
  const COLORS = {
    registered: '#2563eb', // Blue
    executed: '#f97316', // Orange
    loi: '#eab308', // Yellow
  };

  // Custom Tooltip Component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>{label}</p>
          {payload.map((entry) => (
            <div key={entry.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: 10, height: 10, backgroundColor: entry.fill, borderRadius: 2 }} />
              <span style={{ color: '#475569', fontSize: 13 }}>
                {entry.name}: <strong>{entry.value}</strong>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Has real data if any month has at least one non-zero count
  const hasRealData = chartData && chartData.length > 0 &&
    chartData.some(d => (d.loi || 0) + (d.executed || 0) + (d.registered || 0) > 0);

  const displayData = hasRealData ? chartData : [];

  // Date range from first → last month in data
  const getDateRange = () => {
    if (!hasRealData || displayData.length === 0) return '';
    const first = displayData[0].month;
    const last = displayData[displayData.length - 1].month;
    return first === last ? first : `${first} – ${last}`;
  };

  return (
    <div className="echo-card" style={{ border: 'none', height: '100%' }}>
      <h3 className="echo-card-title">Leasing Activity</h3>
      <p className="echo-card-subtitle">
        {hasRealData ? getDateRange() : 'No leasing activity yet'} · {displayAreaLeased.toLocaleString('en-IN')} sqft leased
      </p>

      {/* LOI, Executed, Registered stats — above the graph */}
      <div className="echo-leasing-stats">
        <div className="echo-leasing-stat">
          <p className="echo-leasing-stat-label">LOI</p>
          <p className="echo-leasing-stat-value" style={{ color: COLORS.loi }}>{loading ? '...' : loiCount}</p>
        </div>
        <div className="echo-leasing-stat">
          <p className="echo-leasing-stat-label">Leasing Executed</p>
          <p className="echo-leasing-stat-value" style={{ color: COLORS.executed }}>{loading ? '...' : executedCount}</p>
        </div>
        <div className="echo-leasing-stat">
          <p className="echo-leasing-stat-label">Leased Registered</p>
          <p className="echo-leasing-stat-value" style={{ color: COLORS.registered }}>{loading ? '...' : registeredCount}</p>
        </div>
      </div>

      {hasRealData && (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={displayData} barGap={2} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
            {/* Registered = Blue */}
            <Bar dataKey="registered" name="Registered" fill={COLORS.registered} radius={[2, 2, 0, 0]} barSize={12} />
            {/* Executed = Orange */}
            <Bar dataKey="executed" name="Executed" fill={COLORS.executed} radius={[2, 2, 0, 0]} barSize={12} />
            {/* LOI = Yellow */}
            <Bar dataKey="loi" name="LOI" fill={COLORS.loi} radius={[2, 2, 0, 0]} barSize={12} />
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
