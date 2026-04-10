const kpis = [
  {
    label: "TOTAL UNITS",
    value: "186",
    sub: "12,92,000 sqft total area",
    badges: [
      { label: "GF: 52", color: "bg-nav text-nav-foreground" },
      { label: "FF: 48", color: "bg-nav text-nav-foreground" },
      { label: "SF: 46", color: "bg-nav text-nav-foreground" },
      { label: "TF: 40", color: "bg-nav text-nav-foreground" },
    ],
    progress: null,
    valueColor: "text-foreground",
  },
  {
    label: "LEASED UNITS",
    value: "142",
    sub: "9,84,800 sqft leased",
    badges: null,
    progress: { value: 76.2, label: "76.2% of total area", color: "bg-info" },
    valueColor: "text-info",
  },
  {
    label: "VACANT UNITS",
    value: "44",
    sub: "3,07,200 sqft vacant",
    badges: null,
    progress: { value: 23.8, label: "23.8% of total area", color: "bg-warning" },
    valueColor: "text-primary",
  },
  {
    label: "TOTAL PROJECTD RENT",
    value: "₹2.14",
    valueSuffix: " Cr/mo",
    sub: "Projected at full occupancy",
    badges: null,
    progress: { value: 100, label: "₹165/sqft avg", color: "bg-success" },
    valueColor: "text-foreground",
  },
  {
    label: "ACTUAL RENT",
    value: "₹1.63",
    valueSuffix: " Cr/mo",
    sub: "→ ₹51L opportunity loss",
    badges: null,
    progress: { value: 76, label: "76% of projection", color: "bg-destructive" },
    valueColor: "text-foreground",
    subExtra: true,
  },
];

const KPICards = () => {
  return (
    <div className="grid grid-cols-5 gap-4">
      {kpis.map((kpi, i) => (
        <div key={i} className="border border-border rounded-lg p-4 bg-card">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">{kpi.label}</p>
          <p className={`text-3xl font-bold ${kpi.valueColor}`}>
            {kpi.value}
            {kpi.valueSuffix && <span className="text-base font-medium text-muted-foreground">{kpi.valueSuffix}</span>}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>

          {kpi.badges && (
            <div className="flex gap-1.5 mt-3">
              {kpi.badges.map((b, j) => (
                <span key={j} className={`text-[10px] font-medium px-2 py-0.5 rounded ${b.color}`}>{b.label}</span>
              ))}
            </div>
          )}

          {kpi.progress && (
            <div className="mt-3">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-border text-success">{kpi.progress.label}</span>
              <div className="w-full h-1.5 bg-muted rounded-full mt-2">
                <div className={`h-full rounded-full ${kpi.progress.color}`} style={{ width: `${kpi.progress.value}%` }} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KPICards;
