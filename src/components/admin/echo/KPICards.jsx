import React from 'react';

const KPICards = ({ 
  totalUnits, 
  totalArea, 
  leasedUnits, 
  leasedArea, 
  leasedPercent,
  vacantUnits, 
  vacantArea, 
  vacantPercent,
  monthlyRent,
  opportunityLoss,
  unitBreakdown,
  loading,
  projectedRent,
  actualRent,
  onTotalUnitsClick,
  onLeasedUnitsClick,
  onVacantUnitsClick,
  onProjectedRentClick,
  onActualRentClick
}) => {
  // Format numbers
  const formatNumber = (num) => {
    if (!num) return 0;
    return num.toLocaleString('en-IN');
  };

  const formatArea = (area) => {
    if (!area) return '0';
    if (area >= 100000) {
      return (area / 100000).toFixed(2) + 'L';
    }
    return formatNumber(area);
  };

  const formatActualRent = (rent) => {
    if (!rent || rent === 0) return '0';
    if (rent >= 10000000) {
      return (rent / 10000000).toFixed(2) + ' Cr';
    }
    if (rent >= 100000) {
      return (rent / 100000).toFixed(1) + 'L';
    }
    return formatNumber(rent);
  };

  const formatProjectedRent = (rent) => {
    if (!rent || rent === 0) return '0';
    if (rent >= 10000000) {
      return (rent / 10000000).toFixed(2) + ' Cr';
    }
    if (rent >= 100000) {
      return (rent / 100000).toFixed(1) + 'L';
    }
    return formatNumber(rent);
  };

  const kpis = [
    {
      label: "TOTAL UNITS",
      value: loading ? '...' : formatNumber(totalUnits),
      sub: `${formatArea(totalArea)} sqft total area`,
      badges: unitBreakdown && unitBreakdown.length > 0 
        ? unitBreakdown.map(b => ({ label: `${b.name}: ${b.count}`, color: "#1e3a5f" }))
        : [{ label: "No units", color: "#64748b" }],
      progress: null,
      valueColor: "#1e293b",
      onClick: onTotalUnitsClick,
    },
    {
      label: "LEASED UNITS",
      value: loading ? '...' : formatNumber(leasedUnits),
      sub: `${formatArea(leasedArea)} sqft leased`,
      badges: null,
      progress: { value: parseFloat(leasedPercent) || 0, label: `${leasedPercent}% of total area`, color: "#0ea5e9" },
      valueColor: "#0ea5e9",
      onClick: onLeasedUnitsClick,
    },
    {
      label: "VACANT UNITS",
      value: loading ? '...' : formatNumber(vacantUnits),
      sub: `${formatArea(vacantArea)} sqft vacant`,
      badges: null,
      progress: { value: parseFloat(vacantPercent) || 0, label: `${vacantPercent}% of total area`, color: "#f59e0b" },
      valueColor: "#f97316",
      onClick: onVacantUnitsClick,
    },
    {
      label: "TOTAL PROJECTED RENT",
      value: loading ? '...' : formatProjectedRent(projectedRent),
      valueSuffix: "/mo",
      sub: "Projected rent from all units",
      badges: null,
      progress: null,
      valueColor: "#1e293b",
      onClick: onProjectedRentClick,
    },
    {
      label: "ACTUAL RENT",
      value: loading ? '...' : formatActualRent(actualRent || projectedRent),
      valueSuffix: "/mo",
      sub: opportunityLoss > 0 ? `Loss: ${formatActualRent(opportunityLoss)}/mo from vacancy` : "From active leases",
      badges: null,
      progress: null,
      valueColor: "#0ea5e9",
      onClick: onActualRentClick,
    },
  ];

  return (
    <div className="echo-kpi-grid">
      {kpis.map((kpi, i) => (
        <div 
          key={i} 
          className="echo-kpi-card"
          onClick={kpi.onClick}
          style={{ cursor: kpi.onClick ? 'pointer' : 'default' }}
        >
          <p className="echo-kpi-label">{kpi.label}</p>
          <p className="echo-kpi-value" style={{ color: kpi.valueColor }}>
            {kpi.value}
            {kpi.valueSuffix && <span className="echo-kpi-suffix">{kpi.valueSuffix}</span>}
          </p>
          <p className="echo-kpi-sub">{kpi.sub}</p>

          {kpi.badges && (
            <div className="echo-kpi-badges">
              {kpi.badges.map((b, j) => (
                <span key={j} className="echo-kpi-badge" style={{ backgroundColor: b.color }}>{b.label}</span>
              ))}
            </div>
          )}

          {kpi.progress && (
            <div className="echo-kpi-progress-wrapper">
              <span className="echo-kpi-progress-label">{kpi.progress.label}</span>
              <div className="echo-kpi-progress-bar">
                <div className="echo-kpi-progress-fill" style={{ width: `${Math.min(kpi.progress.value, 100)}%`, backgroundColor: kpi.progress.color }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KPICards;
