import React, { useState, useEffect } from "react";
import LeaseOSSidebar from "./LeaseOSSidebar";
import { fetchInvoices, fetchCompanies, fetchProjects, fetchOwnersByCompanyAndProject, fetchLeasesForInvoicing, createInvoice } from "./supabaseClient";

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm">
      <span className="text-3xl mb-2">📭</span>
      {message}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-slate-500 text-sm">
      <div style={{ width: "28px", height: "28px", border: "3px solid #e5e7eb", borderTop: "3px solid #0f2d5a", borderRadius: "50%", animation: "spin 0.8s linear infinite", marginBottom: "8px" }} />
      Loading...
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function TopBar({ setMobileOpen }) {
  return (
    <header style={{
      background: "#0f2d5a",
      borderBottom: "1px solid #1a3d70",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "12px",
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          type="button"
          style={{ border: "1px solid rgba(255,255,255,0.25)", borderRadius: "6px", padding: "6px 12px", fontSize: "13px", background: "transparent", cursor: "pointer", color: "#fff" }}
          onClick={() => setMobileOpen(true)}
        >☰</button>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#ffffff", margin: 0 }}>Invoicing</h1>
          <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", margin: 0 }}>Generate - Register - Preview</p>
        </div>
      </div>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <span style={{ borderRadius: "20px", background: "rgba(239,68,68,0.18)", padding: "4px 12px", fontSize: "12px", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.35)" }}>Live Data</span>
      </div>
    </header>
  );
}

function InvoiceTabs({ activeTab, setActiveTab }) {
  const tabs = ["Generate Invoices", "Invoice Register", "Invoice Preview"];
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setActiveTab(tab)}
          className={`rounded-md px-4 py-2 text-sm transition ${activeTab === tab
            ? "border border-blue-700 bg-white font-semibold text-slate-900 shadow-sm"
            : "border border-transparent bg-transparent font-medium text-slate-500 hover:text-slate-700"
            }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

// ─── Generate Invoices ────────────────────────────────────────────────────────
function GenerateInvoicesView({ setActiveTab, setPreviewInvoice }) {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [owners, setOwners] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [units, setUnits] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [checkedUnits, setCheckedUnits] = useState({});

  // Build last-12-months options dynamically on render so it uses the current date correctly
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    return { value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("en-IN", { month: "long", year: "numeric" }) };
  });

  useEffect(() => {
    fetchCompanies()
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoadingCompanies(false));
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      setProjects([]);
      setSelectedProject("");
      return;
    }
    setLoadingProjects(true);
    fetchProjects(selectedCompany)
      .then(setProjects)
      .catch(console.error)
      .finally(() => setLoadingProjects(false));
  }, [selectedCompany]);

  useEffect(() => {
    if (!selectedProject || !selectedCompany) {
      setOwners([]);
      setSelectedOwner("");
      return;
    }
    setLoadingOwners(true);
    fetchOwnersByCompanyAndProject(selectedCompany, selectedProject)
      .then((data) => {
        setOwners(data);
        setSelectedOwner("");
      })
      .catch(console.error)
      .finally(() => setLoadingOwners(false));
  }, [selectedProject, selectedCompany]);

  async function handleLoadUnits() {
    if (!selectedProject || !selectedOwner || !selectedMonth) {
      alert("Please select Project, Owner, and Month");
      return;
    }
    setLoadingUnits(true);
    try {
      const data = await fetchLeasesForInvoicing(selectedProject, selectedOwner);
      setUnits(data);
      const init = {};
      data.forEach((u) => (init[u.id] = true));
      setCheckedUnits(init);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUnits(false);
    }
  }

  const selected = units.filter((u) => checkedUnits[u.id]);
  const totalRent = selected.reduce((s, u) => s + (Number(u.monthly_rent) || 0), 0);
  const gst = totalRent * 0.18;

  async function handleGenerateInvoices() {
    if (selected.length === 0) {
      alert("Select at least one unit to generate an invoice.");
      return;
    }
    setGenerating(true);
    try {
      for (const u of selected) {
        const rentAmount = Number(u.monthly_rent) || 0;
        const camAmount = Number(u.cam_charges) || 0;
        const gstAmount = rentAmount * 0.18;
        const totalAmount = rentAmount + camAmount + gstAmount;

        const payload = {
          invoice_no: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          company_id: selectedCompany,
          project_id: selectedProject,
          unit_id: u.unit_id,
          lease_id: u.id,
          owner_party_id: u.party_owner_id,
          tenant_party_id: u.party_tenant_id,
          billing_month: selectedMonth,
          invoice_date: new Date().toISOString().split("T")[0],
          due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          rent_amount: rentAmount,
          cam_amount: camAmount,
          gst_amount: gstAmount,
          total_amount: totalAmount,
          balance_amount: totalAmount,
          status: "Outstanding",
          notes: `Generated for ${selectedMonth}`,
        };
        await createInvoice(payload);
      }
      alert(`Successfully generated ${selected.length} invoice(s)!`);
      // clear selection after generating
      setUnits([]);
      setCheckedUnits({});
    } catch (err) {
      console.error(err);
      alert("Failed to generate invoices. Check console for details.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="space-y-5">
      {/* Step indicators */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {[
          { n: "1", label: "Select Owner & Period", color: "bg-teal-700" },
          { n: "2", label: "Select Units", color: "bg-teal-700" },
          { n: "3", label: "Review & Generate", color: "bg-amber-500" },
        ].map((s) => (
          <span key={s.n} className="inline-flex items-center gap-2 font-medium text-slate-700">
            <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${s.color} text-xs text-white`}>{s.n}</span>
            {s.label}
          </span>
        ))}
      </div>

      {/* Step 1 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <p className="text-sm font-semibold mb-3">Step 1 — Select Company, Project, Owner &amp; Billing Period</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            disabled={loadingCompanies}
          >
            <option value="">{loadingCompanies ? "Loading companies..." : "Select Company"}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </select>

          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={!selectedCompany || loadingProjects}
          >
            <option value="">{loadingProjects ? "Loading projects..." : "Select Project"}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.project_name}</option>
            ))}
          </select>

          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
            disabled={!selectedProject || loadingOwners}
          >
            <option value="">{loadingOwners ? "Loading owners..." : "Select Owner"}</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.display_name} {o.owner_group ? `(${o.owner_group})` : ""}</option>
            ))}
          </select>

          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Select Month...</option>
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>

          <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">All Lease Types</option>
            <option>Fixed</option>
            <option>MG</option>
            <option>Revenue Share</option>
            <option>MG+RS</option>
          </select>

          <button
            type="button"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            onClick={handleLoadUnits}
          >
            Load Units
          </button>
        </div>
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Note: Revenue Share units will prompt for monthly sales figure before generation.
        </p>
      </div>

      {/* Step 2 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold">Step 2 — Select Units for Invoicing</p>
          <div className="flex gap-2">
            <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs" onClick={() => { const all = {}; units.forEach(u => all[u.id] = true); setCheckedUnits(all); }}>Select All</button>
            <button className="rounded-md border border-slate-300 px-3 py-1.5 text-xs" onClick={() => setCheckedUnits({})}>Deselect All</button>
          </div>
        </div>

        <div className="overflow-auto">
          {loadingUnits ? <LoadingSpinner /> : units.length === 0 ? (
            <EmptyState message="Load owner & period above to see available units" />
          ) : (
            <table className="w-full min-w-[1150px] text-sm">
              <thead className="bg-slate-950 text-white">
                <tr className="text-left">
                  <th className="p-3"><input type="checkbox" onChange={(e) => { const all = {}; if (e.target.checked) units.forEach(u => all[u.id] = true); setCheckedUnits(all); }} className="h-4 w-4 rounded border-slate-300" /></th>
                  <th className="p-3">Unit</th><th className="p-3">Tenant</th><th className="p-3">Area</th>
                  <th className="p-3">Lease Type</th><th className="p-3">Rate/Sqft</th>
                  <th className="p-3">Monthly Rent</th><th className="p-3">Sales (Rev Share)</th><th className="p-3">Computed Rent</th>
                </tr>
              </thead>
              <tbody>
                {units.map((row) => {
                  const tName = row.tenant?.brand_name || row.tenant?.company_name || `${row.tenant?.first_name || ""} ${row.tenant?.last_name || ""}`.trim() || "—";
                  return (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="p-3"><input type="checkbox" checked={!!checkedUnits[row.id]} onChange={(e) => setCheckedUnits((prev) => ({ ...prev, [row.id]: e.target.checked }))} className="h-4 w-4 rounded border-slate-300" /></td>
                      <td className="p-3 font-medium">{row.units?.unit_number}</td>
                      <td className="p-3">{tName}</td>
                      <td className="p-3">{row.units?.chargeable_area?.toLocaleString("en-IN")}</td>
                      <td className="p-3"><span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{row.rent_model}</span></td>
                      <td className="p-3">₹{row.units?.chargeable_area && Number(row.monthly_rent) ? (Number(row.monthly_rent) / row.units.chargeable_area).toFixed(2) : "—"}</td>
                      <td className="p-3">₹{Number(row.monthly_rent).toLocaleString("en-IN")}</td>
                      <td className="p-3">{row.rent_model?.includes("Revenue") || row.rent_model?.includes("RS") ? <input className="inline-flex w-24 rounded-md border border-slate-300 px-2 py-1 text-xs" placeholder="Enter sales" /> : "-"}</td>
                      <td className="p-3 font-medium">₹{Number(row.monthly_rent).toLocaleString("en-IN")}</td>
                    </tr>
                  );
                })}
                <tr className="font-semibold bg-slate-50">
                  <td className="p-3" colSpan={6}>Total for Selected Units ({selected.length})</td>
                  <td className="p-3">₹{totalRent.toLocaleString("en-IN")}</td>
                  <td className="p-3" />
                  <td className="p-3">₹{totalRent.toLocaleString("en-IN")}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm">Back</button>
          <button className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-900">Review Invoice →</button>
        </div>
      </div>

      {/* Step 3 */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <p className="text-sm font-semibold mb-4">Step 3 — Review &amp; Generate Invoices</p>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { label: "Units Selected", value: selected.length, color: "text-slate-900" },
            { label: "Gross Rent", value: `₹${totalRent.toLocaleString("en-IN")}`, color: "text-emerald-700" },
            { label: "GST @ 18%", value: `₹${gst.toLocaleString("en-IN")}`, color: "text-amber-700" },
            { label: "Total Invoice Value", value: `₹${(totalRent + gst).toLocaleString("en-IN")}`, color: "text-slate-900" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs text-slate-500">{kpi.label}</p>
              <p className={`mt-1 text-2xl font-semibold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Invoice Configuration</p>
            <div className="space-y-2 text-sm text-slate-700">
              <label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Send invoice via email to each tenant</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Save PDF copy to tenant account</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Generate combined ZIP download</label>
              <label className="flex items-center gap-2"><input type="checkbox" /> Mark as draft (do not post)</label>
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Billing Entity Details</p>
            <p className="text-sm text-slate-500">Loaded from company settings in Supabase.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={() => setCheckedUnits({})}>Back</button>
          <button className="rounded-lg border border-slate-300 px-4 py-2 text-sm" onClick={() => {
            if (selected.length > 0) {
              setPreviewInvoice({
                invoice_no: "DRAFT-PREVIEW",
                invoice_date: new Date().toISOString().split("T")[0],
                billing_month: selectedMonth,
                owner_name: selectedOwner,
                tenant_name: selected[0].tenant?.brand_name || selected[0].tenant?.company_name || selected[0].tenant?.first_name || "—",
                unit_no: selected[0].units?.unit_number,
                rent_amount: selected[0].monthly_rent,
                gst_amount: Number(selected[0].monthly_rent) * 0.18,
                total_amount: Number(selected[0].monthly_rent) * 1.18,
                status: "Draft",
                isDraft: true
              });
              setActiveTab("Invoice Preview");
            } else {
              alert("Select a unit first.");
            }
          }}>Preview Invoice</button>
          <button
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
            onClick={handleGenerateInvoices}
            disabled={generating || selected.length === 0}
          >
            {generating ? "Generating..." : "Generate Invoices"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ─── Invoice Register ─────────────────────────────────────────────────────────
function InvoiceRegisterView({ setActiveTab, setPreviewInvoice }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [settling, setSettling] = useState(false);

  const fetchList = () => {
    setLoading(true);
    fetchInvoices({ month: filterMonth || undefined, status: filterStatus || undefined })
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchList();
  }, [filterMonth, filterStatus]);

  const handleSettle = async (row) => {
    if (!window.confirm(`Settle invoice ${row.invoice_no} for ₹${Number(row.balance_amount).toLocaleString("en-IN")}?`)) return;
    setSettling(true);
    try {
      const { createCollection } = await import("./supabaseClient");
      const amt = Number(row.balance_amount) || 0;
      await createCollection({
        receipt_no: `REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        company_id: row.company_id,
        invoice_id: row.id,
        project_id: row.project_id,
        unit_id: row.unit_id,
        tenant_party_id: row.tenant_party_id,
        receipt_date: new Date().toISOString().split("T")[0],
        payment_mode: "NEFT",
        reference_no: `TRX-${Math.floor(Math.random() * 1000000)}`,
        amount: amt,
        net_amount: amt,
      });
      alert(`Invoice ${row.invoice_no} settled!`);
      fetchList();
    } catch (err) {
      console.error(err);
      alert("Failed to settle invoice");
    } finally {
      setSettling(false);
    }
  };

  return (
    <section className="max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Invoice Register — Rent Master</p>
        <div className="flex flex-wrap gap-2">
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">All Months</option>
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date(); d.setMonth(d.getMonth() - i);
              return <option key={i} value={`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`}>{d.toLocaleString("en-IN", { month: "long", year: "numeric" })}</option>;
            })}
          </select>
          <select className="rounded-lg border border-slate-300 px-3 py-2 text-xs sm:text-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option>Paid</option><option>Outstanding</option><option>Overdue</option><option>Partial</option>
          </select>
        </div>
      </div>

      {loading ? <LoadingSpinner /> : invoices.length === 0 ? (
        <EmptyState message="No invoices found. Generate invoices first." />
      ) : (
        <div className="max-w-full overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full min-w-full table-auto text-xs text-slate-700">
            <thead className="border-b border-gray-200 bg-gray-50 text-[11px] tracking-wide text-gray-500">
              <tr className="text-left">
                <th className="px-3 py-3">Invoice No</th><th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Unit</th><th className="px-3 py-3">Owner</th>
                <th className="px-3 py-3">Tenant</th><th className="px-3 py-3 text-right">Area</th>
                <th className="px-3 py-3 text-right">Rate</th><th className="px-3 py-3">Month</th>
                <th className="px-3 py-3 text-right">Rent</th><th className="px-3 py-3 text-right">GST</th>
                <th className="px-3 py-3 text-right">Total</th><th className="px-3 py-3 text-right">Collected</th>
                <th className="px-3 py-3 text-right">Balance</th><th className="px-2 py-3">Status</th>
                <th className="px-2 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-3 font-semibold">{row.invoice_no}</td>
                  <td className="px-3 py-3">{row.invoice_date}</td>
                  <td className="px-3 py-3">{row.unit_no}</td>
                  <td className="px-3 py-3">{row.owner_name}</td>
                  <td className="px-3 py-3">{row.tenant_name}</td>
                  <td className="px-3 py-3 text-right">{row.area_sqft}</td>
                  <td className="px-3 py-3 text-right">₹{row.rate_per_sqft}</td>
                  <td className="px-3 py-3">{row.billing_month}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">₹{Number(row.rent_amount).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">₹{Number(row.gst_amount).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap font-semibold text-slate-800">₹{Number(row.total_amount).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap text-green-600">₹{Number(row.collected_amount).toLocaleString("en-IN")}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap text-red-600">₹{Number(row.balance_amount).toLocaleString("en-IN")}</td>
                  <td className="px-2 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${row.status === "Paid" ? "bg-green-100 text-green-600"
                      : row.status === "Outstanding" ? "bg-blue-100 text-blue-600"
                        : row.status === "Overdue" ? "bg-red-100 text-red-600"
                          : "bg-orange-100 text-orange-600"
                      }`}>{row.status}</span>
                  </td>
                  <td className="px-2 py-3 flex gap-2">
                    <button
                      onClick={() => {
                        setPreviewInvoice(row);
                        setActiveTab("Invoice Preview");
                      }}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >View</button>
                    {row.status === "Paid" ? null : (
                      <button
                        disabled={settling}
                        onClick={() => handleSettle(row)}
                        className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                      >Settle</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Invoice Preview ──────────────────────────────────────────────────────────
function InvoicePreviewView({ invoice, setActiveTab }) {
  if (!invoice) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <EmptyState message="Select an invoice from the register to preview it here" />
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm max-w-4xl mx-auto">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">INVOICE</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">{invoice.invoice_no}</p>
          <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${invoice.status === 'Paid' ? 'bg-green-100 text-green-700' : invoice.isDraft ? 'bg-slate-100 text-slate-700' : 'bg-rose-100 text-rose-700'}`}>
            {invoice.status}
          </span>
        </div>
        <div className="flex gap-2">
          <button className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium" onClick={() => window.print()}>Download PDF</button>
          {!invoice.isDraft && <button className="rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Send Email</button>}
          <button className="rounded-md border border-slate-300 px-3 py-2 text-xs font-medium" onClick={() => setActiveTab("Invoice Register")}>Close</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 border-t border-b border-slate-100 py-6 mb-8 text-sm">
        <div>
          <p className="font-semibold text-slate-900 mb-2">Billed To:</p>
          <p className="text-slate-700">{invoice.tenant_name}</p>
          <p className="text-slate-500 mt-1">Unit: <span className="font-medium text-slate-700">{invoice.unit_no}</span></p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-slate-900 mb-2">Billing Details:</p>
          <p className="text-slate-500">Date: <span className="font-medium text-slate-700">{invoice.invoice_date}</span></p>
          <p className="text-slate-500">Month: <span className="font-medium text-slate-700">{invoice.billing_month}</span></p>
          <p className="text-slate-500">Owner: <span className="font-medium text-slate-700">{invoice.owner_name}</span></p>
        </div>
      </div>

      <table className="w-full text-sm mb-8">
        <thead className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="p-3">Description</th>
            <th className="p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="p-3 py-4 text-slate-700">Rent for {invoice.billing_month}</td>
            <td className="p-3 py-4 text-right font-medium text-slate-900">₹{Number(invoice.rent_amount).toLocaleString("en-IN")}</td>
          </tr>
          <tr>
            <td className="p-3 py-4 text-slate-700">GST (18%)</td>
            <td className="p-3 py-4 text-right font-medium text-slate-900">₹{Number(invoice.gst_amount).toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
        <tfoot className="border-t-2 border-slate-200 font-bold">
          <tr>
            <td className="p-3 text-right text-slate-900">Total</td>
            <td className="p-3 text-right text-lg text-slate-900">₹{Number(invoice.total_amount).toLocaleString("en-IN")}</td>
          </tr>
        </tfoot>
      </table>

      {!invoice.isDraft && (
        <div className="text-xs text-slate-500 border-t border-slate-100 pt-6">
          <p>Please pay within 7 days of the invoice date.</p>
          <p className="mt-1">This is a computer-generated document. No signature is required.</p>
        </div>
      )}
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function LeaseOSInvoicingUI({ onNavigate }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Generate Invoices");
  const [previewInvoice, setPreviewInvoice] = useState(null);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex" }}>
      <LeaseOSSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} currentPage="Invoicing" onNavigate={onNavigate} />
      <main className="flex-1 lg:ml-72" style={{ minWidth: 0 }}>
        <TopBar setMobileOpen={setMobileOpen} />
        <div style={{ padding: "20px 24px" }}>
          <InvoiceTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <div style={{ marginTop: "20px" }}>
            {activeTab === "Generate Invoices" && <GenerateInvoicesView setActiveTab={setActiveTab} setPreviewInvoice={setPreviewInvoice} />}
            {activeTab === "Invoice Register" && <InvoiceRegisterView setActiveTab={setActiveTab} setPreviewInvoice={setPreviewInvoice} />}
            {activeTab === "Invoice Preview" && <InvoicePreviewView invoice={previewInvoice} setActiveTab={setActiveTab} />}
          </div>
        </div>
      </main>
    </div>
  );
}
