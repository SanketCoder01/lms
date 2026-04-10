import { PieChart, Pie, Cell } from "recharts";
import { Info } from "lucide-react";
import { useNavigate } from 'react-router-dom';

const RentComposition = ({ fixed = 0, mg = 0, revenueShare = 0, fixedUnits = 0, mgUnits = 0, revShareUnits = 0, totalProjectRent = 0, opportunityLoss = 0, loading }) => {
  const navigate = useNavigate();
  // Actual rent is the total from leases (fixed + mg + revenueShare)
  const actualRent = fixed + mg + revenueShare;

  const formatLakhs = (val) => {
    if (!val) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const formatTotal = (val) => {
    if (!val) return '0';
    if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(1)} L`;
    return val.toLocaleString('en-IN');
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
      detail: `Rev-share leases (fixed floor)`,
      color: "hsl(145,63%,42%)"
    },
    {
      name: "Revenue share",
      value: revenueShare,
      amount: formatLakhs(revenueShare),
      units: revShareUnits,
      detail: `Variable · based on tenant sales`,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
        <h3 className="echo-card-title">Actual Rent</h3>
        <Info size={14} color="#64748b" />
      </div>
      <p className="echo-card-subtitle" style={{ marginBottom: '16px' }}>{loading ? '...' : formatLakhs(actualRent)}/month</p>

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
              <span className="echo-pie-label">/mo</span>
            </div>
          </div>
          <div className="echo-rent-legend">
            {data.map((d, i) => {
              // Calculate percentage based on actual rent, cap at 100 for bar width
              const percent = actualRent > 0 ? Math.round((d.value / actualRent) * 100) : 0;
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
            {/* Opportunity Loss - shown in small text */}
            {opportunityLoss > 0 && (
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '10px', color: '#64748b', margin: 0 }}>
                  Opportunity Loss: {formatLakhs(opportunityLoss)}/month from vacant units
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
