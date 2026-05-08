import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatRent, safeFloat } from '../../../utils/formatters';

const BrandPerformanceSection = ({ leases = [], parties = [], partiesMap = {}, loading }) => {
  const navigate = useNavigate();

  const brandData = useMemo(() => {
    const activeStatuses = ['active', 'approved', 'executed', 'registered', 'occupied'];

    // ── Step 1: Build from ACTIVE LEASES (source of truth for real-time data) ──
    // Group by party_tenant_id — keep newest active lease per party
    const partyLeaseMap = {};
    leases
      .filter(l => activeStatuses.includes((l.status || '').toLowerCase().trim()) && l.party_tenant_id)
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .forEach(lease => {
        const tid = String(lease.party_tenant_id);
        if (!partyLeaseMap[tid]) partyLeaseMap[tid] = lease;
      });

    // ── Step 2: Resolve party info — try partiesMap first (all parties), fall back to parties list ──
    const resolveParty = (partyId) => {
      const id = String(partyId);
      // partiesMap has ALL parties regardless of type
      return partiesMap[id] || partiesMap[parseInt(id)] || parties.find(p => String(p.id) === id) || null;
    };

    // ── Step 3: Build rows for brands WITH leases ──
    const leaseRows = Object.entries(partyLeaseMap).map(([partyId, lease]) => {
      const party = resolveParty(partyId);
      // Brand name: prefer brand_name → company_name → fallback
      const brandName = party?.brand_name?.trim() || party?.company_name?.trim() || `Party #${partyId}`;
      const category = party?.brand_category || '';

      const model = (lease.rent_model || 'Fixed').trim();
      const isFixed = model === 'Fixed' || model === '';

      // Target = MG amount for RS/Hybrid, monthly_rent for Fixed
      const targetSales = isFixed
        ? (parseFloat(lease.monthly_rent) || 0)
        : (parseFloat(lease.mg_amount) || parseFloat(lease.monthly_rent) || 0);

      // Actual = monthly_rent for Fixed (guaranteed), monthly_net_sales for RS/Hybrid
      const actualSales = isFixed
        ? targetSales
        : (parseFloat(lease.monthly_net_sales) || 0);

      const pct = targetSales > 0 ? parseFloat(((actualSales / targetSales) * 100).toFixed(1)) : 0;

      const barWidth = Math.min(pct, 100) + '%';
      let barColor = '#c0392b';
      if (pct >= 100) barColor = '#1a5c2a';
      else if (pct >= 80) barColor = '#1e3a5f';

      const now = new Date();
      const leaseStartDate = lease.lease_start ? new Date(lease.lease_start) : null;
      const isNew = leaseStartDate && (now - leaseStartDate) < 90 * 24 * 60 * 60 * 1000;

      return {
        id: partyId,
        name: brandName,
        category,
        model,
        target: targetSales > 0 ? (formatRent(safeFloat(targetSales)) + ' PM') : '—',
        actual: isFixed
          ? (actualSales > 0 ? formatRent(safeFloat(actualSales)) + ' (Fixed)' : '₹0')
          : (actualSales > 0 ? formatRent(safeFloat(actualSales)) : '₹0'),
        pct,
        barColor,
        barWidth,
        isNew,
        hasLease: true,
      };
    });

    // ── Step 4: Also show Masters brands WITHOUT leases (for visibility) ──
    const leasedPartyIds = new Set(Object.keys(partyLeaseMap));
    const noLeaseRows = parties
      .filter(p => {
        const hasBrand = !!(p.brand_name?.trim());
        const alreadyShown = leasedPartyIds.has(String(p.id));
        return hasBrand && !alreadyShown;
      })
      .map(p => ({
        id: String(p.id),
        name: p.brand_name.trim(),
        category: p.brand_category || '',
        target: '—',
        actual: '—',
        pct: 0,
        barColor: '#e2e8f0',
        barWidth: '0%',
        isNew: false,
        hasLease: false,
      }));

    // ── Step 5: Sort — with-lease first (by pct desc), then no-lease ──
    return [
      ...leaseRows.sort((a, b) => b.pct - a.pct),
      ...noLeaseRows,
    ];
  }, [leases, parties, partiesMap]);

  const handleBrandClick = (brandName) => {
    navigate(`/admin/leases?brand=${encodeURIComponent(brandName)}`);
  };

  const underperformingBrands = brandData.filter(b => b.hasLease && b.pct < 80).slice(0, 2);

  return (
    <div className="echo-card" style={{ border: 'none' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '2px' }}>Brand Sales Performance</h3>
      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>Active leases · Actual sales vs MG/target</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading...</div>
      ) : brandData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
          No active leases found. Create a lease to see brand performance here.
        </div>
      ) : (
        <>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 80px 50px',
            gap: '8px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#64748b',
            marginBottom: '12px',
            paddingBottom: '4px',
            borderBottom: '1px solid #e2e8f0'
          }}>
            <span>Brand</span>
            <span>Actual vs Target</span>
            <span style={{ textAlign: 'right' }}>Actual Sales</span>
            <span style={{ textAlign: 'right' }}>%</span>
          </div>

          {/* Scrollable rows */}
          <style>{`
            .brand-scroll-container::-webkit-scrollbar { width: 6px; }
            .brand-scroll-container::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 3px; }
            .brand-scroll-container::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
            .brand-scroll-container::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
          `}</style>
          <div className="brand-scroll-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '300px', overflowY: 'auto', paddingRight: '8px' }}>
            {brandData.map((b, i) => (
              <div
                key={b.id || i}
                onClick={() => handleBrandClick(b.name)}
                style={{ display: 'grid', gridTemplateColumns: '110px 1fr 80px 50px', gap: '8px', alignItems: 'center', cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'background-color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>{b.name}</span>
                  {b.isNew && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1d4ed8', fontWeight: 500 }}>New</span>}
                  {!b.hasLease && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: '#94a3b8', fontWeight: 500 }}>No lease</span>}
                </div>
                <div>
                  <div style={{ position: 'relative', height: '10px', backgroundColor: '#f3f4f6', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', borderRadius: '9999px', backgroundColor: b.barColor, width: b.barWidth }} />
                  </div>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '2px 0 0' }}>
                    {b.hasLease ? `Target: ${b.target}` : 'No lease data yet'}
                  </p>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', textAlign: 'right' }}>
                  {b.hasLease ? b.actual : '—'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, textAlign: 'right', color: b.pct >= 100 ? '#1a5c2a' : b.pct >= 80 ? '#0f172a' : b.hasLease ? '#c0392b' : '#94a3b8' }}>
                  {b.hasLease ? `${b.pct}%` : '—'}
                </span>
              </div>
            ))}
          </div>

          {underperformingBrands.length > 0 && (
            <div style={{ marginTop: '20px', backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px', padding: '12px' }}>
              <p style={{ fontSize: '12px', color: '#854d0e', margin: 0 }}>
                {underperformingBrands.map(b => b.name).join(' & ')} {underperformingBrands.length === 1 ? 'is' : 'are'} significantly underperforming.
              </p>
            </div>
          )}

          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            <a href="/admin/leases" style={{ fontSize: '14px', color: '#64748b', textDecoration: 'none' }}>Full brand analysis</a>
          </div>
        </>
      )}
    </div>
  );
};

export default BrandPerformanceSection;
