import { Info } from "lucide-react";

const categories = [
  { name: "Anchor", color: "bg-success", plan: 8, actual: 8, match: 100 },
  { name: "Luxury", color: "bg-info", plan: 22, actual: 13, match: 59 },
  { name: "Food court", color: "bg-primary", plan: 18, actual: 17, match: 94 },
  { name: "Retail shops", color: "bg-foreground/70", plan: 96, actual: 82, match: 85 },
  { name: "Café", color: "bg-warning", plan: 16, actual: 10, match: 63 },
  { name: "Display", color: "bg-destructive", plan: 26, actual: 12, match: 46 },
];

const getMatchColor = (match: number) => {
  if (match >= 90) return "bg-success text-success-foreground";
  if (match >= 80) return "bg-info/20 text-info";
  if (match >= 60) return "bg-warning/20 text-warning";
  return "bg-destructive/20 text-destructive";
};

const ZoningExecution = () => {
  return (
    <div className="border border-border rounded-lg p-5 bg-card">
      <div className="flex items-center gap-1.5 mb-0.5">
        <h3 className="text-sm font-semibold">Zoning plan vs actual leasing</h3>
        <Info className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground mb-4">Planned category allocation vs executed leases</p>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] tracking-wider text-muted-foreground font-semibold">
            <th className="text-left pb-2">CATEGORY</th>
            <th className="text-right pb-2">PLAN</th>
            <th className="text-right pb-2">ACTUAL</th>
            <th className="text-right pb-2">MATCH</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, i) => (
            <tr key={i} className="border-t border-border">
              <td className="py-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${cat.color} text-card`}>{cat.name}</span>
              </td>
              <td className="text-right py-2 font-medium">{cat.plan}</td>
              <td className="text-right py-2 font-medium">{cat.actual}</td>
              <td className="text-right py-2">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getMatchColor(cat.match)}`}>
                  {cat.match}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 bg-warning/10 border border-warning/30 rounded p-3 text-xs text-foreground">
        Luxury, café and display zones are significantly under-leased vs master plan. Priority for leasing team.
      </div>
    </div>
  );
};

export default ZoningExecution;
