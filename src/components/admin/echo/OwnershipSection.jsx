import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const OwnershipSection = ({ units = [], loading }) => {
  const navigate = useNavigate();
  // Process units directly using useMemo for efficiency
  const ownershipData = useMemo(() => {
    // Define the 3 standard ownership categories
    const standardCategories = [
      { key: 'Developer Units', label: 'Unsold / developer retained', color: '#e8a830' },
      { key: 'Group Companies', label: 'Close group / group co.', color: '#2d8a4e' },
      { key: 'Other Investors', label: 'External investors', color: '#1e3a5f' },
    ];
    
    console.log('OwnershipSection: Processing units:', units?.length || 0, units);
    
    // Initialize all 3 categories with 0 values
    const grouped = {
      'Developer Units': { units: 0, totalArea: 0, totalRent: 0, parties: new Set() },
      'Group Companies': { units: 0, totalArea: 0, totalRent: 0, parties: new Set() },
      'Other Investors': { units: 0, totalArea: 0, totalRent: 0, parties: new Set() },
    };
    
    if (!units || units.length === 0) {
      return standardCategories.map(cat => ({
        key: cat.key,
        label: cat.label,
        color: cat.color,
        units: 0,
        totalArea: 0,
        totalRent: 0,
        parties: 0,
      }));
    }
    
    // Group units by ownership_grouping
    units.forEach(unit => {
      const group = unit.ownership_grouping || unit.ownershipGrouping || unit.ownership_group || unit.owner_type || unit.ownershipType || 'Developer Units';
      console.log(`OwnershipSection: Unit ${unit.unit_number}, ownership_grouping=${unit.ownership_grouping}, resolved group=${group}`);
      
      // Map to one of the 3 standard categories
      let category = 'Developer Units';
      if (group === 'Group Companies' || group === 'Group Company' || group === 'Close Group') {
        category = 'Group Companies';
      } else if (group === 'Other Investors' || group === 'External Investors' || group === 'Investor') {
        category = 'Other Investors';
      }
      
      grouped[category].units += 1;
      grouped[category].totalArea += parseFloat(unit.chargeable_area || unit.area || unit.chargeableArea || 0);
      grouped[category].totalRent += parseFloat(unit.projected_rent || unit.monthly_rent || unit.current_rent || 0);
      if (unit.owner_name || unit.ownerName || unit.owner) {
        grouped[category].parties.add(unit.owner_name || unit.ownerName || unit.owner);
      }
    });

    console.log('OwnershipSection: Grouped data:', grouped);

    // Return all 3 categories in standard order
    return standardCategories.map(cat => ({
      key: cat.key,
      label: cat.label,
      color: cat.color,
      units: grouped[cat.key].units,
      totalArea: grouped[cat.key].totalArea,
      totalRent: grouped[cat.key].totalRent,
      parties: grouped[cat.key].parties.size,
    }));
  }, [units]);

  const handleCategoryClick = (category) => {
    navigate(`/admin/units?ownership=${encodeURIComponent(category)}`);
  };

  // Calculate totals
  const totalUnits = ownershipData.reduce((sum, o) => sum + o.units, 0);

  // Calculate percentages
  const displayData = ownershipData.map(o => ({
    ...o,
    percentage: totalUnits > 0 ? Math.round((o.units / totalUnits) * 100) : 0,
    avgRent: o.totalArea > 0 ? Math.round(o.totalRent / o.totalArea) : 0,
  }));

  const formatArea = (area) => {
    if (area >= 100000) return `${(area / 100000).toFixed(1)}L sqft`;
    return `${area.toLocaleString('en-IN')} sqft`;
  };

  const formatRent = (rent) => {
    if (rent >= 10000000) return `${(rent / 10000000).toFixed(2)} Cr/mo`;
    if (rent >= 100000) return `${(rent / 100000).toFixed(1)}L/mo`;
    return `${rent.toLocaleString('en-IN')}/mo`;
  };

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Unit sales & ownership</h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>{totalUnits} total units · rental by ownership category</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : displayData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No ownership data available</div>
      ) : (
        <>
          <style>
            {`
              .ownership-scroll-container::-webkit-scrollbar {
                width: 6px;
              }
              .ownership-scroll-container::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
              }
              .ownership-scroll-container::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
              }
              .ownership-scroll-container::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}
          </style>
          {/* Stacked bar */}
          <div style={{ display: 'flex', height: '16px', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
            {displayData.map((o, i) => (
              <div key={i} style={{ backgroundColor: o.color, width: `${o.percentage}%` }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '10px', color: '#64748b', marginBottom: '24px' }}>
            {displayData.map((o, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', display: 'inline-block', backgroundColor: o.color }} />
                {o.label.split(' ')[0]} ({o.percentage}%)
              </span>
            ))}
          </div>

          {/* Breakdown - Scrollable */}
          <div 
            className="ownership-scroll-container"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px', 
              maxHeight: '200px', 
              overflowY: 'auto',
              paddingRight: '8px'
            }}
          >
            {displayData.map((o, i) => (
              <div 
                key={i} 
                onClick={() => handleCategoryClick(o.key)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span style={{ width: '12px', height: '12px', borderRadius: '2px', marginTop: '2px', flexShrink: 0, backgroundColor: o.color }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#0f172a', margin: 0 }}>{o.label}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{o.units} units · {formatArea(o.totalArea)}{o.parties > 0 ? ` · ${o.parties} parties` : ''}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{formatRent(o.totalRent)}</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{o.avgRent}/sqft avg</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OwnershipSection;
