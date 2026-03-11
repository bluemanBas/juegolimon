"use client";

import { ROLES_ORDERED, ROLE_INFO } from "@/lib/engine/constants";
import { bullwhipIndex, bullwhipColor } from "@/lib/engine/analytics";
import type { WeeklyState } from "@/lib/engine/types";

interface BullwhipDisplayProps {
  weeklyStates: WeeklyState[];
  demandSchedule: number[];
}

const colorMap = {
  green: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    dot: "bg-yellow-500",
  },
  red: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

export default function BullwhipDisplay({
  weeklyStates,
  demandSchedule,
}: BullwhipDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-bold text-earth-800 mb-2">
        Indice Bullwhip
      </h3>
      <p className="text-xs text-earth-400 mb-4">
        Varianza de pedidos / Varianza de demanda. Menor = mejor.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES_ORDERED.map((role) => {
          const info = ROLE_INFO[role];
          const orders = weeklyStates
            .filter((s) => s.player_role === role)
            .map((s) => s.order_placed ?? 0);

          const bwi = bullwhipIndex(orders, demandSchedule);
          const color = bullwhipColor(bwi);
          const styles = colorMap[color];

          return (
            <div key={role} className={`${styles.bg} rounded-xl p-4 text-center`}>
              <div className="text-xl mb-1">{info.emoji}</div>
              <p className="text-sm font-medium text-earth-700">{info.name}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span
                  className={`w-3 h-3 rounded-full ${styles.dot}`}
                />
                <span className={`text-2xl font-bold ${styles.text}`}>
                  {bwi === Infinity ? "∞" : bwi.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-earth-400 mt-1">
                {color === "green"
                  ? "< 1.5 Excelente"
                  : color === "yellow"
                  ? "1.5 - 3 Moderado"
                  : "> 3 Alto"}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
