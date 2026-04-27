import { LeaseExpirySection } from "@/components/dashboard/LeaseExpirySection";
import { EscalationsSection } from "@/components/dashboard/EscalationsSection";
import { OwnershipSection } from "@/components/dashboard/OwnershipSection";
import { RentalProjectionTable } from "@/components/dashboard/RentalProjectionTable";
import { RentalProjectionChart } from "@/components/dashboard/RentalProjectionChart";
import { BrandPerformanceSection } from "@/components/dashboard/BrandPerformanceSection";
import { FloorOccupancySection } from "@/components/dashboard/FloorOccupancySection";

const Index = () => {
  return (
    <div className="min-h-screen bg-white p-6 space-y-8">
      {/* Section 1 Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-[hsl(15,80%,50%)] rounded-sm" />
        <h1 className="text-sm font-bold tracking-wide uppercase text-foreground">
          Lease Expiry, Escalations & Ownership-wise Sales
        </h1>
      </div>

      {/* Section 1: Three columns */}
      <div className="grid grid-cols-3 gap-8">
        <LeaseExpirySection />
        <EscalationsSection />
        <OwnershipSection />
      </div>

      {/* Section 2 Header */}
      <div className="flex items-center gap-2 pt-4">
        <div className="w-1 h-6 bg-[hsl(15,80%,50%)] rounded-sm" />
        <h2 className="text-sm font-bold tracking-wide uppercase text-foreground">
          Comprehensive Rental Projection Matrix
        </h2>
        <span className="text-muted-foreground text-xs ml-1 cursor-pointer">ⓘ</span>
      </div>

      {/* Section 2: Two columns */}
      <div className="grid grid-cols-2 gap-8">
        <RentalProjectionTable />
        <RentalProjectionChart />
      </div>

      {/* Section 3: Brand Performance vs Target Sales & Floor Occupancy */}
      <div className="flex items-center gap-2 pt-4">
        <div className="w-1 h-6 bg-[hsl(15,80%,50%)] rounded-sm" />
        <h2 className="text-sm font-bold tracking-wide uppercase text-foreground">
          Brand Performance vs Target Sales & Floor Occupancy
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <BrandPerformanceSection />
        <FloorOccupancySection />
      </div>
    </div>
  );
};

export default Index;
