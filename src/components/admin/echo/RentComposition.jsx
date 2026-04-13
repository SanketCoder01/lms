import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { formatRent, safeFloat } from '../../../utils/formatters';
import { useNavigate } from 'react-router-dom';

const RentComposition = ({ fixed = 0, mg = 0, revenueShare = 0, fixedUnits = 0, mgUnits = 0, revShareUnits = 0, rateVariance = 0, loading }) => {
  const navigate = useNavigate();
  // Actual rent is the total from leases (fixed + mg + revenueShare)
  const actualRent = fixed + mg + revenueShare;

  // Use centralized formatRent from formatters.js (adds  prefix automatically)
  const formatLakhs = (val) => {
    if (!val) return '0';
    return formatRent(safeFloat(val));
  };

  const formatTotal = (val) => {
    if (!val) return '0';
    return formatRent(safeFloat(val));
  };

  // Data for pie chart segments - use actual rent values
  const data = [
    {
      name: "Fixed rent",
      value: fixed,
      amount: formatLakhs(fixed),
      units: fixedUnits,
      detail: `Traditional leases`,
      color: "hsl(210,80%,50%)"
    },
    {
      name: "MG rent",
      value: mg,
      amount: formatLakhs(mg),
      units: mgUnits,
      detail: `Rev-share leases - MG Rent`,
      color: "hsl(145,63%,42%)"
    },
    {
      name: "Revenue share",
      value: revenueShare,
      amount: formatLakhs(revenueShare),
      units: revShareUnits,
      detail: `Rev-share leases - Variable Rent`,
      color: "hsl(38,92%,50%)"
    },
  ];

  const handleRentTypeClick = (rentType) => {
    navigate(`/admin/leases?rent_model=${encodeURIComponent(rentType)}`);
  };

  // Filter out zero values for pie chart
  const chartData = data.filter(d => d.value > 0);

  return (
    <div className="echo-card" style={{ height: '100%', border: 'none' }}>
      <h3 className="echo-card-title" style={{ marginBottom: '2px' }}>Actual Rent</h3>
      <p className="echo-card-subtitle" style={{ marginBottom: '16px' }}>{loading ? '...' : formatLakhs(actualRent)} PM</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading...</div>
      ) : actualRent === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>No data available</div>
      ) : (
        <div className="echo-rent-content">
          <div className="echo-pie-wrapper">
            <PieChart width={150} height={150}>
              <Pie
                data={chartData.length > 0 ? chartData : [{ value: 1, color: '#e2e8f0' }]}
                cx={75} cy={75}
                innerRadius={45} outerRadius={70}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
            </PieChart>
            <div className="echo-pie-center">
              <span className="echo-pie-value">{formatTotal(actualRent)}</span>
              <span className="echo-pie-label">PM</span>
            </div>
          </div>
          <div className="echo-rent-legend">
            {data.map((d, i) => {
              // Calculate percentage based on actual rent, cap at 100 for bar width
              const percent = actualRent > 0 ? parseFloat(((d.value / actualRent) * 100).toFixed(1)) : 0;
              const barWidth = Math.min(percent, 100);
              return (
                <div
                  key={i}
                  className="echo-rent-item"
                  onClick={() => handleRentTypeClick(d.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="echo-rent-header">
                    <div className="echo-rent-name">
                      <span className="echo-rent-dot" style={{ backgroundColor: d.color }} />
                      <span className="echo-rent-label">{d.name}</span>
                    </div>
                    <span className="echo-rent-amount">{d.amount}</span>
                  </div>
                  <div className="echo-rent-bar" style={{ backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                    <div className="echo-rent-bar" style={{ backgroundColor: d.color, width: `${barWidth}%`, marginTop: 0, height: '100%' }} />
                  </div>
                  <p className="echo-rent-detail" style={{ marginTop: '4px' }}>{percent}% · {d.detail} · {d.units} units</p>
                </div>
              );
            })}
            {/* Rate Variance - Loss/profit from lower/higher rate */}
            {rateVariance !== 0 && (
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '10px', color: rateVariance > 0 ? '#10b981' : '#ef4444', margin: 0 }}>
                  {rateVariance > 0 ? 'Profit' : 'Loss'} from rate variance: {formatLakhs(Math.abs(rateVariance))} PM
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RentComposition;
