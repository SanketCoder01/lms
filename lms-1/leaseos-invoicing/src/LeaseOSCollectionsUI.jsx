import React, { useState, useEffect } from "react";
import LeaseOSSidebar from "./LeaseOSSidebar";
import { fetchActiveTenantParties, fetchOutstandingByTenant, fetchRecentCollections, createCollection } from "./supabaseClient";

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
          >
            Menu
          </button>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "#ffffff", margin: 0 }}>Collections</h1>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)", margin: 0 }}>Settle Outstanding Invoices</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span style={{ borderRadius: "20px", background: "rgba(239,68,68,0.18)", padding: "4px 12px", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.35)" }}>Live Data</span>
        </div>
      </div>
    </header>
  );
}

export default function LeaseOSCollectionsUI({ onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState("");
  const [outstandingRows, setOutstandingRows] = useState([]);
  const [recentCollections, setRecentCollections] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingOutstanding, setLoadingOutstanding] = useState(false);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [settling, setSettling] = useState(false);
  const [checkedInvoices, setCheckedInvoices] = useState({});

  // Load tenants + recent collections on mount
  const loadRecent = () => {
    setLoadingCollections(true);
    fetchRecentCollections()
      .then(setRecentCollections)
      .catch(console.error)
      .finally(() => setLoadingCollections(false));
  };

  useEffect(() => {
    fetchActiveTenantParties()
      .then(setTenants)
      .catch(console.error)
      .finally(() => setLoadingTenants(false));

    loadRecent();
  }, []);

  const loadOutstanding = () => {
    if (!selectedTenant) { setOutstandingRows([]); return; }
    setLoadingOutstanding(true);
    fetchOutstandingByTenant(selectedTenant)
      .then((rows) => {
        setOutstandingRows(rows);
        const init = {};
        rows.forEach((r) => (init[r.id] = false));
        setCheckedInvoices(init);
      })
      .catch(console.error)
      .finally(() => setLoadingOutstanding(false));
  };

  // Load outstanding invoices when tenant changes
  useEffect(() => {
    loadOutstanding();
  }, [selectedTenant]);

  // KPI summary derived from outstanding rows
  const totalDues = outstandingRows.reduce((s, r) => s + (Number(r.balance_amount) || 0), 0);
  const oldestDate = outstandingRows.length > 0
    ? Math.max(...outstandingRows.map((r) => Math.floor((Date.now() - new Date(r.invoice_date)) / 86400000)))
    : null;

  const summaryCards = [
    { label: "Selected Tenant", value: selectedTenant || "None", accent: "text-slate-900 text-base truncate" },
    { label: "Outstanding Invoices", value: outstandingRows.length || "—", accent: "text-rose-600" },
    { label: "Total Dues", value: totalDues > 0 ? `₹${totalDues.toLocaleString("en-IN")}` : "—", accent: "text-rose-700" },
    { label: "Oldest Invoice", value: oldestDate ? `${oldestDate}d` : "—", accent: "text-amber-700" },
  ];

  const selectedInvoices = outstandingRows.filter((r) => checkedInvoices[r.id]);
  const selectedAmount = selectedInvoices.reduce((s, r) => s + (Number(r.balance_amount) || 0), 0);

  async function handleSettle() {
    if (selectedInvoices.length === 0) return;
    setSettling(true);
    try {
      for (const inv of selectedInvoices) {
        const amt = Number(inv.balance_amount) || 0;
        await createCollection({
          receipt_no: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          company_id: inv.company_id, // ensure company isolation
          invoice_id: inv.id,
          project_id: inv.project_id,
          unit_id: inv.unit_id,
          tenant_party_id: selectedTenant,
          receipt_date: new Date().toISOString().split("T")[0],
          payment_mode: "NEFT",
          reference_no: `TRX-${Math.floor(Math.random() * 1000000)}`,
          amount: amt,
          net_amount: amt,
        });
      }
      alert(`Successfully settled ${selectedInvoices.length} invoice(s)!`);
      loadOutstanding();
      loadRecent();
    } catch (err) {
      console.error(err);
      alert("Failed to settle invoices. Check console.");
    } finally {
      setSettling(false);
    }
  }

  // Calculate age in days
  const ageInDays = (dateStr) => Math.floor((Date.now() - new Date(dateStr)) / 86400000);

  return (
    <div className="min-h-screen text-slate-900" style={{ background: "var(--page-bg)" }}>
      <div className="flex min-h-screen">
        <LeaseOSSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} currentPage="Collections" onNavigate={onNavigate} />
        <main className="flex-1 lg:ml-72" style={{ minWidth: 0 }}>
          <Header setMobileOpen={setMobileOpen} />

          <div className="p-4 sm:p-6 space-y-5">
            {/* KPI Cards */}
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {summaryCards.map((card) => (
                <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className={`mt-2 text-3xl font-semibold ${card.accent}`}>{card.value}</p>
                </article>
              ))}
            </section>

            {/* Outstanding Invoices */}
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Collections — Settle Outstanding Invoices</p>
                  <p className="text-xs text-slate-500 mt-1">Select a tenant then tick invoices to settle.</p>
                </div>
                <div className="flex gap-2">
                  <select
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={selectedTenant}
                    onChange={(e) => setSelectedTenant(e.target.value)}
                    disabled={loadingTenants}
                  >
                    <option value="">{loadingTenants ? "Loading..." : "Select Tenant..."}</option>
                    {tenants.map((t, i) => (
                      <option key={i} value={t.id}>{t.display_name} ({t.unit_no})</option>
                    ))}
                  </select>
                  <button className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Auto Adjust</button>
                </div>
              </div>

              <div className="px-4 sm:px-5 py-4">
                {loadingOutstanding ? <LoadingSpinner /> : !selectedTenant ? (
                  <EmptyState message="Select a tenant above to view outstanding invoices" />
                ) : outstandingRows.length === 0 ? (
                  <EmptyState message="No outstanding invoices for this tenant 🎉" />
                ) : (
                  <>
                    <div className="overflow-auto">
                      <table className="w-full min-w-[980px] text-sm">
                        <thead className="bg-slate-950 text-white text-xs uppercase tracking-wide">
                          <tr className="text-left">
                            <th className="p-3"> </th>
                            <th className="p-3">Invoice No</th><th className="p-3">Date</th>
                            <th className="p-3">Period</th><th className="p-3">Invoice Amt</th>
                            <th className="p-3">Already Paid</th><th className="p-3">Balance Due</th>
                            <th className="p-3">Age (Days)</th><th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outstandingRows.map((row) => (
                            <tr key={row.id} className="border-b border-slate-100">
                              <td className="p-3">
                                <input
                                  type="checkbox"
                                  checked={!!checkedInvoices[row.id]}
                                  onChange={(e) => setCheckedInvoices((prev) => ({ ...prev, [row.id]: e.target.checked }))}
                                  className="h-4 w-4 rounded border-slate-300"
                                />
                              </td>
                              <td className="p-3 font-medium">{row.invoice_no}</td>
                              <td className="p-3">{row.invoice_date}</td>
                              <td className="p-3">{row.billing_month}</td>
                              <td className="p-3">₹{Number(row.total_amount).toLocaleString("en-IN")}</td>
                              <td className="p-3 text-emerald-700">₹{Number(row.collected_amount).toLocaleString("en-IN")}</td>
                              <td className="p-3 text-rose-700">₹{Number(row.balance_amount).toLocaleString("en-IN")}</td>
                              <td className="p-3">
                                <span className={`rounded-full px-2 py-0.5 text-xs ${ageInDays(row.invoice_date) > 60 ? "bg-red-100 text-red-700" : ageInDays(row.invoice_date) > 30 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                                  {ageInDays(row.invoice_date)}d
                                </span>
                              </td>
                              <td className="p-3">
                                <span className={`rounded-full px-2 py-0.5 text-xs ${row.status === "Overdue" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm">
                        Selected: <span className="font-semibold text-blue-700">{selectedInvoices.length} Invoice{selectedInvoices.length !== 1 ? "s" : ""}</span>
                        {selectedAmount > 0 && <> &bull; Amount: <span className="font-semibold text-teal-700">₹{selectedAmount.toLocaleString("en-IN")}</span></>}
                      </p>
                      <div className="flex gap-2">
                        <button
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
                          onClick={() => {
                            const all = {};
                            outstandingRows.forEach((r) => (all[r.id] = true));
                            setCheckedInvoices(all);
                          }}
                        >Select All Outstanding</button>
                        <button
                          className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
                          disabled={settling || selectedInvoices.length === 0}
                          onClick={handleSettle}
                        >
                          {settling ? "Settling..." : "Settle Selected →"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Recent Collections */}
            <section className="rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 sm:px-5 py-4 flex items-center justify-between">
                <p className="text-sm font-semibold">Recent Collections — All Tenants</p>
                <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-500">Last 30 Days</span>
              </div>
              <div className="px-4 sm:px-5 py-4 overflow-auto">
                {loadingCollections ? <LoadingSpinner /> : recentCollections.length === 0 ? (
                  <EmptyState message="No collections recorded in the last 30 days" />
                ) : (
                  <table className="w-full min-w-[1080px] text-sm">
                    <thead className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                      <tr className="text-left">
                        <th className="py-2">Receipt No</th><th className="py-2">Date</th>
                        <th className="py-2">Tenant</th><th className="py-2">Unit</th>
                        <th className="py-2">Invoice Ref</th><th className="py-2">Mode</th>
                        <th className="py-2">Ref No</th><th className="py-2">Amount</th>
                        <th className="py-2">TDS</th><th className="py-2">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCollections.map((row) => (
                        <tr key={row.id} className="border-b border-slate-100">
                          <td className="py-2.5">{row.receipt_no}</td>
                          <td className="py-2.5">{row.receipt_date}</td>
                          <td className="py-2.5 font-medium">{row.tenant_name}</td>
                          <td className="py-2.5">{row.unit_no}</td>
                          <td className="py-2.5">{row.invoice_ref}</td>
                          <td className="py-2.5"><span className="rounded-full bg-indigo-100 text-indigo-700 px-2 py-0.5 text-xs">{row.payment_mode}</span></td>
                          <td className="py-2.5">{row.reference_no}</td>
                          <td className="py-2.5">₹{Number(row.amount).toLocaleString("en-IN")}</td>
                          <td className="py-2.5">{row.tds_amount ? `₹${Number(row.tds_amount).toLocaleString("en-IN")}` : "—"}</td>
                          <td className="py-2.5 text-emerald-700">₹{Number(row.net_amount).toLocaleString("en-IN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
