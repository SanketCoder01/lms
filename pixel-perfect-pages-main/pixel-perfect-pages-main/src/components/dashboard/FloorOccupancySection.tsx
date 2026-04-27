const floors = [
  {
    code: "GF", codeBg: "bg-[#e8a830]", name: "Ground Floor",
    units: 52, totalSqft: "3,60,000 sqft", rentTotal: "₹5.77 Cr/mo total", avgSf: "₹192/sf",
    leased: 43, leasedSqft: "2,95,200 sf", leasedPct: 82,
    vacant: 9, vacantSqft: "64,800 sf",
    barLeased: "bg-[#1e3a5f]", barVacant: "bg-[#e8a830]", leasedWidth: "82%"
  },
  {
    code: "FF", codeBg: "bg-[#e8a830]", name: "First Floor",
    units: 48, totalSqft: "3,20,000 sqft", rentTotal: "₹4.18 Cr/mo total", avgSf: "₹168/sf",
    leased: 38, leasedSqft: "2,52,800 sf", leasedPct: 79,
    vacant: 10, vacantSqft: "67,200 sf",
    barLeased: "bg-[#1a5c2a]", barVacant: "bg-[#e8a830]", leasedWidth: "79%"
  },
  {
    code: "SF", codeBg: "bg-[#e8a830]", name: "Second Floor",
    units: 46, totalSqft: "3,04,000 sqft", rentTotal: "₹3.36 Cr/mo total", avgSf: "₹148/sf",
    leased: 34, leasedSqft: "2,24,960 sf", leasedPct: 74,
    vacant: 12, vacantSqft: "79,040 sf",
    barLeased: "bg-[#6a5acd]", barVacant: "bg-[#e8a830]", leasedWidth: "74%"
  },
  {
    code: "TF", codeBg: "bg-[#e8a830]", name: "Top Floor",
    units: 40, totalSqft: "3,08,000 sqft", rentTotal: "₹3.21 Cr/mo total", avgSf: "₹138/sf",
    leased: 27, leasedSqft: "2,06,360 sf", leasedPct: 67,
    vacant: 13, vacantSqft: "1,01,640 sf",
    barLeased: "bg-[#1a5c2a]", barVacant: "bg-[#e8a830]", leasedWidth: "67%"
  },
];

const summaryRates = [
  { floor: "GF avg/sf", rate: "₹192", color: "text-foreground" },
  { floor: "FF avg/sf", rate: "₹168", color: "text-foreground" },
  { floor: "SF avg/sf", rate: "₹148", color: "text-[#e8a830]" },
  { floor: "TF avg/sf", rate: "₹138", color: "text-[#c0392b]" },
];

export const FloorOccupancySection = () => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-0.5">Floor-wise occupancy & rent</h3>
      <p className="text-xs text-muted-foreground mb-4">Units, area, occupancy & avg fixed rent achieved per floor</p>

      {/* Column headers */}
      <div className="grid grid-cols-[40px_1fr_auto] gap-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3 pb-1 border-b">
        <span>FL.</span>
        <span>Occupancy by Area</span>
        <div className="flex gap-8">
          <span>Leased Vacant</span>
          <span>Avg ₹/SF</span>
        </div>
      </div>

      {/* Floor rows */}
      <div className="space-y-5">
        {floors.map((f) => (
          <div key={f.code}>
            <div className="flex items-start gap-3">
              {/* Floor code badge */}
              <div className={`w-9 h-9 rounded-md flex items-center justify-center text-white text-xs font-bold shrink-0 ${f.codeBg}`}>
                {f.code}
              </div>

              {/* Details */}
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.units} units · {f.totalSqft}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#c0392b]">{f.avgSf}</p>
                    <p className="text-xs text-muted-foreground">{f.rentTotal}</p>
                  </div>
                </div>

                {/* Occupancy bar */}
                <div className="flex h-3 rounded-full overflow-hidden mt-2">
                  <div className={f.barLeased} style={{ width: f.leasedWidth }} />
                  <div className={`${f.barVacant} flex-1`} />
                </div>

                {/* Leased / Vacant labels */}
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[#1a5c2a]">
                    {f.leased} units leased · {f.leasedSqft} ({f.leasedPct}%)
                  </span>
                  <span className="text-[10px] text-[#e8a830]">
                    {f.vacant} vacant · {f.vacantSqft}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floor Summary */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="text-xs font-bold uppercase tracking-wide text-center text-foreground mb-3">Floor Summary</h4>
        <div className="grid grid-cols-4 gap-4 text-center">
          {summaryRates.map((s) => (
            <div key={s.floor}>
              <p className={`text-xl font-bold ${s.color}`}>{s.rate}</p>
              <p className="text-[10px] text-muted-foreground">{s.floor}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Typical for enclosed malls — GF commands 39% premium over TF. Top floor occupancy (67%) is the weakest link.
        </p>
      </div>

      <div className="mt-4 text-center">
        <a href="#" className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
          Full floor report <span className="text-xs">↗</span>
        </a>
      </div>
    </div>
  );
};
