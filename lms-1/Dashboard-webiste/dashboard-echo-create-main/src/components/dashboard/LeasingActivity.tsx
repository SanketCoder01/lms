import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const chartData = [
  { month: "Oct", units: 2, area: 8 },
  { month: "Nov", units: 4, area: 18 },
  { month: "Dec", units: 3, area: 15 },
  { month: "Jan", units: 4, area: 25 },
  { month: "Feb", units: 2, area: 28 },
  { month: "Mar", units: 3, area: 30 },
];

const LeasingActivity = () => {
  return (
    <div className="border border-border rounded-lg p-5 bg-card">
      <h3 className="text-sm font-semibold mb-0.5">Leasing activity — last 6 months</h3>
      <p className="text-xs text-muted-foreground mb-4">New agreements, LOIs and area leased by month</p>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-xs text-muted-foreground">New leases</p>
          <p className="text-2xl font-bold">18</p>
          <p className="text-[10px] text-success">↑ in 6 months</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Area leased</p>
          <p className="text-2xl font-bold">1.24L</p>
          <p className="text-[10px] text-muted-foreground">sqft</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">LOIs signed</p>
          <p className="text-2xl font-bold">6</p>
          <p className="text-[10px] text-muted-foreground">in pipeline</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(220,13%,90%)" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
          <Tooltip />
          <Bar yAxisId="left" dataKey="units" fill="hsl(210,80%,35%)" radius={[2, 2, 0, 0]} barSize={16} name="Units leased" />
          <Bar yAxisId="right" dataKey="area" fill="hsl(210,60%,78%)" radius={[2, 2, 0, 0]} barSize={16} name="Area ('000 sqft)" />
          <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LeasingActivity;
