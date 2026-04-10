import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Info } from "lucide-react";
import { useNavigate } from 'react-router-dom';

// Color palette for dynamic zones
const zoneColors = [
  "#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e",
  "#14b8a6", "#0ea5e9", "#6366f1", "#a855f7", "#ec4899",
  "#f43f5e", "#78716c", "#3b82f6", "#8b5cf6", "#06b6d4"
];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload }) => {
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
        <p style={{ fontWeight: 600, color: '#0f172a', margin: '0 0 8px' }}>{data.name}</p>
        <p style={{ color: '#64748b', margin: '0 0 4px', fontSize: '12px' }}>
          <strong style={{ color: '#0f172a' }}>Plan:</strong> {data.planArea?.toLocaleString('en-IN') || 0} sqft ({data.plan || 0} units)
        </p>
        <p style={{ color: '#64748b', margin: 0, fontSize: '12px' }}>
          <strong style={{ color: '#0f172a' }}>Leased:</strong> {data.actualArea?.toLocaleString('en-IN') || 0} sqft ({data.actual || 0} units)
        </p>
      </div>
    );
  }
  return null;
};

const ZoningExecution = ({ zoningData, loading }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(null);

  // Only show zones that have data (plan > 0) - filter out unused zones
  const categories = useMemo(() => {
    if (!zoningData || zoningData.length === 0) return [];
    
    // Filter only zones with units assigned (plan > 0)
    return zoningData
      .filter(z => z.plan > 0 || z.units > 0)
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

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>Zoning Plan vs Actual Leasing</h3>
        <Info size={14} color="#64748b" />
      </div>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>Category allocation vs executed leases by units</p>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
      ) : categories.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          No unit categories assigned yet.<br/>
          <span style={{ fontSize: '11px' }}>Assign categories to units to see zoning data.</span>
        </div>
      ) : (
        <div style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/units')}>
          {/* Pie Chart */}
          <div style={{ height: '200px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {categories.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={activeIndex === index ? '#0f172a' : 'none'}
                      strokeWidth={activeIndex === index ? 2 : 0}
                      style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend - Only show zones that exist */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
            {categories.map((cat, i) => (
              <div 
                key={i} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px', 
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: activeIndex === i ? '#f1f5f9' : 'transparent'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: cat.color }} />
                <span style={{ color: '#64748b' }}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoningExecution;
