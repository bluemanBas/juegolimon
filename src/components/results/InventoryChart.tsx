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
  ReferenceLine,
} from "recharts";
import { ROLE_CHART_COLORS, ROLE_INFO } from "@/lib/engine/constants";
import type { InventoryRow } from "@/lib/engine/analytics";

interface InventoryChartProps {
  data: InventoryRow[];
}

export default function InventoryChart({ data }: InventoryChartProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-bold text-earth-800 mb-4">
        Inventario por Eslabon
      </h3>
      <p className="text-xs text-earth-400 mb-2">
        Valores negativos = backlog (pedidos pendientes)
      </p>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e8d5c4" />
          <XAxis
            dataKey="week"
            label={{ value: "Semana", position: "insideBottom", offset: -5 }}
          />
          <YAxis
            label={{ value: "Cajas", angle: -90, position: "insideLeft" }}
          />
          <Tooltip />
          <Legend />
          <ReferenceLine y={0} stroke="#92734e" strokeDasharray="4 2" />
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
