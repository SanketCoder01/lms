import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatRent, safeFloat } from '../../../utils/formatters';

/*
 ─────────────────────────────────────────────────────────────────
  BY FINANCIAL VALUE (MONTHLY) — 5-line chart
 ─────────────────────────────────────────────────────────────────
  GROUP 1 – RENT LINES (Y = INR/month):
    1. MG / Fixed Rent (blue solid)      — lease_start → lease_end
    2. Revenue Share   (orange dashed)   — lease_start → lease_end  (0 for Fixed)
    3. Total Rent      (green solid, top)— lease_start → lease_end

  GROUP 2 – TIMELINE INDICATORS (Y = 5% of maxRent, flat):
    4. Lease Duration  (grey dashed)     — lease_start → lease_end
    5. Lock-in Period  (yellow dashed)   — lease_start → lock-in end

  OVERLAP RULES:
  • Lines rendered bottom→top (SVG z-order): timeline → MG → revShare → Total
  • Total Rent always on top;  when Fixed-only, MG=Total → natural overlap
  • connectNulls=false so each line stops at its own end date
  • No artificial Y offsets
 ─────────────────────────────────────────────────────────────────
*/

const COLORS = {
  mg:       '#2563eb',   // blue       — MG / Fixed Rent
  revShare: '#f97316',   // orange     — Revenue Share
  total:    '#16a34a',   // green      — Total Rent  (top z-order)
  lease:    '#94a3b8',   // grey       — Lease Duration
  lockIn:   '#eab308',   // yellow     — Lock-in Period
};

const fmtY = (v) => {
  if (!v) return '0';
  if (v >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `${(v / 1000).toFixed(0)}K`;
  return v.toLocaleString('en-IN');
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const visible = payload.filter(p => p.value != null && p.value > 0);
  if (!visible.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,.1)', fontSize: 12 }}>
      <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>{label}</p>
      {visible.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: p.color }} />
          <span style={{ color: '#475569' }}>
            {p.name}:{' '}
            {p.dataKey === 'leaseDuration' || p.dataKey === 'lockInLine' ? '—' : formatRent(safeFloat(p.value))}
          </span>
        </div>
      ))}
    </div>
  );
};

const SERIES = [
  // Rendered bottom→top for correct SVG z-order
  { key: 'leaseDuration', name: 'Lease Duration',   color: COLORS.lease,    width: 2,   dash: '6 4' },
  { key: 'lockInLine',    name: 'Lock-in Period',   color: COLORS.lockIn,   width: 2,   dash: '6 4' },
  { key: 'mg',            name: 'MG / Fixed Rent',  color: COLORS.mg,       width: 2.5, dash: '' },
  { key: 'revShare',      name: 'Revenue Share',    color: COLORS.revShare, width: 2.5, dash: '4 3' },
  { key: 'total',         name: 'Total Rent',       color: COLORS.total,    width: 3,   dash: '' },
];

const FinancialValueMonthly = ({ leases = [], loading }) => {

  const { chartData, totals } = useMemo(() => {
    if (!leases || leases.length === 0) return { chartData: [], totals: { mg: 0, revShare: 0, total: 0 } };

    // ── Step 1: find real date range across all leases ──────────────
    let minDate = null, maxDate = null;
    leases.forEach(lease => {
      if (!lease.lease_start) return;
      const s = new Date(lease.lease_start);
      const e = lease.lease_end ? new Date(lease.lease_end) : new Date(s.getFullYear() + 3, s.getMonth(), 1);
      if (!minDate || s < minDate) minDate = s;
      if (!maxDate || e > maxDate) maxDate = e;
    });
    if (!minDate) return { chartData: [], totals: { mg: 0, revShare: 0, total: 0 } };

    // ── Step 2: generate monthly buckets ────────────────────────────
    const months = [];
    const cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endLimit = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    while (cur <= endLimit) {
      months.push({
        key:   cur.toISOString().slice(0, 7),
        label: cur.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        mg: 0, revShare: 0, total: 0, leaseDuration: null, lockInLine: null,
      });
      cur.setMonth(cur.getMonth() + 1);
    }

    // ── Step 3: accumulate rent values per month per lease ──────────
    leases.forEach(lease => {
      if (!lease.lease_start) return;

      const leaseStart    = new Date(lease.lease_start);
      const leaseStartMon = new Date(leaseStart.getFullYear(), leaseStart.getMonth(), 1);
      const leaseEnd      = lease.lease_end ? new Date(lease.lease_end) : new Date(leaseStart.getFullYear() + 3, leaseStart.getMonth(), 1);
      const leaseEndMon   = new Date(leaseEnd.getFullYear(), leaseEnd.getMonth(), 1);

      // Lock-in: prefer lessee_lockin_period_months, fallback to lockin_period_months
      const lockInMonths = parseInt(
        lease.lessee_lockin_period_months || lease.lockin_period_months || 0, 10
      );
      const lockInEnd = new Date(leaseStart.getFullYear(), leaseStart.getMonth() + lockInMonths, 1);

      const model     = (lease.rent_model || '').toLowerCase().replace(/\s+/g, '');
      const isFixed   = model === 'fixed';
      const isRS      = model === 'revenueshare';
      const isHybrid  = model === 'hybrid';

      const mgRent        = safeFloat(lease.mg_amount)  || safeFloat(lease.monthly_rent) || 0;
      const fixedRent     = safeFloat(lease.monthly_rent) || mgRent;
      const revSharePct   = safeFloat(lease.revenue_share_percentage) || 0;
      const monthlySales  = safeFloat(lease.monthly_net_sales) || 0;

      const mgVal       = isFixed ? fixedRent : mgRent;
      const rsVal       = (isRS || isHybrid) ? (monthlySales * revSharePct / 100) : 0;
      const totalVal    = isFixed ? fixedRent : Math.max(mgVal, rsVal);

      months.forEach(m => {
        const mDate     = new Date(m.key + '-01');
        const isActive  = mDate >= leaseStartMon && mDate <= leaseEndMon;
        const inLockIn  = mDate >= leaseStartMon && mDate <  lockInEnd;

        if (isActive) {
          m.mg           += mgVal;
          m.revShare     += rsVal;
          m.total        += totalVal;
          m.leaseDuration = 1;  // will be scaled
        }
        if (inLockIn) m.lockInLine = 1;  // will be scaled
      });
    });

    // ── Step 4: Map values directly without artificial offsets ────────
    const result = months.map(m => ({
      month:         m.label,
      mg:            m.mg       > 0 ? m.mg       : null,
      revShare:      m.revShare > 0 ? m.revShare : null,
      total:         m.total    > 0 ? m.total    : null,
      leaseDuration: m.leaseDuration != null ? m.total : null,
      lockInLine:    m.lockInLine    != null ? m.total : null,
    }));

    const totalsAcc = months.reduce((acc, m) => ({
      mg:       acc.mg       + m.mg,
      revShare: acc.revShare + m.revShare,
      total:    acc.total    + m.total,
    }), { mg: 0, revShare: 0, total: 0 });

    return { chartData: result, totals: totalsAcc };
  }, [leases]);

  const hasData = chartData.length > 0 && chartData.some(d => d.mg != null || d.total != null);

  return (
    <div className="echo-card" style={{ border: 'none', height: '100%' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>
        By Financial Value (Monthly)
      </h3>
      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 10px' }}>
        Rent projection — lines start at lease start, diverge by model &amp; lock-in
      </p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>Loading...</div>
      ) : !hasData ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748b' }}>No lease data available</div>
      ) : (
        <>
          {/* Scrollable chart area */}
          <div style={{ overflowX: 'auto', paddingBottom: 4, width: '100%' }}>
            <div style={{ minWidth: Math.max(720, chartData.length * 30), height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={fmtY} width={48} />
                  <Tooltip content={<CustomTooltip />} />

                  {SERIES.map(s => (
                    <Line
                      key={s.key}
                      type="linear"
                      dataKey={s.key}
                      name={s.name}
                      stroke={s.color}
                      strokeWidth={s.width}
                      strokeDasharray={s.dash || undefined}
                      dot={false}
                      connectNulls={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend — 2-column grid, outside scrollable div, never clips */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '4px 12px', padding: '8px 0 4px', width: '100%',
          }}>
            {SERIES.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <svg width="20" height="10" style={{ flexShrink: 0 }}>
                  <line x1="0" y1="5" x2="20" y2="5"
                    stroke={s.color} strokeWidth={s.width + 0.5}
                    strokeDasharray={s.dash || undefined} strokeLinecap="round"
                  />
                </svg>
                <span style={{ fontSize: 11, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.name}
                </span>
              </div>
            ))}
          </div>

          {/* Summary totals */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 6, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            {[
              { label: 'MG / Fixed Rent', val: totals.mg,       color: COLORS.mg },
              { label: 'Revenue Share',   val: totals.revShare,  color: COLORS.revShare },
              { label: 'Total Rent',      val: totals.total,     color: COLORS.total },
            ].map(item => (
              <div key={item.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: item.color, margin: 0 }}>
                  {formatRent(safeFloat(item.val))}
                </p>
                <p style={{ fontSize: 9, color: '#64748b', margin: '2px 0 0' }}>{item.label}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialValueMonthly;
