import React from "react";

const menuItems = [
  { label: "Dashboard", icon: "⊞" },
  { label: "Invoicing", icon: "📄" },
  { label: "Collections", icon: "💰" },
  { label: "Rent Ledger", icon: "📒" },
];

export default function LeaseOSSidebar({ mobileOpen, setMobileOpen, currentPage, onNavigate }) {
  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 lg:hidden ${mobileOpen ? "block" : "hidden"}`}
        onClick={() => setMobileOpen(false)}
      />
      {/* Sidebar — always 288px (w-72) wide */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-72 shrink-0 bg-white text-slate-900 transform transition-transform duration-200 flex flex-col overflow-hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        style={{ borderRight: "1px solid var(--surface-border)" }}
      >
        <div className="px-5 py-6" style={{ borderBottom: "1px solid var(--surface-border)" }}>
          <p className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>LeaseOS</p>
          <p className="text-xs text-slate-500 mt-1">Invoicing &amp; Collections</p>
        </div>

        <nav className="flex-1 px-3 py-4">
          <p className="px-2 text-[10px] uppercase tracking-[0.18em] text-slate-500">Menu</p>
          <div className="mt-2 space-y-3">
            {menuItems.map((item) => {
              const active = item.label === currentPage;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    onNavigate(item.label);
                    setMobileOpen(false);
                  }}
                  className={`w-full text-left rounded-2xl px-4 py-3 text-sm transition ${active ? "bg-slate-100 text-slate-900 border border-slate-200" : "hover:bg-slate-100 text-slate-700"
                    }`}
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <span style={{ fontSize: "16px", opacity: 0.8 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mt-auto w-full px-5 py-4" style={{ borderTop: "1px solid var(--surface-border)" }}>
          <p className="text-xs text-slate-500">LeaseOS Platform</p>
        </div>
      </aside>
    </>
  );
}
