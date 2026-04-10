const leases = [
  { id: "GF-12", tenant: "Zara · Inditex Trent", area: "2,400 sqft · ₹7.44L/mo", days: 12, status: "Notice", color: "bg-yellow-100 text-yellow-800" },
  { id: "FF-07", tenant: "CCD · Café Coffee Day", area: "820 sqft · ₹1.80L/mo", days: 18, status: "Expiring", color: "bg-red-100 text-red-700" },
  { id: "GF-01", tenant: "Shoppers Stop", area: "18,400 sqft · ₹34L/mo", days: 45, status: "Lock-in", color: "bg-orange-100 text-orange-700" },
  { id: "SF-22", tenant: "Nykaa Fashion", area: "1,100 sqft · ₹1.98L/mo", days: 92, status: "Active", color: "bg-green-100 text-green-700" },
  { id: "TF-04", tenant: "PVR Cinemas", area: "22,000 sqft · ₹22L/mo", days: 84, status: "Active", color: "bg-green-100 text-green-700" },
];

export const LeaseExpirySection = () => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground mb-0.5">Leases nearing expiry</h3>
      <p className="text-xs text-muted-foreground mb-4">Leases expiring or lock-in ending within 90 days</p>

      <div className="space-y-4">
        {leases.map((l) => (
          <div key={l.id} className="flex items-start gap-3">
            <span className="text-sm font-bold text-foreground min-w-[40px]">{l.id}</span>
            <div className="flex-1">
              <p className="text-sm text-foreground">{l.tenant}</p>
              <p className="text-xs text-muted-foreground">{l.area}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-medium text-foreground">{l.days} days</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.color}`}>{l.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <a href="#" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
          View all expiring leases <span className="text-xs">↗</span>
        </a>
      </div>
    </div>
  );
};
