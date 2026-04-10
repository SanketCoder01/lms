const owners = [
  { label: "External investors", color: "bg-[#1e3a5f]", units: 78, sqft: "5,42,000 sqft · 32 parties", rent: "₹74.8L/mo", avg: "₹138/sqft avg" },
  { label: "Close group / group co.", color: "bg-[#2d8a4e]", units: 46, sqft: "3,02,400 sqft · 8 entities", rent: "₹40.2L/mo", avg: "₹133/sqft avg" },
  { label: "Unsold / developer retained", color: "bg-[#e8a830]", units: 62, sqft: "4,47,600 sqft", rent: "₹48.0L/mo", avg: "₹107/sqft avg" },
];

export const OwnershipSection = () => {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <h3 className="text-sm font-semibold text-foreground">Unit sales & ownership</h3>
        <span className="text-muted-foreground text-xs cursor-pointer">ⓘ</span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">186 total units · rental by ownership category</p>

      {/* Stacked bar */}
      <div className="flex h-4 rounded overflow-hidden mb-2">
        <div className="bg-[#1e3a5f]" style={{ width: "42%" }} />
        <div className="bg-[#2d8a4e]" style={{ width: "25%" }} />
        <div className="bg-[#e8a830]" style={{ width: "33%" }} />
      </div>
      <div className="flex gap-4 text-[10px] text-muted-foreground mb-6">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#1e3a5f] inline-block" /> Other investors (42%)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#2d8a4e] inline-block" /> Close group (25%)</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#e8a830] inline-block" /> Unsold / developer (33%)</span>
      </div>

      {/* Breakdown */}
      <div className="space-y-5">
        {owners.map((o) => (
          <div key={o.label} className="flex items-start gap-3">
            <span className={`w-3 h-3 rounded-sm mt-0.5 shrink-0 ${o.color}`} />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.units} units · {o.sqft}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-foreground">{o.rent}</p>
              <p className="text-xs text-muted-foreground">{o.avg}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
