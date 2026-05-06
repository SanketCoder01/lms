import React, { useMemo } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

// Color palette for dynamic zones
const zoneColors = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"
];

// Custom Tooltip Component for Bar Chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>{label || data.name}</p>
        <p style={{ color: '#3b82f6', margin: '0 0 4px', fontSize: '12px' }}>
          <strong>Planned Area:</strong> {(data.totalArea - data.leasedArea).toLocaleString('en-IN')} sqft ({data.planned.toFixed(1)}%)
        </p>
        <p style={{ color: '#f97316', margin: 0, fontSize: '12px' }}>
          <strong>Leased Area:</strong> {data.leasedArea.toLocaleString('en-IN')} sqft ({data.leased.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

const ZoningExecution = ({ zoningData, loading }) => {
  const navigate = useNavigate();

  // Only show zones that have data (plan > 0) - filter out unused zones
  const categories = useMemo(() => {
    if (!zoningData || zoningData.length === 0) return [];

    // Filter only zones with units assigned (plan > 0) and actual area > 0
    return zoningData
      .filter(z => (z.plan > 0 || z.units > 0) && (z.planArea > 0 || z.area > 0))
      .map((z, index) => ({
        name: z.name,
        color: zoneColors[index % zoneColors.length],
        plan: z.plan || z.units || 0,
        actual: z.actual || z.leasedUnits || 0,
        planArea: z.planArea || z.area || 0,
        actualArea: z.actualArea || z.leasedArea || 0,
        value: z.plan || z.units || 1
      }));
  }, [zoningData]);

  // Calculate totals
  const totalPlanArea = categories.reduce((sum, c) => sum + c.planArea, 0);
  const totalActualArea = categories.reduce((sum, c) => sum + c.actualArea, 0);
  const overallPercent = totalPlanArea > 0 ? ((totalActualArea / totalPlanArea) * 100).toFixed(1) : 0;

  return (
    <div className="echo-card" style={{ border: 'none', overflow: 'hidden' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0, marginBottom: '12px' }}>
        Zoning Plan vs Actual Leasing
      </h3>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
      ) : categories.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>No zoning data available</div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            Only units with official zoning types are displayed.<br />
            Assign zoning types from the dropdown in Project &gt; Units.
          </div>
        </div>
      ) : (
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/units')}>
          {/* Summary Stats - Always visible */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '12px',
            padding: '8px 12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Total Area</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                {totalPlanArea >= 100000
                  ? `${(totalPlanArea / 100000).toFixed(1)}L`
                  : totalPlanArea.toLocaleString('en-IN')} sqft
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Leased Area</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#10b981' }}>
                {totalActualArea >= 100000
                  ? `${(totalActualArea / 100000).toFixed(1)}L`
                  : totalActualArea.toLocaleString('en-IN')} sqft
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Occupancy</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: overallPercent >= 50 ? '#10b981' : '#f59e0b'
              }}>
                {overallPercent}%
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          {categories.length > 3 && (
            <div style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'right', paddingRight: '4px', marginBottom: '4px' }}>
              ← scroll to see all →
            </div>
          )}

          {/* Stacked Bar Chart — horizontally scrollable */}
          <div
            style={{
              display: 'block',
              overflowX: 'auto',
              overflowY: 'hidden',
              marginTop: '4px',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: '8px',
              cursor: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                height: '220px',
                minWidth: `${Math.max(categories.length * 120, 400)}px`,
                width: `${Math.max(categories.length * 120, 400)}px`,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categories.map(c => {
                      const leasedPct = c.planArea > 0 ? (c.actualArea / c.planArea) * 100 : 0;
                      return {
                        name: c.name,
                        leased: parseFloat(leasedPct.toFixed(1)),
                        planned: parseFloat((100 - leasedPct).toFixed(1)),
                        totalArea: c.planArea,
                        leasedArea: c.actualArea
                      };
                    })}
                    margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    interval={0}
                    height={35}
                    tick={({ x, y, payload }) => (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={0} dy={14} textAnchor="middle" fill="#64748b" fontSize={11}>
                          {payload.value.length > 16 ? payload.value.slice(0, 15) + '\u2026' : payload.value}
                        </text>
                      </g>
                    )}
                  />
                  <YAxis
                    tickFormatter={(tick) => `${tick}%`}
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '2px' }} />
                  <Bar dataKey="leased" name="Leased Area" stackId="a" fill="#f97316" maxBarSize={32} />
                  <Bar dataKey="planned" name="Planned Area" stackId="a" fill="#3b82f6" maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoningExecution;
