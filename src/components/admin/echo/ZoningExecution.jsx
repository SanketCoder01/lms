import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

// Color palette for dynamic zones
const zoneColors = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"
];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const leasePercent = data.planArea > 0 ? ((data.actualArea / data.planArea) * 100).toFixed(1) : 0;
    return (
      <div style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>{data.name}</p>
        <p style={{ color: '#64748b', margin: '0 0 4px', fontSize: '12px' }}>
          <strong style={{ color: '#0f172a' }}>Total:</strong> {data.planArea?.toLocaleString('en-IN') || 0} sqft ({data.plan || 0} units)
        </p>
        <p style={{ color: '#64748b', margin: 0, fontSize: '12px' }}>
          <strong style={{ color: '#0f172a' }}>Leased:</strong> {data.actualArea?.toLocaleString('en-IN') || 0} sqft ({data.actual || 0} units)
        </p>
        <p style={{ color: leasePercent > 50 ? '#10b981' : '#f59e0b', margin: '4px 0 0', fontSize: '11px', fontWeight: 600 }}>
          {leasePercent}% leased
        </p>
      </div>
    );
  }
  return null;
};

// Custom label inside pie slices
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, planArea, actualArea }) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if slice is big enough
  if (planArea < 5000) return null;

  // Truncate name if too long
  const displayName = name.length > 8 ? name.substring(0, 7) + '..' : name;

  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: '9px', fontWeight: 600, pointerEvents: 'none' }}
    >
      {displayName}
    </text>
  );
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
    <div className="echo-card" style={{ border: 'none' }}>
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

          {/* Pie Chart with dual rings for total vs leased */}
          <div style={{ height: '200px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* Outer ring - Total area (lighter shade) */}
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="planArea"
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {categories.map((entry, index) => (
                    <Cell
                      key={`cell-outer-${index}`}
                      fill={entry.color}
                      fillOpacity={0.35}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                {/* Inner ring - Leased area (solid) */}
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={55}
                  paddingAngle={2}
                  dataKey="actualArea"
                >
                  {categories.map((entry, index) => (
                    <Cell
                      key={`cell-inner-${index}`}
                      fill={entry.color}
                      fillOpacity={0.9}
                      style={{ cursor: 'pointer' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center label */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{overallPercent}%</div>
              <div style={{ fontSize: '9px', color: '#64748b' }}>Leased</div>
            </div>
          </div>

          {/* Legend key - explains the rings */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            marginTop: '8px',
            marginBottom: '12px',
            fontSize: '10px',
            color: '#64748b'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                width: '12px',
                height: '8px',
                borderRadius: '2px',
                background: 'rgba(59, 130, 246, 0.35)',
                display: 'inline-block'
              }} />
              Outer = Total
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{
                width: '12px',
                height: '8px',
                borderRadius: '2px',
                background: 'rgba(59, 130, 246, 0.9)',
                display: 'inline-block'
              }} />
              Inner = Leased
            </span>
          </div>

          {/* Zone Legend - Full details always visible */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: '8px',
            padding: '8px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px'
          }}>
            {categories.map((cat, index) => {
              const leasePercent = cat.planArea > 0 ? ((cat.actualArea / cat.planArea) * 100).toFixed(0) : 0;
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    backgroundColor: '#fff',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                >
                  <span style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: cat.color,
                    flexShrink: 0
                  }} />
                  <span style={{ flex: 1, color: '#0f172a', fontWeight: 500 }}>{cat.name}</span>
                  <span style={{ color: '#64748b', fontSize: '10px' }}>
                    Total: {cat.planArea >= 10000
                      ? `${(cat.planArea / 10000).toFixed(1)}K`
                      : cat.planArea.toLocaleString('en-IN')} sqft
                  </span>
                  <span style={{
                    color: cat.actualArea > 0 ? '#10b981' : '#94a3b8',
                    fontWeight: 600,
                    fontSize: '10px'
                  }}>
                    {cat.actualArea > 0
                      ? `Leased: ${cat.actualArea >= 10000
                        ? `${(cat.actualArea / 10000).toFixed(1)}K`
                        : cat.actualArea.toLocaleString('en-IN')} sqft`
                      : 'Not leased'}
                  </span>
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontSize: '9px',
                    fontWeight: 600,
                    backgroundColor: parseFloat(leasePercent) >= 50 ? '#dcfce7' : parseFloat(leasePercent) > 0 ? '#fef3c7' : '#f1f5f9',
                    color: parseFloat(leasePercent) >= 50 ? '#166534' : parseFloat(leasePercent) > 0 ? '#854d0e' : '#64748b'
                  }}>
                    {leasePercent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoningExecution;
