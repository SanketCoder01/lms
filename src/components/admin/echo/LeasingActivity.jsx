import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const LeasingActivity = ({ chartData, newLeases, areaLeased, loisSigned, loading }) => {
  // Format area
  const formatArea = (area) => {
    if (!area || area === 0) return '0';
    if (area >= 100000) {
      return (area / 100000).toFixed(2) + 'L';
    }
    return area.toLocaleString('en-IN');
  };

  // Default chart data if empty
  const displayData = chartData && chartData.length > 0 ? chartData : [
    { month: "Oct", units: 0, area: 0 },
    { month: "Nov", units: 0, area: 0 },
    { month: "Dec", units: 0, area: 0 },
    { month: "Jan", units: 0, area: 0 },
    { month: "Feb", units: 0, area: 0 },
    { month: "Mar", units: 0, area: 0 },
  ];

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
          <p className="echo-leasing-stat-value">{loading ? '...' : formatArea(areaLeased)}</p>
          <p className="echo-leasing-stat-change">sqft</p>
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
          <Tooltip />
          <Bar yAxisId="left" dataKey="units" fill="#1e40af" radius={[2, 2, 0, 0]} barSize={16} name="Units leased" />
          <Bar yAxisId="right" dataKey="area" fill="#93c5fd" radius={[2, 2, 0, 0]} barSize={16} name="Area ('000 sqft)" />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LeasingActivity;
