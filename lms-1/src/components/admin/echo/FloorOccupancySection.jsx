import React, { useMemo } from 'react';
import { formatRent, safeFloat } from '../../../utils/formatters';
import { useNavigate } from 'react-router-dom';

const FloorOccupancySection = ({ units = [], loading }) => {
  const navigate = useNavigate();
  // Process units directly using useMemo for efficiency
  const floorData = useMemo(() => {
    if (!units || units.length === 0) return [];
    
    console.log('FloorOccupancy: Processing units:', units.length, units);
    
    // Group units by floor - check multiple field variations
    const floorMap = {};
    units.forEach(unit => {
      // Check multiple possible floor field names
      const floor = unit.floor_number || unit.floor || unit.Floor?.name || unit.floor_name || unit.floor_code || 'GF';
      // Use full floor name as code if it's short, otherwise abbreviate
      const floorCode = floor.length <= 3 ? floor.toUpperCase() : floor.substring(0, 2).toUpperCase();
      console.log(`FloorOccupancy: Unit ${unit.unit_number}, floor field: floor_number=${unit.floor_number}, floor=${unit.floor}, floor_name=${unit.floor_name}, resolved floor=${floor}, code=${floorCode}`);
      
      if (!floorMap[floorCode]) {
        floorMap[floorCode] = {
          code: floorCode,
          name: floor,
          totalArea: 0,
          leasedArea: 0,
          vacantArea: 0,
          totalRent: 0,
          leasedUnits: 0,
          vacantUnits: 0,
          totalUnits: 0,
        };
      }
      
      const area = parseFloat(unit.chargeable_area || unit.area || unit.chargeableArea || 0);
      const rent = parseFloat(unit.projected_rent || unit.monthly_rent || unit.current_rent || 0);
      // Check multiple status variations and lease existence
      const status = (unit.status || '').toLowerCase();
      const isLeased = status === 'leased' || status === 'occupied' || status === 'sold' || 
                       unit.lease_id || unit.Lease || unit.leaseId || unit.current_lease_id;
      
      console.log(`FloorOccupancy: Unit ${unit.unit_number}, floor: ${floor}, status: ${unit.status}, isLeased: ${isLeased}`);
      
      floorMap[floorCode].totalArea += area;
      floorMap[floorCode].totalRent += rent;
      floorMap[floorCode].totalUnits += 1;
      
      if (isLeased) {
        floorMap[floorCode].leasedArea += area;
        floorMap[floorCode].leasedUnits += 1;
      } else {
        floorMap[floorCode].vacantArea += area;
        floorMap[floorCode].vacantUnits += 1;
      }
    });
    
    // Convert to array and calculate percentages
    return Object.values(floorMap).map(f => {
      const leasedPct = f.totalArea > 0 ? parseFloat(((f.leasedArea / f.totalArea) * 100).toFixed(1)) : 0;
      const avgSf = f.leasedArea > 0 ? parseFloat((f.totalRent / f.leasedArea).toFixed(2)) : (f.totalArea > 0 ? parseFloat((f.totalRent / f.totalArea).toFixed(2)) : 0);
      return {
        ...f,
        leasedPct,
        avgSf,
      };
    }).sort((a, b) => {
      // Sort floors in order: GF, FF, SF, TF, then others alphabetically
      const order = ['GF', 'FF', 'SF', 'TF'];
      const aIdx = order.indexOf(a.code);
      const bIdx = order.indexOf(b.code);
      if (aIdx === -1 && bIdx === -1) return a.code.localeCompare(b.code);
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    });
  }, [units]);

  const formatArea = (area) => {
    if (area >= 100000) return `${(area / 100000).toFixed(1)}L sqft`;
    return `${area.toLocaleString('en-IN')} sqft`;
  };

  // Use centralized formatRent from formatters.js

  // Calculate overall summary
  const totalUnits = floorData.reduce((sum, f) => sum + f.totalUnits, 0);
  const totalArea = floorData.reduce((sum, f) => sum + f.totalArea, 0);
  const totalLeased = floorData.reduce((sum, f) => sum + f.leasedUnits, 0);
  const overallOccupancy = totalArea > 0 ? parseFloat(((floorData.reduce((sum, f) => sum + f.leasedArea, 0) / totalArea) * 100).toFixed(1)) : 0;

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Floor-wise occupancy & rent</h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>{totalUnits} units · {formatArea(totalArea)} · {overallOccupancy}% occupied</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : floorData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>No floor data available</div>
      ) : (
        <>
          <style>
            {`
              .floor-scroll-container::-webkit-scrollbar {
                width: 6px;
              }
              .floor-scroll-container::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 3px;
              }
              .floor-scroll-container::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 3px;
              }
              .floor-scroll-container::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}
          </style>
          {/* Column headers */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '40px 1fr auto', 
            gap: '12px', 
            fontSize: '10px', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            color: '#64748b',
            marginBottom: '12px',
            paddingBottom: '4px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <span>FL.</span>
            <span>Occupancy by Area</span>
            <div style={{ display: 'flex', gap: '32px' }}>
              <span>Leased Vacant</span>
              <span>Avg /SF</span>
            </div>
          </div>

          {/* Floor rows - Scrollable */}
          <div 
            className="floor-scroll-container"
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              maxHeight: '250px', 
              overflowY: 'auto',
              paddingRight: '8px'
            }}
          >
            {floorData.map((f, i) => (
              <div 
                key={i}
                onClick={() => navigate(`/admin/units?floor=${encodeURIComponent(f.name)}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* Floor code badge */}
                  <div style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '6px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'white', 
                    fontSize: '12px', 
                    fontWeight: 700,
                    flexShrink: 0,
                    backgroundColor: '#e8a830' 
                  }}>
                    {f.code}
                  </div>

                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', margin: 0 }}>{f.name}</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{f.totalUnits} units · {formatArea(f.totalArea)}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', fontWeight: 700, color: '#c0392b', margin: 0 }}>{f.avgSf}/sf</p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{formatRent(safeFloat(f.totalRent))} PM</p>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div style={{ display: 'flex', height: '12px', borderRadius: '9999px', overflow: 'hidden', marginTop: '8px' }}>
                      <div style={{ backgroundColor: '#1e3a5f', width: `${f.leasedPct}%` }} />
                      <div style={{ backgroundColor: '#e8a830', flex: 1 }} />
                    </div>

                    {/* Leased / Vacant labels */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '10px', color: '#1a5c2a' }}>
                        {f.leasedUnits} leased · {formatArea(f.leasedArea)} ({f.leasedPct}%)
                      </span>
                      <span style={{ fontSize: '10px', color: '#e8a830' }}>
                        {f.vacantUnits} vacant · {formatArea(f.vacantArea)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Floor Summary */}
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <h4 style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', color: '#0f172a', marginBottom: '12px' }}>Floor Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${floorData.length || 4}, 1fr)`, gap: '12px', textAlign: 'center' }}>
              {floorData.map((f, i) => (
                <div key={i}>
                  <p style={{ fontSize: '18px', fontWeight: 700, color: f.avgSf < 150 ? '#c0392b' : '#0f172a', margin: 0 }}>{f.avgSf}</p>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '4px 0 0' }}>{f.code} avg/sf</p>
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
