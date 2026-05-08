import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';

/* ─── Colours ─────────────────────────────────────────────────── */
const C = {
  registered: '#1D4ED8',   // blue
  executed: '#F97316',   // orange
  loi: '#EAB308',   // yellow
};

/* ─── Locale-independent month key ───────────────────────────── */



const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const rows = payload.filter(p => p.value > 0);
  if (!rows.length) return null;

  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 8,
      padding: '10px 14px',
      boxShadow: '0 4px 16px rgba(0,0,0,.12)',
      fontSize: 12,
      minWidth: 160,
    }}>
      <p style={{ fontWeight: 700, color: '#0f172a', margin: '0 0 8px', fontSize: 13 }}>{label}</p>
      {rows.map((p, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12, marginBottom: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: p.fill }} />
            <span style={{ color: '#475569' }}>{p.name}</span>
          </div>
          <span style={{ fontWeight: 700, color: '#0f172a' }}>
            {p.value} lease{p.value !== 1 ? 's' : ''}
          </span>
        </div>
      ))}
      {rows.length > 1 && (
        <div style={{
          marginTop: 6, paddingTop: 6,
          borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#64748b', fontSize: 11 }}>Total</span>
          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 11 }}>
            {rows.reduce((s, p) => s + p.value, 0)}
          </span>
        </div>
      )}
    </div>
  );
};

/* ─── Component ───────────────────────────────────────────────── */
const LeasingActivity = ({
  chartData = [],
  areaLeased = 0,
  loading = false,
  loiCount = 0,
  executedCount = 0,
  registeredCount = 0,
}) => {

  /* Build one entry per month: { month, registered, executed, loi } */
  const buildDisplayData = () => {
    if (!Array.isArray(chartData) || chartData.length === 0) {
      // No chart data at all — show all 12 months of current year as empty
      const MO_ALL = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const yr = String(new Date().getFullYear()).slice(2);
      return MO_ALL.map(m => ({ month: `${m} ${yr}`, registered: 0, executed: 0, loi: 0 }));
    }

    // Show ALL months (including zero-activity months) so the timeline is continuous
    return chartData.map(d => ({
      month: d.month,
      registered: d.registeredUnits || 0,
      executed: d.executedUnits || 0,
      loi: d.loiUnits || 0,
    }));
  };

  const displayData = buildDisplayData();

  // Show full year label: "Jan 26 – Dec 26"
  const dateRangeLabel = displayData.length > 1
    ? `${displayData[0].month} – ${displayData[displayData.length - 1].month}`
    : displayData.length === 1 ? displayData[0].month : '';


  /*
    Each month group needs ~90px:
    3 bars × ~20px each + gaps + x-label.
    Minimum 300px so the chart always renders.
  */
  const chartMinWidth = Math.max(320, displayData.length * 110);

  return (
    /*
      The card must NOT overflow the dashboard index.
      Set minWidth:0 and overflow:hidden on the card itself,
      then the inner scroll div handles horizontal scrolling.
    */
    <div
      className="echo-card"
      style={{ border: 'none', height: '100%', minWidth: 0, overflowX: 'hidden', overflowY: 'visible' }}
    >
      {/* Title */}
      <h3 className="echo-card-title" style={{ marginBottom: 2 }}>Leasing Activity</h3>
      <p className="echo-card-subtitle" style={{ marginBottom: 14 }}>
        {loading
          ? 'Loading…'
          : displayData.length > 0
            ? `${dateRangeLabel} · ${Number(areaLeased).toLocaleString('en-IN')} sqft leased`
            : 'No leasing activity yet'}
      </p>

      {/* KPI counters */}
      <div className="echo-leasing-stats" style={{ marginBottom: 16 }}>
        {[
          { label: 'LOI', value: loiCount, color: C.loi },
          { label: 'Leasing Executed', value: executedCount, color: C.executed },
          { label: 'Registered', value: registeredCount, color: C.registered },
        ].map(({ label, value, color }) => (
          <div key={label} className="echo-leasing-stat">
            <p className="echo-leasing-stat-label">{label}</p>
            <p className="echo-leasing-stat-value" style={{ color }}>
              {loading ? '…' : value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>
          Loading chart…
        </div>
      ) : displayData.length > 0 ? (
        <>
          {/*
            Horizontal-scroll wrapper — identical pattern to ZoningExecution.
            Fixed height; inner div grows with data width.
          */}
          <div style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            width: '100%',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 4,
          }}>
            <div style={{ minWidth: chartMinWidth, height: 260, overflow: 'visible' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={displayData}
                  barCategoryGap="20%"
                  barGap={4}
                  margin={{ top: 6, right: 12, left: -14, bottom: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                  <XAxis
                    dataKey="month"
                    tickFormatter={(value) => String(value || '')}
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    height={28}
                  />

                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                    width={26}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                  />

                  {/*
                    NO stackId → 3 independent grouped bars side-by-side per month,
                    exactly like the reference image (Shop1/Shop2/Shop3/Shop4 style).
                  */}
                  <Bar dataKey="registered" name="Registered" fill={C.registered}
                    radius={[3, 3, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="executed" name="Executed" fill={C.executed}
                    radius={[3, 3, 0, 0]} maxBarSize={36} />
                  <Bar dataKey="loi" name="LOI" fill={C.loi}
                    radius={[3, 3, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', gap: 20, marginTop: 10,
            justifyContent: 'center', flexWrap: 'wrap',
          }}>
            {[
              { color: C.registered, label: 'Registered' },
              { color: C.executed, label: 'Executed' },
              { color: C.loi, label: 'LOI' },
            ].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                <span style={{ fontSize: 11, color: '#475569' }}>{label}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 16px', color: '#64748b' }}>
          <p style={{ margin: 0, fontSize: 14 }}>No leasing activity recorded yet</p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#94a3b8' }}>
            Add LOI, Agreement, or Registration dates to leases to see activity here
          </p>
        </div>
      )}
    </div>
  );
};

export default LeasingActivity;
