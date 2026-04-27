import { ChevronDown, AlertTriangle, Clock, TrendingUp } from "lucide-react";

const alerts = [
  { icon: <Clock className="w-3.5 h-3.5 text-red-400" />, text: "Lease expiring:", highlight: "GF-12 Zara", suffix: "in 12 days" },
  { icon: <AlertTriangle className="w-3.5 h-3.5 text-warning" />, text: "Lease expiring:", highlight: "FF-07 CCD", suffix: "in 18 days" },
  { icon: <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />, text: "Escalation due:", highlight: "GF-08 H&M", suffix: "in 8 days" },
  { icon: <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />, text: "Escalation due:", highlight: "FC-03 McDonald's", suffix: "in 14 days" },
];

const Navbar = () => {
  return (
    <nav className="bg-nav text-nav-foreground px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="text-primary font-bold text-lg tracking-tight">LeaseOS</span>
        <button className="flex items-center gap-1.5 bg-nav-foreground/10 rounded-full px-3 py-1.5 text-sm">
          Nexus Grand Mall — Phase 1
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 mx-6 overflow-hidden">
        <div className="flex items-center gap-2">
          <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-0.5 rounded">Alerts</span>
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <div className="overflow-hidden flex-1">
            <div className="flex items-center gap-6 animate-scroll-left whitespace-nowrap">
              {[...alerts, ...alerts].map((alert, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs">
                  {alert.icon}
                  <span className="opacity-80">{alert.text}</span>
                  <span className="font-semibold text-primary">{alert.highlight}</span>
                  <span className="opacity-60">{alert.suffix}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
        RK
      </div>
    </nav>
  );
};

export default Navbar;
