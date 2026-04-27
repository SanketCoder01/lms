/**
 * formatters.js
 * Central utility library for the Echo admin dashboard.
 * All shared formatting, date, flag, and business-logic helpers live here.
 */

// ─── Currency (₹ in Lacs / Crores) ──────────────────────────────────────────

export const formatCurrency = (val) => {
  const n = safeFloat(val);
  if (n === 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}C`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

export const formatCurrencyRaw = (val) => {
  const n = safeFloat(val);
  if (n === 0) return '0';
  if (n >= 10000000) return `${(n / 10000000).toFixed(2)}C`;
  if (n >= 100000)   return `${(n / 100000).toFixed(2)}L`;
  return n.toLocaleString('en-IN');
};

/** Alias kept for backwards compatibility (UpcomingEscalations etc.) */
export const formatRent = formatCurrency;

// ─── Area ────────────────────────────────────────────────────────────────────

export const formatArea = (val) => {
  const n = safeFloat(val);
  if (n === 0) return '0 sqft';
  if (n >= 100000) return `${(n / 100000).toFixed(2)} L sqft`;
  return `${n.toLocaleString('en-IN')} sqft`;
};

export const formatAreaRaw = (val) => {
  const n = safeFloat(val);
  if (n === 0) return '0';
  if (n >= 100000) return `${(n / 100000).toFixed(2)}L`;
  return n.toLocaleString('en-IN');
};

// ─── Date (DD/MM/YYYY) ───────────────────────────────────────────────────────

export const formatDate = (val) => {
  if (!val) return '—';
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return '—';
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// ─── Null-safe parsing ───────────────────────────────────────────────────────

export const safeFloat = (val, fallback = 0) => {
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
};

/** Alias — dashboardUtils consumers use parseSafe */
export const parseSafe = safeFloat;

// ─── Profit / Loss ───────────────────────────────────────────────────────────

export const getProfitLoss = (actualRent, targetRent) =>
  safeFloat(actualRent) - safeFloat(targetRent);

// ─── Tenant name resolution ──────────────────────────────────────────────────

export const getActiveTenantName = (lease) => {
  if (!lease) return null;
  return (
    lease.brand_name            ||
    lease.tenant?.brand_name    ||
    lease.tenant?.company_name  ||
    lease.tenant?.name          ||
    lease.tenant_name           ||
    lease.tenantName            ||
    null
  );
};

// ─── Unit label sanitation ───────────────────────────────────────────────────

export const cleanUnitLabel = (str) => {
  if (!str) return 'N/A';
  return str.replace(/\bu\/\d+\b/gi, '').trim() || str;
};

/** Clean a raw brand/company string — strips internal unit codes, trims. Returns the value if truthy, else empty string. Never returns "Unknown". */
export const sanitizeBrandName = (str) => {
  if (!str || str === '-' || str.toLowerCase() === 'unknown') return '';
  const cleaned = str.replace(/\bu\/\d+\b/gi, '').trim();
  return cleaned || str.trim();
};

/**
 * Resolve the best available display name from a lease object.
 * Priority: brand_name → tenant.brand_name → tenant.company_name → tenant.name → tenant_name → unit_number fallback
 * Never returns 'Unknown' or blank — falls back to the unit number as label.
 */
export const resolveBrandName = (lease) => {
  const candidates = [
    lease?.brand_name,
    lease?.tenant?.brand_name,
    lease?.tenant?.company_name,
    lease?.tenant?.name,
    lease?.tenant_name,
    lease?.tenantName,
    lease?.company_name,
  ];
  for (const c of candidates) {
    const s = sanitizeBrandName(c);
    if (s) return s;
  }
  // Fallback: use unit number so it's never empty
  return lease?.unit_number || lease?.units?.unit_number || 'Lease #' + (lease?.id || '?');
};

// ─── Rent composition tooltip data ──────────────────────────────────────────

export const getRentCompositionInfo = (fixed, mg, revShare) => {
  const total = safeFloat(fixed) + safeFloat(mg) + safeFloat(revShare);
  return {
    total,
    lines: [
      { label: 'Fixed Rent',                        value: safeFloat(fixed),    color: 'hsl(210,80%,50%)' },
      { label: 'Rev-share leases - MG Rent',         value: safeFloat(mg),       color: 'hsl(145,63%,42%)' },
      { label: 'Rev-share leases - Variable Rent',   value: safeFloat(revShare), color: 'hsl(38,92%,50%)'  },
    ],
  };
};

// ─── Status / flag logic ─────────────────────────────────────────────────────

/**
 * Returns badge colour info based on days remaining and context type.
 *   type = 'expiry'     → Active / Warning / Critical
 *   type = 'lockin'     → Secure / Warning / Critical
 *   type = 'escalation' → Scheduled / Warning / Critical
 */
export const getLeaseFlag = (days, type = 'expiry') => {
  if (days <= 30) return { bg: '#fee2e2', text: '#991b1b', status: 'Critical'  };
  if (days <= 90) return { bg: '#fef3c7', text: '#854d0e', status: 'Warning'   };
  if (type === 'lockin')     return { bg: '#dbeafe', text: '#1d4ed8', status: 'Secure'    };
  if (type === 'escalation') return { bg: '#f0fdf4', text: '#166534', status: 'Scheduled' };
  return                            { bg: '#dcfce7', text: '#166534', status: 'Active'    };
};

// ─── Number formatting ───────────────────────────────────────────────────────

export const formatNumber = (val) =>
  safeFloat(val).toLocaleString('en-IN');

// ─── Escalation interval label ────────────────────────────────────────────────

const ESCALATION_LABELS = { 1: 'Annual', 2: 'Biennial', 3: 'Triennial', 5: 'Quinquennial' };
export const getEscalationIntervalLabel = (years) =>
  ESCALATION_LABELS[years] || `Every ${years} yr`;
