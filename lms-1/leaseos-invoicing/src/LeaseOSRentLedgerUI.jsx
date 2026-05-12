import React, { useState, useEffect } from "react";
import LeaseOSSidebar from "./LeaseOSSidebar";
import {
  fetchAgingSummary,
  fetchAgingRows,
  fetchTenantStatement,
  fetchOwnerReport,
  fetchActiveTenantParties,
} from "./supabaseClient";

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-sm">
      <span className="text-3xl mb-2">📭</span>
      {message}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-sm">
      <div style={{ width: "28px", height: "28px", border: "3px solid #e5e7eb", borderTop: "3px solid #0f2d5a", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "8px" }} />
      Loading...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Header({ setMobileOpen }) {
  return (
    <header style={{
      background: "#0f2d5a",
      borderBottom: "1px solid #1a3d70",
      padding: "16px 24px",
    }}>
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="lg:hidden rounded-lg px-3 py-1.5 text-sm"
            style={{ border: "1px solid rgba(255,255,255,0.25)", background: "transparent", color: "#fff" }}
            onClick={() => setMobileOpen(true)}
          >Menu</button>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#ffffff", margin: 0 }}>Rent Ledger</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)", margin: 0 }}>Aging - Statements - Owner Reports</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span style={{ borderRadius: "20px", background: "rgba(239,68,68,0.18)", padding: "4px 12px", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.35)" }}>Live Data</span>
        </div>
      </div>
    </header>
  );
}

function tabClass(active) {
  return active
    ? "rounded-md border border-blue-700 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm"
    : "rounded-md border border-transparent bg-transparent px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700";
}

// ─── Aging View ───────────────────────────────────────────────────────────────
function AgingView() {
  const [summary, setSummary] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchAgingSummary(), fetchAgingRows()])
      .then(([s, r]) => { setSummary(s); setRows(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toneCard = (tone) => {
    if (tone === "teal") return "border-teal-400 text-teal-800";
    if (tone === "amber") return "border-amber-400 text-amber-800";
    if (tone === "orange") return "border-orange-400 text-orange-800";
    return "border-rose-400 text-rose-800";
  };

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          <div className="col-span-4 rounded-xl border border-slate-200 bg-white p-6"><LoadingSpinner /></div>
        ) : summary.length === 0 ? (
          <div className="col-span-4 rounded-xl border border-slate-200 bg-white p-6"><EmptyState message="No aging data available" /></div>
        ) : (
          summary.map((card) => (
            <article key={card.label} className={`rounded-xl border-2 bg-white p-4 ${toneCard(card.tone)}`}>
              <p className="text-[11px] uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-1 text-4xl font-semibold text-slate-900">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500">{card.meta}</p>
            </article>
          ))
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 sm:px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-semibold">Debtors Aging — Detailed Report</p>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium">Export Excel</button>
        </div>
        <div className="px-4 sm:px-5 py-4 overflow-auto">
          {loading ? <LoadingSpinner /> : rows.length === 0 ? (
            <EmptyState message="No outstanding debtors 🎉" />
          ) : (
            <table className="w-full min-w-[1100px] text-sm">
              <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                <tr className="text-left">
                  <th className="py-2">Tenant</th><th className="py-2">Unit</th>
                  <th className="py-2">Total Outstanding</th><th className="py-2">0-30 Days</th>
                  <th className="py-2">31-60 Days</th><th className="py-2">61-90 Days</th>
                  <th className="py-2">&gt; 90 Days</th><th className="py-2">Aging Bar</th><th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.tenant + row.unit} className="border-b border-slate-100">
                    <td className="py-2.5 font-medium">{row.tenant}</td>
                    <td className="py-2.5">{row.unit}</td>
                    <td className="py-2.5 font-semibold">₹{row.total}</td>
                    <td className="py-2.5 text-emerald-700">{row.d0 === "-" ? "-" : `₹${row.d0}`}</td>
                    <td className="py-2.5 text-amber-700">{row.d31 === "-" ? "-" : `₹${row.d31}`}</td>
                    <td className="py-2.5">{row.d61 === "-" ? "-" : `₹${row.d61}`}</td>
                    <td className="py-2.5 text-rose-700">{row.d90 === "-" ? "-" : `₹${row.d90}`}</td>
                    <td className="py-2.5">
                      <div className={`h-3 w-32 rounded-full ${row.bar === "rose" ? "bg-rose-600" : row.bar === "orange" ? "bg-orange-500" : row.bar === "amber" ? "bg-amber-500" : "bg-teal-600"}`} />
                    </td>
                    <td className="py-2.5">
                      <button className="rounded-full bg-teal-600 px-3 py-1 text-xs font-semibold text-white">Settle</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Tenant Statement View ────────────────────────────────────────────────────
function TenantStatementView() {
  const [tenants, setTenants] = useState([]);
  const [selectedKey, setSelectedKey] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTenants, setLoadingTenants] = useState(true);

  useEffect(() => {
    fetchActiveTenantParties()
      .then(setTenants)
      .catch(console.error)
      .finally(() => setLoadingTenants(false));
  }, []);

  useEffect(() => {
    if (!selectedKey) { setRows([]); return; }
    const [tenantPartyId, unitNo] = selectedKey.split("||");
    setLoading(true);
    fetchTenantStatement(tenantPartyId)
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedKey]);

  // Compute running balance from rows
  let runningBalance = 0;
  const processedRows = rows.map((inv) => {
    runningBalance += Number(inv.total_amount) || 0;
    runningBalance -= Number(inv.collected_amount) || 0;
    return {
      date: inv.invoice_date,
      particulars: `Rent Invoice - ${inv.billing_month}`,
      invoice: inv.invoice_no,
      debit: `₹${Number(inv.total_amount).toLocaleString("en-IN")}`,
      credit: inv.collected_amount > 0 ? `₹${Number(inv.collected_amount).toLocaleString("en-IN")}` : "—",
      balance: `₹${runningBalance.toLocaleString("en-IN")}`,
      remarks: inv.lease_type || "—",
    };
  });

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Tenant Ledger Statement</p>
        <div className="flex gap-2">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            disabled={loadingTenants}
          >
            <option value="">{loadingTenants ? "Loading..." : "Select Tenant - Unit..."}</option>
            {tenants.map((t, i) => (
              <option key={i} value={`${t.id}||${t.unit_no}`}>{t.display_name} — {t.unit_no}</option>
            ))}
          </select>
          <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">PDF</button>
        </div>
      </div>
      <div className="px-4 sm:px-5 py-4 overflow-auto">
        {loading ? <LoadingSpinner /> : !selectedKey ? (
          <EmptyState message="Select a tenant above to view their ledger statement" />
        ) : processedRows.length === 0 ? (
          <EmptyState message="No ledger entries found for this tenant" />
        ) : (
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
              <tr className="text-left">
                <th className="py-2">Date</th><th className="py-2">Particulars</th>
                <th className="py-2">Invoice No</th><th className="py-2">Debit</th>
                <th className="py-2">Credit</th><th className="py-2">Balance</th><th className="py-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {processedRows.map((row, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-2.5">{row.date}</td>
                  <td className="py-2.5">{row.particulars}</td>
                  <td className="py-2.5">{row.invoice}</td>
                  <td className="py-2.5">{row.debit}</td>
                  <td className="py-2.5 text-emerald-700">{row.credit}</td>
                  <td className={`py-2.5 font-medium ${runningBalance > 0 ? "text-rose-700" : "text-emerald-700"}`}>{row.balance}</td>
                  <td className="py-2.5">{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

// ─── Owner Report View ────────────────────────────────────────────────────────
function OwnerReportView() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }) };
  });

  useEffect(() => {
    setLoading(true);
    fetchOwnerReport(selectedMonth || undefined)
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMonth]);

  const totals = rows.reduce((acc, r) => {
    acc.invoiced += Number(r.invoiced.replace(/,/g, "")) || 0;
    acc.collected += Number(r.collected.replace(/,/g, "")) || 0;
    acc.outstanding += Number(r.outstanding.replace(/,/g, "")) || 0;
    return acc;
  }, { invoiced: 0, collected: 0, outstanding: 0 });

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 sm:px-5 py-4 flex items-center justify-between">
        <p className="text-sm font-semibold">Owner-wise Collection &amp; Distribution Report</p>
        <select
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="">All Periods</option>
          {monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>
      <div className="px-4 sm:px-5 py-4 overflow-auto">
        {loading ? <LoadingSpinner /> : rows.length === 0 ? (
          <EmptyState message="No owner report data available for selected period" />
        ) : (
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
              <tr className="text-left">
                <th className="py-2">Owner</th><th className="py-2">Category</th>
                <th className="py-2">Units</th><th className="py-2">Total Invoiced</th>
                <th className="py-2">Collected</th><th className="py-2">Outstanding</th><th className="py-2">Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.owner} className="border-b border-slate-100">
                  <td className="py-2.5 font-medium">{row.owner}</td>
                  <td className="py-2.5"><span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">{row.category}</span></td>
                  <td className="py-2.5">{row.units}</td>
                  <td className="py-2.5">₹{row.invoiced}</td>
                  <td className="py-2.5 text-emerald-700">₹{row.collected}</td>
                  <td className="py-2.5 text-rose-700">₹{row.outstanding}</td>
                  <td className="py-2.5"><span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">{row.efficiency}</span></td>
                </tr>
              ))}
              <tr className="font-semibold border-t-2 border-slate-300">
                <td className="py-2.5">TOTAL</td><td /><td />
                <td className="py-2.5">₹{totals.invoiced.toLocaleString("en-IN")}</td>
                <td className="py-2.5 text-emerald-700">₹{totals.collected.toLocaleString("en-IN")}</td>
                <td className="py-2.5 text-rose-700">₹{totals.outstanding.toLocaleString("en-IN")}</td>
                <td className="py-2.5">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700">
                    {totals.invoiced > 0 ? `${((totals.collected / totals.invoiced) * 100).toFixed(1)}%` : "—"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LeaseOSRentLedgerUI({ onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Debtors Aging");

  return (
    <div className="min-h-screen text-slate-900" style={{ background: "var(--page-bg)" }}>
      <div className="flex min-h-screen">
        <LeaseOSSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} currentPage="Rent Ledger" onNavigate={onNavigate} />
        <main className="flex-1 lg:ml-72" style={{ minWidth: 0 }}>
          <Header setMobileOpen={setMobileOpen} />
          <div className="p-4 sm:p-6 space-y-5">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              <button className={tabClass(activeTab === "Debtors Aging")} onClick={() => setActiveTab("Debtors Aging")} type="button">Debtors Aging</button>
              <button className={tabClass(activeTab === "Tenant Statement")} onClick={() => setActiveTab("Tenant Statement")} type="button">Tenant Statement</button>
              <button className={tabClass(activeTab === "Owner Report")} onClick={() => setActiveTab("Owner Report")} type="button">Owner Report</button>
            </div>

            {activeTab === "Debtors Aging" && <AgingView />}
            {activeTab === "Tenant Statement" && <TenantStatementView />}
            {activeTab === "Owner Report" && <OwnerReportView />}
          </div>
        </main>
      </div>
    </div>
  );
}
