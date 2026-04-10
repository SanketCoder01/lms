import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";

const RentalProjectionChart = ({ data = [], loading }) => {
  // Default static data
  const defaultData = [
    { name: "Fixed lock-in", value: 65 },
    { name: "Fixed post", value: 38 },
    { name: "MG lock-in", value: 22 },
    { name: "MG post", value: 12 },
    { name: "RevSh lock-in", value: 8 },
    { name: "RevSh post", value: 6 },
  ];

  const colors = ["#1e3a5f", "#4a8ab5", "#1a8a5a", "#3cc48a", "#b8860b", "#e8a830"];

  const legendItems = [
    { label: "Fixed - lock-in", color: "#1e3a5f" },
    { label: "Fixed - post", color: "#4a8ab5" },
    { label: "MG - lock-in", color: "#1a8a5a" },
    { label: "MG - post", color: "#3cc48a" },
    { label: "Rev. share - lock-in", color: "#b8860b" },
    { label: "Rev. share - post", color: "#e8a830" },
  ];

  const chartData = data.length > 0 ? data : defaultData;

  // Custom bar shape for different colors
  const CustomBar = (props) => {
    const { x, y, width, height, index } = props;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        ry={4}
        fill={colors[index % colors.length]}
      />
    );
  };

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0f172a', marginBottom: '16px' }}>
        By Financial Value (Monthly)
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
      ) : (
        <>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}L`}
                />
                <Tooltip formatter={(value) => [`${value}L`, "Value"]} />
                <Bar
                  dataKey="value"
                  radius={[4, 4, 0, 0]}
                  fill="#1e3a5f"
                  barSize={40}
                  shape={<CustomBar />}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '12px', justifyContent: 'center' }}>
            {legendItems.map((item, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#64748b' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '2px', display: 'inline-block', backgroundColor: item.color }} />
                {item.label}
              </span>
            ))}
          </div>

          {/* Summary */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Committed (fixed+MG)</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '4px 0' }}>1.46 Cr</p>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>90% of actual rent</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Variable (rev. share)</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#16a34a', margin: '4px 0' }}>16.3L</p>
              <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>10% of actual rent</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RentalProjectionChart;
