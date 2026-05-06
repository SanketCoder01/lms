import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const LeasingActivity = ({ chartData, newLeases, areaLeased, loading, loiCount = 0, executedCount = 0, registeredCount = 0 }) => {
  const displayAreaLeased = areaLeased || 0;




  const hasRealData = loiCount > 0 || executedCount > 0 || registeredCount > 0 ||
    (chartData && chartData.length > 0 && chartData.some(d =>
      (d.units > 0) || (d.loiUnits > 0) || (d.executedUnits > 0) || (d.registeredUnits > 0)
    ));

  // Build fallback chart from counts when chart data has no visible bars
  const hasVisibleBars = chartData && chartData.some(d =>
    (d.loiUnits > 0) || (d.executedUnits > 0) || (d.registeredUnits > 0)
  );

  let displayData = chartData || [];
  if (hasRealData && !hasVisibleBars && (loiCount + executedCount + registeredCount > 0)) {
    const now = new Date();
    const monthKey = now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    displayData = [{
      month: monthKey,
      units: loiCount + executedCount + registeredCount,
      area: 0,
      loiUnits: loiCount, loiArea: 0,
      executedUnits: executedCount, executedArea: 0,
      registeredUnits: registeredCount, registeredArea: 0
    }];
  }


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

            <Bar yAxisId="left" stackId="units" dataKey="registeredUnits" fill="#1e40af" name="Registered" />
            <Bar yAxisId="left" stackId="units" dataKey="executedUnits" fill="#fb923c" name="Executed" />
            <Bar yAxisId="left" stackId="units" dataKey="loiUnits" fill="#fbbf24" name="LOI" radius={[2, 2, 0, 0]} />

            <Bar yAxisId="right" stackId="area" dataKey="registeredArea" fill="#93c5fd" name="Reg. Area" />
            <Bar yAxisId="right" stackId="area" dataKey="executedArea" fill="#fed7aa" name="Exe. Area" />
            <Bar yAxisId="right" stackId="area" dataKey="loiArea" fill="#fde68a" name="LOI Area" radius={[2, 2, 0, 0]} />
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
