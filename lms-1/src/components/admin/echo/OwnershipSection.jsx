import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRent, safeFloat } from '../../../utils/formatters';

const OwnershipSection = ({ units = [], leases = [], loading }) => {
  const navigate = useNavigate();

  const ownershipData = useMemo(() => {
    // 5 ownership categories — 'Other Assigned' catches units with active owners
    // whose party's owner_group doesn't match any of the 3 main keywords
    const allCategories = [
      { key: 'Developer Units', label: 'Developer Units', color: '#e8a830' },
      { key: 'Close Group', label: 'Close Group', color: '#2d8a4e' },
      { key: 'External Investors', label: 'External Investors', color: '#1e3a5f' },
      { key: 'Other Assigned', label: 'Other Assigned', color: '#7c3aed' },
      { key: 'Unsold', label: 'Unsold', color: '#94a3b8' },
    ];

    const grouped = {
      'Developer Units': { units: 0, totalArea: 0, totalRent: 0, parties: new Set() },
      'Close Group': { units: 0, totalArea: 0, totalRent: 0, parties: new Set() },
      'External Investors': { units: 0, totalArea: 0, totalRent: 0, parties: new Set() },
      'Other Assigned': { units: 0, totalArea: 0, totalRent: 0, parties: new Set() },
      'Unsold': { units: 0, totalArea: 0, totalRent: 0, parties: new Set() },
    };

    console.log('[OwnershipSection] units:', units?.length, 'leases:', leases?.length);

    if (!units || units.length === 0) {
      return allCategories.map(cat => ({
        key: cat.key, label: cat.label, color: cat.color,
        units: 0, totalArea: 0, totalRent: 0, parties: 0,
      }));
    }

    // Lease rent map for active leases
    const leaseRentMap = {};
    (leases || []).forEach(lease => {
      const s = (lease.status || '').toLowerCase().trim();
      const isActive = ['active', 'approved', 'executed', 'registered', 'occupied'].includes(s);
      if (isActive) {
        const unitId = lease.unit_id || lease.unitId || lease.unit?.id;
        const rent = parseFloat(lease.monthly_rent) || 0;
        if (unitId && rent > 0) leaseRentMap[unitId] = rent;
      }
    });

    // Distribute each unit into its ownership bucket
    units.forEach(unit => {
      // Skip units whose status is explicitly 'sold' (case-insensitive)
      // NOTE: In this app 'sold' means the ownership has already been fully finalized.
      if ((unit.status || '').toLowerCase() === 'sold') {
        console.log(`[OwnershipSection] SKIP sold unit ${unit.id} (${unit.unit_number})`);
        return;
      }

      // Backend returns ownership_grouping:
      // 'Developer Units' | 'Close Group' | 'External Investors' | 'Other Assigned' | 'Unsold'
      const grouping = unit.ownership_grouping || 'Unsold';
      // Any grouping not in the map falls back to 'Other Assigned' (never lost to Unsold)
      const bucket = grouped[grouping] ?? grouped['Other Assigned'];

      console.log(`[OwnershipSection] unit ${unit.id} (${unit.unit_number}): owner="${unit.owner_name}" grouping="${grouping}"`);

      bucket.units += 1;
      bucket.totalArea += parseFloat(unit.chargeable_area || 0);
      bucket.totalRent += leaseRentMap[unit.id] || 0;
      if (unit.owner_name && unit.owner_name !== 'N/A') {
        bucket.parties.add(unit.owner_name);
      }
    });

    return allCategories.map(cat => ({
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

  const totalUnits = ownershipData.reduce((sum, o) => sum + o.units, 0);

  const displayData = ownershipData.map(o => ({
    ...o,
    percentage: totalUnits > 0 ? parseFloat(((o.units / totalUnits) * 100).toFixed(1)) : 0,
    avgRent: o.totalArea > 0 ? parseFloat((o.totalRent / o.totalArea).toFixed(2)) : 0,
  }));

  // Hide 'Other Assigned' row when it has 0 units — no clutter when everyone has proper owner_group set
  const visibleData = displayData.filter(o => o.key !== 'Other Assigned' || o.units > 0);

  const formatArea = (area) => {
    if (area >= 100000) return `${(area / 100000).toFixed(1)}L sqft`;
    return `${area.toLocaleString('en-IN')} sqft`;
  };

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
        Unit Sales & Ownership
      </h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
        {totalUnits} total units · by ownership category
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : (
        <>
          <style>{`
            .ownership-scroll-container::-webkit-scrollbar { width: 6px; }
            .ownership-scroll-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
            .ownership-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
            .ownership-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          `}</style>

          {/* Stacked bar — uses all 5 categories including Other Assigned */}
          <div style={{ display: 'flex', height: '16px', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
            {displayData.map((o, i) => (
              <div key={i} style={{ backgroundColor: o.color, width: `${o.percentage || (i === displayData.length - 1 ? 100 : 0)}%`, minWidth: o.units > 0 ? '4px' : 0 }} />
            ))}
          </div>

          {/* Legend — only show categories that have units or are one of the 3 main groups */}
          <div style={{ display: 'flex', gap: '12px', fontSize: '10px', color: '#64748b', marginBottom: '20px', flexWrap: 'wrap' }}>
            {visibleData.map((o, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', display: 'inline-block', backgroundColor: o.color }} />
                {o.label} ({o.percentage}%)
              </span>
            ))}
          </div>

          {/* Breakdown rows — always show main 3 + Unsold; Other Assigned only when non-zero */}
          <div
            className="ownership-scroll-container"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '260px', overflowY: 'auto', paddingRight: '8px' }}
          >
            {visibleData.map((o, i) => (
              <div
                key={i}
                onClick={() => handleCategoryClick(o.key)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  cursor: 'pointer', padding: '6px 4px', borderRadius: '6px',
                  transition: 'background-color 0.15s',
                  borderLeft: `3px solid ${o.color}`,
                  paddingLeft: '10px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                    {o.label}
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>
                    <strong style={{ color: '#0f172a' }}>{o.units}</strong> unit{o.units !== 1 ? 's' : ''}
                    {o.totalArea > 0 ? ` · ${formatArea(o.totalArea)}` : ''}
                    {o.parties > 0 ? ` · ${o.parties} ${o.parties === 1 ? 'owner' : 'owners'}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>
                    {o.totalRent > 0 ? `${formatRent(safeFloat(o.totalRent))} PM` : '—'}
                  </p>
                  {o.avgRent > 0 && (
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>₹{o.avgRent}/sqft</p>
                  )}
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
