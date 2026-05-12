import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnon) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

// ─────────────────────────────────────────────────────────────────────────────
//  ACTUAL TABLE MAP (from supabase_schema.sql):
//
//  projects           – id, project_name, location, status
//  units              – id, project_id, unit_number, floor_number, block_tower,
//                       chargeable_area, status
//  parties            – id, party_type ('Owner'|'Tenant'), first_name, last_name,
//                       company_name, brand_name, owner_group
//  unit_ownerships    – unit_id, party_id (links owner party → unit)
//  leases             – id, project_id, unit_id, party_owner_id, party_tenant_id,
//                       rent_model, monthly_rent, mg_amount, revenue_share_percentage,
//                       lease_start, lease_end, rent_commencement_date, status
//  lease_escalations  – lease_id, sequence_no, effective_from, effective_to,
//                       increase_type, value, rate_per_sqft
//
//  NEW (invoicing-specific — run leaseos_invoicing_schema.sql in Supabase):
//  leaseos_invoices   – id, invoice_no, project_id, unit_id, lease_id,
//                       owner_party_id, tenant_party_id, billing_month,
//                       invoice_date, due_date, rent_amount, cam_amount,
//                       gst_amount, total_amount, collected_amount, balance_amount,
//                       status, notes, created_at
//  leaseos_collections– id, receipt_no, invoice_id, project_id, unit_id,
//                       tenant_party_id, receipt_date, payment_mode, reference_no,
//                       amount, tds_amount, net_amount, created_at
// ─────────────────────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════════
//  SHARED / MASTER DATA  (from main LMS tables)
// ═══════════════════════════════════════════════════════════════════════════

/** All companies (multi-tenancy) */
export async function fetchCompanies() {
  const { data, error } = await supabase
    .from("company_users")
    .select("id, company_name")
    .order("company_name");
  if (error) throw error;
  return data ?? [];
}

/** All active projects */
export async function fetchProjects(companyId) {
  let q = supabase
    .from("projects")
    .select("id, project_name, location, status, company_id")
    .eq("status", "active")
    .order("project_name");

  if (companyId) q = q.eq("company_id", companyId);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

/** All owner parties for a company/project */
export async function fetchOwnersByCompanyAndProject(companyId, projectId) {
  // Get parties that own units in this project
  let q1 = supabase
    .from("unit_ownerships")
    .select(`
      party_id,
      parties!inner(id, party_type, first_name, last_name, company_name, brand_name, owner_group, company_id)
    `)
    .eq("units.project_id", projectId)
    .eq("ownership_status", "Active");

  const { data, error } = await q1;

  // Fallback: just fetch all owner-type parties for the company
  if (error || !data?.length) {
    let q2 = supabase
      .from("parties")
      .select("id, first_name, last_name, company_name, brand_name, owner_group, party_type, company_id")
      .eq("party_type", "Owner")
      .order("first_name");

    if (companyId) q2 = q2.eq("company_id", companyId);

    const { data: d2, error: e2 } = await q2;
    if (e2) throw e2;
    return (d2 ?? []).map((p) => ({
      id: p.id,
      display_name: p.company_name || `${p.first_name || ""} ${p.last_name || ""}`.trim(),
      owner_group: p.owner_group,
    }));
  }

  const seen = new Set();
  return (data ?? [])
    .filter((r) => {
      if (companyId && r.parties.company_id !== companyId) return false;
      if (seen.has(r.party_id)) return false;
      seen.add(r.party_id);
      return true;
    })
    .map((r) => ({
      id: r.parties.id,
      display_name: r.parties.company_name || `${r.parties.first_name || ""} ${r.parties.last_name || ""}`.trim(),
      owner_group: r.parties.owner_group,
    }));
}

/** All active leases for a project (with joined unit + tenant + owner) */
export async function fetchLeasesByProject(projectId) {
  let q = supabase
    .from("leases")
    .select(`
      id,
      project_id,
      unit_id,
      party_owner_id,
      party_tenant_id,
      rent_model,
      monthly_rent,
      mg_amount,
      mg_amount_sqft,
      cam_charges,
      revenue_share_percentage,
      lease_start,
      lease_end,
      rent_commencement_date,
      status,
      units!inner(id, unit_number, floor_number, block_tower, chargeable_area),
      owner:parties!leases_party_owner_id_fkey(id, first_name, last_name, company_name, owner_group),
      tenant:parties!leases_party_tenant_id_fkey(id, first_name, last_name, company_name, brand_name)
    `)
    .in("status", ["active", "Active"]);

  if (projectId) q = q.eq("project_id", projectId);

  const { data, error } = await q.order("id");
  if (error) throw error;
  return data ?? [];
}

/** Units for a project, optionally filtered by owner party */
export async function fetchUnitsByProject(projectId, ownerPartyId) {
  let q = supabase
    .from("units")
    .select(`
      id, unit_number, floor_number, block_tower, chargeable_area, status,
      unit_ownerships(party_id, ownership_status)
    `)
    .eq("project_id", projectId);

  const { data, error } = await q.order("unit_number");
  if (error) throw error;

  if (ownerPartyId) {
    return (data ?? []).filter((u) =>
      u.unit_ownerships?.some(
        (o) => o.party_id == ownerPartyId && o.ownership_status === "Active"
      )
    );
  }
  return data ?? [];
}

/** All active leases with full context for a project + optional owner filter */
export async function fetchLeasesForInvoicing(projectId, ownerPartyId) {
  const leases = await fetchLeasesByProject(projectId);
  if (!ownerPartyId) return leases;
  return leases.filter((l) => l.party_owner_id == ownerPartyId);
}


// ═══════════════════════════════════════════════════════════════════════════
//  INVOICING MODULE  (leaseos_invoices table)
// ═══════════════════════════════════════════════════════════════════════════

/** Fetch invoices with filters */
export async function fetchInvoices({ projectId, billingMonth, ownerPartyId, status } = {}) {
  let q = supabase
    .from("leaseos_invoices")
    .select(`
      id, invoice_no, billing_month, invoice_date, due_date,
      company_id, project_id, unit_id, lease_id, owner_party_id, tenant_party_id,
      rent_amount, cam_amount, gst_amount, total_amount,
      collected_amount, balance_amount, status, notes,
      projects(project_name),
      units(unit_number, floor_number),
      owner:parties!leaseos_invoices_owner_party_id_fkey(first_name, last_name, company_name),
      tenant:parties!leaseos_invoices_tenant_party_id_fkey(first_name, last_name, company_name, brand_name)
    `)
    .order("invoice_date", { ascending: false });

  if (projectId) q = q.eq("project_id", projectId);
  if (billingMonth) q = q.eq("billing_month", billingMonth);
  if (ownerPartyId) q = q.eq("owner_party_id", ownerPartyId);
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(normalizeInvoice);
}

function normalizeInvoice(r) {
  const ownerName = r.owner
    ? (r.owner.company_name || `${r.owner.first_name || ""} ${r.owner.last_name || ""}`.trim())
    : "—";
  const tenantName = r.tenant
    ? (r.tenant.brand_name || r.tenant.company_name || `${r.tenant.first_name || ""} ${r.tenant.last_name || ""}`.trim())
    : "—";
  return {
    ...r,
    project_name: r.projects?.project_name || "—",
    unit_no: r.units?.unit_number || "—",
    owner_name: ownerName,
    tenant_name: tenantName,
  };
}

/** Insert a new invoice */
export async function createInvoice(payload) {
  const { data, error } = await supabase
    .from("leaseos_invoices")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Mark invoice as settled (full or partial) */
export async function settleInvoice(invoiceId, collectedAmount) {
  const { data: inv, error: fetchErr } = await supabase
    .from("leaseos_invoices")
    .select("total_amount, collected_amount")
    .eq("id", invoiceId)
    .single();
  if (fetchErr) throw fetchErr;

  const newCollected = (Number(inv.collected_amount) || 0) + Number(collectedAmount);
  const newBalance = (Number(inv.total_amount) || 0) - newCollected;
  const newStatus = newBalance <= 0 ? "Paid" : "Partial";

  const { error } = await supabase
    .from("leaseos_invoices")
    .update({ collected_amount: newCollected, balance_amount: newBalance, status: newStatus })
    .eq("id", invoiceId);
  if (error) throw error;
}


// ═══════════════════════════════════════════════════════════════════════════
//  COLLECTIONS MODULE  (leaseos_collections table)
// ═══════════════════════════════════════════════════════════════════════════

/** Outstanding invoices for one tenant party */
export async function fetchOutstandingByTenant(tenantPartyId) {
  const { data, error } = await supabase
    .from("leaseos_invoices")
    .select(`
      id, invoice_no, invoice_date, billing_month,
      total_amount, collected_amount, balance_amount, status,
      units(unit_number), projects(project_name)
    `)
    .eq("tenant_party_id", tenantPartyId)
    .in("status", ["Outstanding", "Overdue", "Partial"])
    .order("invoice_date", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    unit_no: r.units?.unit_number || "—",
    project_name: r.projects?.project_name || "—",
  }));
}

/** All tenant parties that have active leases */
export async function fetchActiveTenantParties() {
  const { data, error } = await supabase
    .from("leases")
    .select("party_tenant_id, parties!leases_party_tenant_id_fkey(id, first_name, last_name, company_name, brand_name), units(unit_number)")
    .in("status", ["active", "Active"]);
  if (error) throw error;

  const seen = new Set();
  return (data ?? [])
    .filter((r) => r.party_tenant_id && !seen.has(r.party_tenant_id) && (seen.add(r.party_tenant_id), true))
    .map((r) => ({
      id: r.parties?.id,
      display_name: r.parties?.brand_name || r.parties?.company_name || `${r.parties?.first_name || ""} ${r.parties?.last_name || ""}`.trim(),
      unit_no: r.units?.unit_number || "—",
    }));
}

/** Recent collections — last 30 days */
export async function fetchRecentCollections(projectId) {
  const since = new Date();
  since.setDate(since.getDate() - 30);

  let q = supabase
    .from("leaseos_collections")
    .select(`
      id, receipt_no, receipt_date, payment_mode, reference_no,
      amount, tds_amount, net_amount,
      company_id, project_id, unit_id, tenant_party_id,
      invoice:leaseos_invoices(invoice_no),
      projects(project_name),
      units(unit_number),
      tenant:parties!leaseos_collections_tenant_party_id_fkey(first_name, last_name, company_name, brand_name)
    `)
    .gte("receipt_date", since.toISOString().split("T")[0])
    .order("receipt_date", { ascending: false });

  if (projectId) q = q.eq("project_id", projectId);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    tenant_name: r.tenant?.brand_name || r.tenant?.company_name || `${r.tenant?.first_name || ""} ${r.tenant?.last_name || ""}`.trim(),
    unit_no: r.units?.unit_number || "—",
    invoice_ref: r.invoice?.invoice_no || "—",
    project_name: r.projects?.project_name || "—",
  }));
}

/** Insert a collection receipt */
export async function createCollection(payload) {
  const { data, error } = await supabase
    .from("leaseos_collections")
    .insert([payload])
    .select()
    .single();
  if (error) throw error;
  // Also update the linked invoice
  if (payload.invoice_id) {
    await settleInvoice(payload.invoice_id, payload.amount);
  }
  return data;
}


// ═══════════════════════════════════════════════════════════════════════════
//  RENT LEDGER MODULE
// ═══════════════════════════════════════════════════════════════════════════

/** Compute aging buckets from outstanding invoices */
export async function fetchAgingSummary(projectId) {
  let q = supabase
    .from("leaseos_invoices")
    .select("balance_amount, invoice_date")
    .in("status", ["Outstanding", "Overdue", "Partial"]);
  if (projectId) q = q.eq("project_id", projectId);

  const { data, error } = await q;
  if (error) throw error;

  const today = Date.now();
  const buckets = [
    { label: "0–30 Days", min: 0, max: 30, tone: "teal", total: 0, count: 0 },
    { label: "31–60 Days", min: 31, max: 60, tone: "amber", total: 0, count: 0 },
    { label: "61–90 Days", min: 61, max: 90, tone: "orange", total: 0, count: 0 },
    { label: "> 90 Days", min: 91, max: Infinity, tone: "rose", total: 0, count: 0 },
  ];

  for (const inv of data ?? []) {
    const age = Math.floor((today - new Date(inv.invoice_date)) / 86_400_000);
    const b = buckets.find((b) => age >= b.min && age <= b.max);
    if (b) { b.total += Number(inv.balance_amount) || 0; b.count++; }
  }

  return buckets.map((b) => ({
    label: b.label,
    value: b.total > 0 ? `₹${(b.total / 100_000).toFixed(1)}L` : "₹0",
    meta: `${b.count} invoice${b.count !== 1 ? "s" : ""}`,
    tone: b.tone,
  }));
}

/** Per-tenant aging detail rows */
export async function fetchAgingRows(projectId) {
  let q = supabase
    .from("leaseos_invoices")
    .select(`
      balance_amount, invoice_date,
      tenant:parties!leaseos_invoices_tenant_party_id_fkey(first_name, last_name, company_name, brand_name),
      units(unit_number)
    `)
    .in("status", ["Outstanding", "Overdue", "Partial"]);
  if (projectId) q = q.eq("project_id", projectId);

  const { data, error } = await q;
  if (error) throw error;

  const today = Date.now();
  const map = {};
  for (const inv of data ?? []) {
    const tName = inv.tenant?.brand_name || inv.tenant?.company_name || `${inv.tenant?.first_name || ""} ${inv.tenant?.last_name || ""}`.trim();
    const uNo = inv.units?.unit_number || "—";
    const key = `${tName}||${uNo}`;
    const age = Math.floor((today - new Date(inv.invoice_date)) / 86_400_000);
    const bal = Number(inv.balance_amount) || 0;
    if (!map[key]) map[key] = { tenant: tName, unit: uNo, total: 0, d0: 0, d31: 0, d61: 0, d90: 0 };
    map[key].total += bal;
    if (age <= 30) map[key].d0 += bal;
    else if (age <= 60) map[key].d31 += bal;
    else if (age <= 90) map[key].d61 += bal;
    else map[key].d90 += bal;
  }

  return Object.values(map).map((r) => ({
    tenant: r.tenant,
    unit: r.unit,
    total: r.total.toLocaleString("en-IN"),
    d0: r.d0 > 0 ? r.d0.toLocaleString("en-IN") : "-",
    d31: r.d31 > 0 ? r.d31.toLocaleString("en-IN") : "-",
    d61: r.d61 > 0 ? r.d61.toLocaleString("en-IN") : "-",
    d90: r.d90 > 0 ? r.d90.toLocaleString("en-IN") : "-",
    bar: r.d90 > 0 ? "rose" : r.d61 > 0 ? "orange" : r.d31 > 0 ? "amber" : "teal",
  }));
}

/** Full invoice + payment history for one tenant party */
export async function fetchTenantStatement(tenantPartyId) {
  const { data, error } = await supabase
    .from("leaseos_invoices")
    .select(`
      id, invoice_no, invoice_date, billing_month,
      total_amount, collected_amount, balance_amount, status,
      units(unit_number)
    `)
    .eq("tenant_party_id", tenantPartyId)
    .order("invoice_date");
  if (error) throw error;
  return data ?? [];
}

/** Owner-wise collection summary for a billing month */
export async function fetchOwnerReport(projectId, billingMonth) {
  let q = supabase
    .from("leaseos_invoices")
    .select(`
      owner_party_id, total_amount, collected_amount, balance_amount, unit_id,
      owner:parties!leaseos_invoices_owner_party_id_fkey(first_name, last_name, company_name, owner_group)
    `);

  if (projectId) q = q.eq("project_id", projectId);
  if (billingMonth) q = q.eq("billing_month", billingMonth);

  const { data, error } = await q;
  if (error) throw error;

  const map = {};
  for (const r of data ?? []) {
    const key = r.owner_party_id;
    const name = r.owner?.company_name || `${r.owner?.first_name || ""} ${r.owner?.last_name || ""}`.trim();
    if (!map[key]) map[key] = { owner: name, category: r.owner?.owner_group || "—", units: new Set(), invoiced: 0, collected: 0, outstanding: 0 };
    map[key].units.add(r.unit_id);
    map[key].invoiced += Number(r.total_amount) || 0;
    map[key].collected += Number(r.collected_amount) || 0;
    map[key].outstanding += Number(r.balance_amount) || 0;
  }

  return Object.values(map).map((r) => ({
    owner: r.owner,
    category: r.category,
    units: r.units.size,
    invoiced: r.invoiced.toLocaleString("en-IN"),
    collected: r.collected.toLocaleString("en-IN"),
    outstanding: r.outstanding.toLocaleString("en-IN"),
    efficiency: r.invoiced > 0 ? `${((r.collected / r.invoiced) * 100).toFixed(1)}%` : "—",
  }));
}


// ═══════════════════════════════════════════════════════════════════════════
//  DASHBOARD KPIs
// ═══════════════════════════════════════════════════════════════════════════

export async function fetchDashboardKPIs(projectId) {
  let q = supabase
    .from("leaseos_invoices")
    .select("total_amount, collected_amount, balance_amount, status, invoice_date");
  if (projectId) q = q.eq("project_id", projectId);

  const { data, error } = await q;
  if (error) throw error;

  const rows = data ?? [];
  const invoiced = rows.reduce((s, r) => s + (Number(r.total_amount) || 0), 0);
  const collected = rows.reduce((s, r) => s + (Number(r.collected_amount) || 0), 0);
  const outstanding = rows.reduce((s, r) => s + (Number(r.balance_amount) || 0), 0);
  const today = Date.now();
  const overdue60 = rows
    .filter((r) => ["Outstanding", "Overdue"].includes(r.status) &&
      Math.floor((today - new Date(r.invoice_date)) / 86_400_000) > 60)
    .reduce((s, r) => s + (Number(r.balance_amount) || 0), 0);

  const fmt = (v) =>
    v >= 10_000_000 ? `₹${(v / 10_000_000).toFixed(2)}Cr`
      : v >= 100_000 ? `₹${(v / 100_000).toFixed(1)}L`
        : `₹${v.toLocaleString("en-IN")}`;

  const pending = rows.filter((r) => ["Outstanding", "Overdue", "Partial"].includes(r.status)).length;

  return [
    { label: "Total Invoiced", value: fmt(invoiced), sub: `${rows.length} invoices raised`, trend: invoiced > 0 ? `${((collected / invoiced) * 100).toFixed(1)}% efficiency` : "No data", tone: "blue" },
    { label: "Collected", value: fmt(collected), sub: "Payments received", trend: "Current period", tone: "green" },
    { label: "Outstanding Dues", value: fmt(outstanding), sub: `${pending} invoices pending`, trend: "Live", tone: "amber" },
    { label: "Overdue >60 Days", value: fmt(overdue60), sub: "Escalation recommended", trend: overdue60 > 0 ? "Critical" : "Clear", tone: "rose" },
  ];
}

/** Uninvoiced active leases = leases with no invoice for current month */
export async function fetchUninvoicedLeases(projectId) {
  const now = new Date();
  const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const leases = await fetchLeasesByProject(projectId);

  // Get already-invoiced lease IDs for this month
  let q = supabase.from("leaseos_invoices").select("lease_id").eq("billing_month", billingMonth);
  if (projectId) q = q.eq("project_id", projectId);
  const { data: invoiced } = await q;
  const invoicedSet = new Set((invoiced ?? []).map((r) => r.lease_id));

  return leases.filter((l) => !invoicedSet.has(l.id));
}
