"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ROLE_CHART_COLORS, DEMAND_CHART_COLOR, ROLE_INFO } from "@/lib/engine/constants";
import type { OrdersVsDemandRow } from "@/lib/engine/analytics";

interface OrdersVsDemandChartProps {
  data: OrdersVsDemandRow[];
}

export default function OrdersVsDemandChart({
  data,
}: OrdersVsDemandChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-bold text-earth-800 mb-4">
        Pedidos vs Demanda Real
      </h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c4" />
          <XAxis
            dataKey="week"
            label={{ value: "Día", position: "insideBottom", offset: -5 }}
          />
          <YAxis label={{ value: "Cajas", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="demand"
            stroke={DEMAND_CHART_COLOR}
            strokeWidth={3}
            strokeDasharray="8 4"
            dot={false}
            name="Demanda consumidor"
          />
          <Line
            type="monotone"
            dataKey="campo"
            stroke={ROLE_CHART_COLORS.campo}
            strokeWidth={2}
            dot={false}
            name={ROLE_INFO.campo.name}
          />
          <Line
            type="monotone"
            dataKey="packing"
            stroke={ROLE_CHART_COLORS.packing}
            strokeWidth={2}
            dot={false}
            name={ROLE_INFO.packing.name}
          />
          <Line
            type="monotone"
            dataKey="distribucion"
            stroke={ROLE_CHART_COLORS.distribucion}
            strokeWidth={2}
            dot={false}
            name={ROLE_INFO.distribucion.name}
          />
          <Line
            type="monotone"
            dataKey="retail"
            stroke={ROLE_CHART_COLORS.retail}
            strokeWidth={2}
            dot={false}
            name={ROLE_INFO.retail.name}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
