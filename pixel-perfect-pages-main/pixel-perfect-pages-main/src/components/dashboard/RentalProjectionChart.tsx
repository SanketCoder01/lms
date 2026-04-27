import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
  { name: "Fixed lock-in", value: 65 },
  { name: "Fixed post", value: 38 },
  { name: "MG lock-in", value: 22 },
  { name: "MG post", value: 12 },
  { name: "RevSh lock-in", value: 8 },
  { name: "RevSh post", value: 6 },
];

const colors = ["#1e3a5f", "#4a8ab5", "#1a8a5a", "#3cc48a", "#b8860b", "#e8a830"];

const legendItems = [
  { label: "Fixed — lock-in", color: "#1e3a5f" },
  { label: "Fixed — post", color: "#4a8ab5" },
  { label: "MG — lock-in", color: "#1a8a5a" },
  { label: "MG — post", color: "#3cc48a" },
  { label: "Rev. share — lock-in", color: "#b8860b" },
  { label: "Rev. share — post", color: "#e8a830" },
];

export const RentalProjectionChart = () => {
  return (
    <div>
      <h3 className="text-xs font-bold tracking-wide uppercase text-foreground mb-4">By Financial Value (Monthly)</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis
              tick={{ fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `₹${v}L`}
            />
            <Tooltip formatter={(value: number) => [`₹${value}L`, "Value"]} />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              fill="#1e3a5f"
              barSize={40}
              // Each bar gets its own color
              shape={(props: any) => {
                const { x, y, width, height, index } = props;
                return (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    rx={4}
                    ry={4}
                    fill={colors[index] || "#1e3a5f"}
                  />
                );
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {legendItems.map((item) => (
          <span key={item.label} className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Summary */}
      <div className="flex justify-center gap-12 mt-4">
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Committed (fixed+MG)</p>
          <p className="text-lg font-bold text-foreground">₹1.46 Cr</p>
          <p className="text-[10px] text-muted-foreground">90% of actual rent</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Variable (rev. share)</p>
          <p className="text-lg font-bold text-green-600">₹16.3L</p>
          <p className="text-[10px] text-muted-foreground">10% of actual rent</p>
        </div>
      </div>
    </div>
  );
};
