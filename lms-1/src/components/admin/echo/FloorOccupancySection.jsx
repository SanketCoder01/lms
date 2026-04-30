import React, { useMemo } from 'react';
import { formatRent, safeFloat } from '../../../utils/formatters';
import { useNavigate } from 'react-router-dom';

const FloorOccupancySection = ({ units = [], leases = [], loading }) => {
  const navigate = useNavigate();

  const floorData = useMemo(() => {
    if (!units || units.length === 0) return [];

    // Build actual rent map from active leases: unit_id -> monthly_rent
    const leaseRentMap = {};
    (leases || []).forEach(lease => {
      const s = (lease.status || '').toLowerCase().trim();
      const isActive = ['active', 'approved', 'executed', 'registered', 'occupied'].includes(s);
      if (isActive) {
        const uid = lease.unit_id || lease.unitId;
        const rent = parseFloat(lease.monthly_rent) || 0;
        if (uid && rent > 0) leaseRentMap[uid] = rent;
      }
    });

    // Group units by full floor name as key
    const floorMap = {};
    units.forEach(unit => {
      const floorName = (unit.floor_number || unit.floor || unit.floor_name || 'Ground Floor').trim();

      if (!floorMap[floorName]) {
        floorMap[floorName] = {
          name: floorName,
          totalArea: 0,
          leasedArea: 0,
          vacantArea: 0,
          actualRent: 0,
          leasedUnits: 0,
          vacantUnits: 0,
          totalUnits: 0,
        };
      }

      const area = parseFloat(unit.chargeable_area || 0);
      const status = (unit.status || '').toLowerCase();
      const isLeased = status === 'leased' || status === 'occupied' || status === 'sold';
      const actualRent = leaseRentMap[unit.id] || 0;

      floorMap[floorName].totalArea += area;
      floorMap[floorName].totalUnits += 1;

      if (isLeased) {
        floorMap[floorName].leasedArea += area;
        floorMap[floorName].leasedUnits += 1;
        floorMap[floorName].actualRent += actualRent;
      } else {
        floorMap[floorName].vacantArea += area;
        floorMap[floorName].vacantUnits += 1;
      }
    });

    return Object.values(floorMap).map(f => {
      const leasedPct = f.totalArea > 0
        ? parseFloat(((f.leasedArea / f.totalArea) * 100).toFixed(1))
        : 0;
      // Correct avg rent/sqft = actual lease rent / leased sqft
      const avgSf = f.leasedArea > 0 && f.actualRent > 0
        ? parseFloat((f.actualRent / f.leasedArea).toFixed(2))
        : 0;
      // Smart badge: first letter of each word, max 3 chars
      const badge = f.name
        .split(/\s+/)
        .map(w => w[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 3) || f.name.slice(0, 2).toUpperCase();

      return { ...f, leasedPct, avgSf, badge };
    }).sort((a, b) => {
      const groundWords = ['ground', 'gf', 'lower ground', 'ug', 'basement'];
      const aIsGround = groundWords.some(w => a.name.toLowerCase().includes(w));
      const bIsGround = groundWords.some(w => b.name.toLowerCase().includes(w));
      if (aIsGround && !bIsGround) return -1;
      if (!aIsGround && bIsGround) return 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
  }, [units, leases]);

  const formatArea = (area) => {
    if (!area) return '0 sqft';
    if (area >= 100000) return `${(area / 100000).toFixed(1)}L sqft`;
    return `${Number(area).toLocaleString('en-IN')} sqft`;
  };

  const totalUnits = floorData.reduce((s, f) => s + f.totalUnits, 0);
  const totalArea = floorData.reduce((s, f) => s + f.totalArea, 0);
  const totalLeased = floorData.reduce((s, f) => s + f.leasedUnits, 0);
  const totalLeasedArea = floorData.reduce((s, f) => s + f.leasedArea, 0);
  const overallOccupancy = totalArea > 0
    ? parseFloat(((totalLeasedArea / totalArea) * 100).toFixed(1))
    : 0;

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>
        Floor-wise occupancy &amp; rent
      </h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
        {totalUnits} units &middot; {formatArea(totalArea)} &middot; {overallOccupancy}% occupied
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : floorData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No floor data available</div>
      ) : (
        <>
          <style>{`
            .floor-scroll-container::-webkit-scrollbar { width: 6px; }
            .floor-scroll-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
            .floor-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
            .floor-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          `}</style>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '44px 1fr auto', gap: '12px',
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: '#64748b', marginBottom: '12px',
            paddingBottom: '4px', borderBottom: '1px solid #e2e8f0'
          }}>
            <span>FL.</span>
            <span>Occupancy by Area</span>
            <span>Avg /sqft</span>
          </div>

          {/* Scrollable floor rows */}
          <div
            className="floor-scroll-container"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '260px', overflowY: 'auto', paddingRight: '8px' }}
          >
            {floorData.map((f, i) => (
              <div
                key={i}
                onClick={() => navigate(`/admin/units?floor=${encodeURIComponent(f.name)}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* Badge */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '11px', fontWeight: 700, flexShrink: 0,
                    backgroundColor: '#e8a830'
                  }}>
                    {f.badge}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{f.name}</p>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                          {f.totalUnits} units &middot; {formatArea(f.totalArea)}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: f.avgSf > 0 ? '#c0392b' : '#94a3b8', margin: 0 }}>
                          {f.avgSf > 0 ? `\u20B9${f.avgSf}/sqft` : '\u2014'}
                        </p>
                        <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
                          {f.actualRent > 0 ? `${formatRent(safeFloat(f.actualRent))} PM` : 'No active lease'}
                        </p>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div style={{ display: 'flex', height: '10px', borderRadius: '9999px', overflow: 'hidden', marginTop: '8px', backgroundColor: '#e8a830' }}>
                      <div style={{ backgroundColor: '#1e3a5f', width: `${f.leasedPct}%`, transition: 'width 0.4s' }} />
                    </div>

                    {/* Leased / Vacant labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#1a5c2a' }}>
                        {f.leasedUnits} leased &middot; {formatArea(f.leasedArea)} ({f.leasedPct}%)
                      </span>
                      <span style={{ fontSize: '10px', color: '#e8a830' }}>
                        {f.vacantUnits} vacant &middot; {formatArea(f.vacantArea)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary row */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', color: '#0f172a', marginBottom: '12px' }}>
              Floor Summary
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(floorData.length, 5)}, 1fr)`, gap: '8px', textAlign: 'center' }}>
              {floorData.slice(0, 5).map((f, i) => (
                <div key={i}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: f.avgSf > 0 ? '#0f172a' : '#94a3b8', margin: 0 }}>
                    {f.avgSf > 0 ? `\u20B9${f.avgSf}` : '\u2014'}
                  </p>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 0' }}>{f.badge} avg/sqft</p>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', textAlign: 'center' }}>
              {totalLeased} of {totalUnits} units leased ({overallOccupancy}% occupancy)
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default FloorOccupancySection;
