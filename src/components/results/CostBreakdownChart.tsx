"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { RoleSummary } from "@/lib/engine/analytics";

interface CostBreakdownChartProps {
  data: RoleSummary[];
}

export default function CostBreakdownChart({ data }: CostBreakdownChartProps) {
  const chartData = data.map((d) => ({
    name: d.roleName,
    Inventario: Number(d.inventoryCost.toFixed(2)),
    Backlog: Number(d.backlogCost.toFixed(2)),
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-bold text-earth-800 mb-4">
        Costo Total por Eslabon
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c4" />
          <XAxis dataKey="name" />
          <YAxis
            label={{ value: "Costo ($)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
          <Legend />
          <Bar
            dataKey="Inventario"
            stackId="cost"
            fill="#22c55e"
            radius={[0, 0, 0, 0]}
          />
          <Bar
            dataKey="Backlog"
            stackId="cost"
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
