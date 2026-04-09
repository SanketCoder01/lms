import { PieChart, Pie, Cell } from "recharts";
import { Info } from "lucide-react";

const data = [
  { name: "Fixed rent", value: 68, amount: "₹1.11 Cr", detail: "68% · Traditional leases · 108 units", color: "hsl(210,80%,50%)" },
  { name: "MG rent", value: 22, amount: "₹35.9L", detail: "22% · Rev-share leases (fixed floor) · 34 units", color: "hsl(145,63%,42%)" },
  { name: "Revenue share", value: 10, amount: "₹16.3L", detail: "10% · Variable · based on tenant sales", color: "hsl(38,92%,50%)" },
];

const RentComposition = () => {
  return (
    <div className="border border-border rounded-lg p-5 bg-card">
      <div className="flex items-center gap-1.5 mb-0.5">
        <h3 className="text-sm font-semibold">Actual rent composition</h3>
        <Info className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground mb-4">Breakdown of ₹1.63 Cr/mo actual rent</p>

      <div className="flex items-center gap-6">
        <div className="relative">
          <PieChart width={150} height={150}>
            <Pie data={data} cx={75} cy={75} innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
              {data.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold">₹1.63</span>
            <span className="text-[10px] text-muted-foreground">Cr/mo</span>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {data.map((d, i) => (
            <div key={i}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                  <span className="text-sm font-medium">{d.name}</span>
                </div>
                <span className="text-sm font-semibold">{d.amount}</span>
              </div>
              <div className="h-1 rounded-full mt-1 mb-0.5" style={{ backgroundColor: d.color, width: `${d.value}%` }} />
              <p className="text-[10px] text-muted-foreground">{d.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RentComposition;
