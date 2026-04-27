const escalations = [
  { id: "GF-08", tenant: "H&M India · Retail", detail: "15% · ₹3.60L → ₹4.14L/mo", days: 8, status: "Critical", color: "bg-red-100 text-red-700" },
  { id: "FC-03", tenant: "McDonald's · Food court", detail: "₹12/sqft · MG ₹1.80L → ₹1.92L", days: 14, status: "Critical", color: "bg-red-100 text-red-700" },
  { id: "SF-09", tenant: "Reliance Digital", detail: "10% · ₹2.40L → ₹2.64L/mo", days: 38, status: "Pending", color: "bg-orange-100 text-orange-700" },
  { id: "GF-06", tenant: "Lifestyle Stores", detail: "₹8/sqft · Rev-share MG revised", days: 52, status: "Pending", color: "bg-orange-100 text-orange-700" },
];

export const EscalationsSection = () => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-0.5">Upcoming escalations</h3>
      <p className="text-xs text-muted-foreground mb-4">Rent revision events in next 60 days</p>

      <div className="space-y-4">
        {escalations.map((e) => (
          <div key={e.id} className="flex items-start gap-3">
            <span className="text-sm font-bold text-foreground min-w-[40px]">{e.id}</span>
            <div className="flex-1">
              <p className="text-sm text-foreground">{e.tenant}</p>
              <p className="text-xs text-muted-foreground">{e.detail}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-medium text-foreground">{e.days} days</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.color}`}>{e.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Escalation impact callout */}
      <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
        <p className="text-xs font-semibold text-green-800">Escalation impact</p>
        <p className="text-xs text-green-700">
          Confirmed escalations will add ~<strong>₹5.1L/mo</strong> to actual rent post confirmation
        </p>
      </div>

      <div className="mt-4">
        <a href="#" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
          Manage escalations <span className="text-xs">↗</span>
        </a>
      </div>
    </div>
  );
};
