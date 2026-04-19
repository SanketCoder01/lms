import React, { useState, useRef, useMemo } from 'react';
import { resolveBrandName } from '../../../utils/formatters';

/**
 * CriticalNotificationTicker
 * 
 * Shows ONLY critical (< 30 days) alerts as a right-to-left scrolling ticker.
 * Sources:
 *   - Lease expiry (lease_end)
 *   - Lock-in expiry (lease_start + lockin_months)
 *   - Upcoming escalations (next_escalation_date)
 *
 * Bell icon shows unread count badge. Clicking bell pauses/resumes ticker.
 */
const CriticalNotificationTicker = ({ leases = [] }) => {
  const [open, setOpen]       = useState(false);   // panel dropdown open
  const [paused, setPaused]   = useState(false);
  const tickerRef             = useRef(null);

  // ── Build critical alerts (< 30 days) ──────────────────────────────────────
  const alerts = useMemo(() => {
    if (!leases || leases.length === 0) return [];
    const now  = new Date();
    const list = [];

    leases.forEach(lease => {
      const brand = resolveBrandName(lease);
      const unit  = lease.unit_number || lease.units?.unit_number || '';

      // 1. Lease expiry
      if (lease.lease_end) {
        const end  = new Date(lease.lease_end);
        const days = Math.ceil((end - now) / 86400000);
        if (days > 0 && days < 30) {
          list.push({ type: 'Lease Expiry', brand, unit, days, icon: '📅' });
        }
      }

      // 2. Lock-in expiry
      if (lease.lease_start) {
        const lockMonths = parseInt(
          lease.lessee_lockin_period_months || lease.lockin_period_months ||
          lease.lock_in_period || 0, 10
        );
        if (lockMonths > 0) {
          const start  = new Date(lease.lease_start);
          const lockEnd = new Date(start.getFullYear(), start.getMonth() + lockMonths, start.getDate());
          const days   = Math.ceil((lockEnd - now) / 86400000);
          if (days > 0 && days < 30) {
            list.push({ type: 'Lock-in Expiry', brand, unit, days, icon: '🔒' });
          }
        }
      }

      // 3. Upcoming escalation
      const escDate = lease.next_escalation_date || lease.escalation_date;
      if (escDate) {
        const esc  = new Date(escDate);
        const days = Math.ceil((esc - now) / 86400000);
        if (days > 0 && days < 30) {
          list.push({ type: 'Escalation Due', brand, unit, days, icon: '📈' });
        }
      }
    });

    return list.sort((a, b) => a.days - b.days);
  }, [leases]);

  const count = alerts.length;

  // ── Pause ticker on hover ────────────────────────────────────────────────────
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  // Show "No alerts" message when empty
  if (count === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <button
          disabled
          style={{
            position:    'relative',
            background:  '#f1f5f9',
            border:      'none',
            padding:     '6px 8px',
            flexShrink:  0,
            color:       '#94a3b8',
            fontSize:    20,
            lineHeight:  1,
            borderRadius: '50%',
            marginRight: '8px',
            cursor:      'default'
          }}
        >
          🔔
          <span style={{
            position:    'absolute',
            top:         -2,
            right:       -2,
            background:  '#94a3b8',
            color:       '#fff',
            fontSize:    9,
            fontWeight:  800,
            borderRadius: 999,
            minWidth:    16,
            height:      16,
            display:     'flex',
            alignItems:  'center',
            justifyContent: 'center',
          }}>
            0
          </span>
        </button>
        <div
          style={{
            flex:       1,
            background: '#f8fafc',
            borderRadius: 20,
            height:     30,
            display:    'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color:      '#64748b',
            fontSize:   12,
            fontWeight: 500,
          }}
        >
          ✓ No critical alerts at this time
        </div>
      </div>
    );
  }

  // ── Ticker content (duplicated for seamless loop) ────────────────────────────
  const TickerItem = ({ alert }) => (
    <span style={{
      display:      'inline-flex',
      alignItems:   'center',
      gap:          6,
      whiteSpace:   'nowrap',
      padding:      '0 28px',
      borderRight:  '1px solid rgba(0,0,0,0.1)',
    }}>
      <span>{alert.icon}</span>
      <span style={{ fontWeight: 700, color: '#000' }}>{alert.type}</span>
      <span style={{ color: '#475569' }}>·</span>
      <span style={{ color: '#0f172a', fontWeight: 500 }}>{alert.brand}</span>
      {alert.unit && <span style={{ color: '#64748b' }}>({alert.unit})</span>}
      <span style={{
        background:   '#fef2f2',
        color:        '#b91c1c',
        borderRadius: 4,
        padding:      '1px 6px',
        fontSize:     11,
        fontWeight:   700,
        border:       '1px solid #fca5a5',
      }}>
        {alert.days}d left
      </span>
    </span>
  );

  // Duplicate for infinite scroll effect
  const items = [...alerts, ...alerts];

  return (
    <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0, position: 'relative' }}>
      {/* Bell icon with badge */}
      <button
        onClick={() => setOpen(o => !o)}
        title={`${count} critical alert${count > 1 ? 's' : ''}`}
        style={{
          position:    'relative',
          background:  '#fff',
          border:      'none',
          cursor:      'pointer',
          padding:     '6px 8px',
          flexShrink:  0,
          color:       '#ef4444',
          fontSize:    20,
          lineHeight:  1,
          borderRadius: '50%',
          marginRight: '8px',
          boxShadow:   '0 1px 3px rgba(0,0,0,0.1)'
        }}
      >
        🔔
        <span style={{
          position:    'absolute',
          top:         -2,
          right:       -2,
          background:  '#ef4444',
          color:       '#fff',
          fontSize:    9,
          fontWeight:  800,
          borderRadius: 999,
          minWidth:    16,
          height:      16,
          display:     'flex',
          alignItems:  'center',
          justifyContent: 'center',
          padding:     '0 3px',
        }}>
          {count}
        </span>
      </button>

      {/* Scrolling ticker band */}
      <div
        style={{
          flex:       1,
          overflow:   'hidden',
          background: '#fff',
          borderRadius: 20,
          height:     30,
          display:    'flex',
          alignItems: 'center',
          cursor:     'pointer',
          boxShadow:  '0 1px 3px rgba(0,0,0,0.1)'
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => setOpen(o => !o)}
        title="Click to see all critical alerts"
      >
        <style>{`
          @keyframes lms-ticker {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .lms-ticker-inner {
            display:    inline-flex;
            animation:  lms-ticker ${Math.max(8, count * 4)}s linear infinite;
            font-size:  12px;
          }
          .lms-ticker-inner.paused {
            animation-play-state: paused;
          }
        `}</style>
        <div ref={tickerRef} className={`lms-ticker-inner${paused ? ' paused' : ''}`}>
          {items.map((a, i) => <TickerItem key={i} alert={a} />)}
        </div>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position:    'absolute',
          top:         38,
          left:        0,
          zIndex:      999,
          background:  '#fff',
          border:      '1px solid #fca5a5',
          borderRadius: 10,
          boxShadow:   '0 8px 32px rgba(0,0,0,0.18)',
          minWidth:    340,
          maxWidth:    400,
          overflow:    'hidden',
        }}>
          {/* Header */}
          <div style={{ background: '#7f1d1d', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
              🚨 Critical Alerts ({count})
            </span>
            <button
              onClick={e => { e.stopPropagation(); setOpen(false); }}
              style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
            >×</button>
          </div>

          {/* Alert rows */}
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                display:    'flex',
                alignItems: 'center',
                gap:        12,
                padding:    '10px 16px',
                borderBottom: '1px solid #fee2e2',
                background: i % 2 === 0 ? '#fff' : '#fff8f8',
              }}>
                <span style={{ fontSize: 20 }}>{a.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#7f1d1d' }}>{a.type}</p>
                  <p style={{ margin: 0, fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                    {a.brand}{a.unit ? ` · ${a.unit}` : ''}
                  </p>
                </div>
                <div style={{
                  background:   '#fee2e2',
                  color:        '#991b1b',
                  borderRadius: 6,
                  padding:      '4px 10px',
                  fontWeight:   700,
                  fontSize:     13,
                  whiteSpace:   'nowrap',
                }}>
                  {a.days} days
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '8px 16px', textAlign: 'center', background: '#fff5f5' }}>
            <span style={{ fontSize: 11, color: '#991b1b' }}>
              Showing leases &lt; 30 days to expiry / lock-in / escalation
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalNotificationTicker;
