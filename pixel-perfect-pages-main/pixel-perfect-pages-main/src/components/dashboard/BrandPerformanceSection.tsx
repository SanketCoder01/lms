const brands = [
  { name: "Shoppers Stop", target: "₹4.2 Cr/mo", actual: "₹4.7Cr", pct: 112, barColor: "bg-[#1a5c2a]", barWidth: "100%" },
  { name: "H&M India", target: "₹2.8 Cr/mo", actual: "₹2.69Cr", pct: 96, barColor: "bg-[#1e3a5f]", barWidth: "86%" },
  { name: "McDonald's", target: "₹85L/mo", actual: "₹88L", pct: 104, barColor: "bg-[#1a5c2a]", barWidth: "93%" },
  { name: "Lifestyle", target: "₹1.8 Cr/mo", actual: "₹1.28Cr", pct: 71, barColor: "bg-[#c0392b]", barWidth: "63%" },
  { name: "Nykaa", target: "₹62L/mo", actual: "₹54.6L", pct: 88, barColor: "bg-[#1e3a5f]", barWidth: "79%" },
  { name: "Fabindia", target: "3-month avg (new lease)", actual: "₹38L", pct: 81, barColor: "bg-[#1a5c2a]", barWidth: "72%", isNew: true },
  { name: "Zara", target: "₹1.1 Cr/mo", actual: "₹1.30Cr", pct: 118, barColor: "bg-[#1a5c2a]", barWidth: "100%" },
  { name: "CCD", target: "₹28L/mo", actual: "₹17.4L", pct: 62, barColor: "bg-[#c0392b]", barWidth: "55%" },
];

export const BrandPerformanceSection = () => {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <h3 className="text-sm font-semibold text-foreground">Brand sales performance</h3>
        <span className="text-muted-foreground text-xs cursor-pointer">ⓘ</span>
      </div>
      <p className="text-xs text-muted-foreground mb-5">Avg monthly sales vs lease target · last 6 months (or since commencement)</p>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div>
          <p className="text-xs text-muted-foreground">Outperforming</p>
          <p className="text-2xl font-bold text-[#1a5c2a]">14</p>
          <p className="text-[10px] text-muted-foreground">brands ≥100%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">On track</p>
          <p className="text-2xl font-bold text-[#1e3a5f]">18</p>
          <p className="text-[10px] text-muted-foreground">80–99%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Under review</p>
          <p className="text-2xl font-bold text-[#c0392b]">10</p>
          <p className="text-[10px] text-muted-foreground">brands &lt;80%</p>
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[100px_1fr_80px_50px] gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-1 border-b">
        <span>Brand</span>
        <span>Actual vs Target</span>
        <span className="text-right">Actual</span>
        <span className="text-right">%</span>
      </div>

      {/* Rows */}
      <div className="space-y-4">
        {brands.map((b) => (
          <div key={b.name} className="grid grid-cols-[100px_1fr_80px_50px] gap-2 items-center">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-foreground">{b.name}</span>
              {b.isNew && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">New</span>}
            </div>
            <div>
              <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`absolute inset-y-0 left-0 rounded-full ${b.barColor}`} style={{ width: b.barWidth }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Target: {b.target}</p>
            </div>
            <span className="text-sm font-semibold text-foreground text-right">{b.actual}</span>
            <span className={`text-sm font-semibold text-right ${b.pct >= 100 ? "text-[#1a5c2a]" : b.pct >= 80 ? "text-foreground" : "text-[#c0392b]"}`}>{b.pct}%</span>
          </div>
        ))}
      </div>

      {/* Warning callout */}
      <div className="mt-5 bg-yellow-50 border border-yellow-200 rounded-md p-3">
        <p className="text-xs text-yellow-800">
          Lifestyle & CCD are significantly underperforming. Consider lease revision or exit triggers as per agreement terms.
        </p>
      </div>

      <div className="mt-4 text-center">
        <a href="#" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
          Full brand analysis <span className="text-xs">↗</span>
        </a>
      </div>
    </div>
  );
};
