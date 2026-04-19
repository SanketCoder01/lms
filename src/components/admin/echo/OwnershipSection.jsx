import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRent, safeFloat } from '../../../utils/formatters';

const OwnershipSection = ({ units = [], leases = [], loading }) => {
  const navigate = useNavigate();
  const ownershipData = useMemo(() => {
    // Define the 4 standard ownership categories requested
    const standardCategories = [
      { key: 'Unsold', label: 'Unsold', color: '#94a3b8' },
      { key: 'Developer Units', label: 'Developer Units', color: '#e8a830' },
      { key: 'Group Companies', label: 'Close Group', color: '#2d8a4e' },
      { key: 'Other Investors', label: 'External Investors', color: '#1e3a5f' },
    ];

    console.log('OwnershipSection: Processing units:', units?.length || 0, 'leases:', leases?.length || 0);

    // Initialize all 4 categories with 0 values
    const grouped = {
      'Unsold': { units: 0, totalArea: 0, totalRent: 0, parties: new Set() },
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

    // Build a map of unit_id to actual rent from active leases
    const leaseRentMap = {};
    (leases || []).forEach(lease => {
      const isActive = lease.status === 'active' || lease.status === 'Active' || lease.status === 'approved' || lease.status === 'leased';
      if (isActive) {
        const unitId = lease.unit_id || lease.unitId || lease.unit?.id;
        const rent = parseFloat(lease.monthly_rent) || 0;
        if (unitId && rent > 0) {
          leaseRentMap[unitId] = rent;
        }
      }
    });

    // Group units by ownership_type
    units.forEach(unit => {
      const ownershipType = (unit.ownership_type || unit.ownershipType || unit.owner_type || unit.ownership_grouping || '').toLowerCase().trim();
      const hasOwner = unit.owner_name || unit.ownerName || unit.owner_id || unit.ownerId;
      console.log(`OwnershipSection: Unit ${unit.unit_number}, ownership_type=${ownershipType}, hasOwner=${!!hasOwner}`);

      // Determine category based on exactly 4 rules
      let category;

      if (!hasOwner) {
        // 1. No owner assigned = Unsold
        category = 'Unsold';
      } else if (ownershipType.includes('developer')) {
        // 2. Developer unit to developer
        category = 'Developer Units';
      } else if (ownershipType.includes('group') || ownershipType.includes('close')) {
        // 3. Close group to close group
        category = 'Group Companies';
      } else if (ownershipType.includes('investor') || ownershipType.includes('external') || ownershipType.includes('outsider')) {
        // 4. External investors to external/outsider
        category = 'Other Investors';
      } else {
        // Default fallback if it has an owner but type is unknown
        const isSold = (unit.ownership_status || '').toLowerCase() === 'sold' || (unit.ownership_status || '').toLowerCase() === 'transferred';
        category = isSold ? 'Other Investors' : 'Developer Units';
      }

      grouped[category].units += 1;
      grouped[category].totalArea += parseFloat(unit.chargeable_area || unit.area || unit.chargeableArea || 0);

      // Use actual rent from lease if available, otherwise 0
      const unitId = unit.id || unit.unit_id || unit.unitId;
      const actualRent = leaseRentMap[unitId] || 0;
      grouped[category].totalRent += actualRent;

      if (hasOwner) {
        grouped[category].parties.add(unit.owner_name || unit.ownerName || unit.owner || 'Owner');
      }
    });

    console.log('OwnershipSection: Grouped data:', grouped);

    // Return all 4 categories in standard order
    return standardCategories.map(cat => ({
      key: cat.key,
      label: cat.label,
      color: cat.color,
      units: grouped[cat.key].units,
      totalArea: grouped[cat.key].totalArea,
      totalRent: grouped[cat.key].totalRent,
      parties: grouped[cat.key].parties.size,
    }));
  }, [units, leases]);

  const handleCategoryClick = (category) => {
    navigate(`/admin/units?ownership=${encodeURIComponent(category)}`);
  };

  // Calculate totals
  const totalUnits = ownershipData.reduce((sum, o) => sum + o.units, 0);

  // Calculate percentages
  const displayData = ownershipData.map(o => ({
    ...o,
    percentage: totalUnits > 0 ? parseFloat(((o.units / totalUnits) * 100).toFixed(1)) : 0,
    avgRent: o.totalArea > 0 ? parseFloat((o.totalRent / o.totalArea).toFixed(2)) : 0,
  }));

  const formatArea = (area) => {
    if (area >= 100000) return `${(area / 100000).toFixed(1)}L sqft`;
    return `${area.toLocaleString('en-IN')} sqft`;
  };

  // Use centralized formatRent from formatters.js

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
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{formatRent(safeFloat(o.totalRent))} PM</p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Rs {o.avgRent}/sqft avg</p>
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
