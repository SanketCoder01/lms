import { Download, Plus } from "lucide-react";
import Navbar from "@/components/dashboard/Navbar";
import KPICards from "@/components/dashboard/KPICards";
import RentComposition from "@/components/dashboard/RentComposition";
import LeasingActivity from "@/components/dashboard/LeasingActivity";
import ZoningExecution from "@/components/dashboard/ZoningExecution";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="px-6 py-5 max-w-[1500px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold">Leasing Dashboard</h1>
            <p className="text-xs text-muted-foreground">Nexus Grand Mall · Phase 1 · As of April 2025</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-sm text-foreground border border-border rounded-md px-3 py-1.5 hover:bg-muted transition-colors">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground rounded-md px-3 py-1.5 hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> New Lease
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <KPICards />

        {/* Section Title */}
        <div className="flex items-center gap-2 mt-8 mb-4">
          <div className="w-1 h-5 bg-primary rounded" />
          <h2 className="text-sm font-bold tracking-wide uppercase">Rent Composition, Leasing Activity & Zoning Execution</h2>
        </div>

        {/* Bottom Charts */}
        <div className="grid grid-cols-3 gap-4">
          <RentComposition />
          <LeasingActivity />
          <ZoningExecution />
        </div>
      </div>
    </div>
  );
};

export default Index;
