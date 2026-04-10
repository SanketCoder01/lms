const categories = [
  { dot: "bg-[#1e3a5f]", label: "Fixed rent — lock-in", units: 68, area: "4,72,000", type: "Fixed", typeColor: "bg-blue-100 text-blue-700" },
  { dot: "bg-[#4a8ab5]", label: "Fixed rent — post lock-in", units: 40, area: "2,78,000", type: "Fixed", typeColor: "bg-blue-100 text-blue-700" },
  { dot: "bg-[#1a8a5a]", label: "MG rent — lock-in", units: 22, area: "1,54,400", type: "Fixed", typeColor: "bg-blue-100 text-blue-700" },
  { dot: "bg-[#3cc48a]", label: "MG rent — post lock-in", units: 12, area: "84,000", type: "Fixed", typeColor: "bg-blue-100 text-blue-700" },
  { dot: "bg-[#b8860b]", label: "Rev. share — lock-in", units: 18, area: "1,26,400", type: "Variable", typeColor: "bg-orange-100 text-orange-700" },
  { dot: "bg-[#e8a830]", label: "Rev. share — post lock-in", units: 16, area: "1,12,000", type: "Variable", typeColor: "bg-orange-100 text-orange-700" },
];

export const RentalProjectionTable = () => {
  return (
    <div>
      <h3 className="text-xs font-bold tracking-wide uppercase text-foreground mb-4">By Units & Area (SQFT)</h3>

      {/* Header */}
      <div className="grid grid-cols-[1fr_60px_90px_70px] gap-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 pb-1 border-b">
        <span>Rental Category</span>
        <span className="text-right">Units</span>
        <span className="text-right">Area (SQFT)</span>
        <span className="text-center">Type</span>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {categories.map((c) => (
          <div key={c.label} className="grid grid-cols-[1fr_60px_90px_70px] gap-2 items-center">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
              <span className="text-sm text-foreground">{c.label}</span>
            </div>
            <span className="text-sm text-foreground text-right">{c.units}</span>
            <span className="text-sm text-foreground text-right">{c.area}</span>
            <span className="flex justify-center">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${c.typeColor}`}>{c.type}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-2 border-t">
        <div className="grid grid-cols-[1fr_60px_90px_70px] gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground">Total leased</span>
          <span className="text-sm font-semibold text-foreground text-right" />
          <span className="text-sm font-semibold text-foreground text-right" />
          <span />
        </div>
        <p className="text-xs text-muted-foreground mt-1">142 units · 9,84,800 sqft</p>
      </div>
    </div>
  );
};
