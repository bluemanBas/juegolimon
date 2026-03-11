"use client";

import { ROLE_INFO } from "@/lib/engine/constants";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Player } from "@/lib/engine/types";
import type { RoleSummary } from "@/lib/engine/analytics";

interface PlayerRankingProps {
  players: Player[];
  summaries: RoleSummary[];
}

const medals = ["🥇", "🥈", "🥉", "4"];
const rankBg = [
  "bg-lemon-50 border-lemon-300",
  "bg-earth-50 border-earth-300",
  "bg-earth-50 border-earth-200",
  "bg-earth-50 border-earth-100",
];

export default function PlayerRanking({
  players,
  summaries,
}: PlayerRankingProps) {
  const ranked = [...summaries].sort((a, b) => a.totalCost - b.totalCost);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-lg font-bold text-earth-800 mb-4">
        Ranking de Jugadores
      </h3>
      <p className="text-xs text-earth-400 mb-3">
        Menor costo total = mejor desempeno
      </p>

      <div className="space-y-3">
        {ranked.map((summary, idx) => {
          const info = ROLE_INFO[summary.role];
          const player = players.find((p) => p.role === summary.role);

          return (
            <div
              key={summary.role}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
                rankBg[idx] || rankBg[3]
              }`}
            >
              <span className="text-2xl w-8 text-center">
                {medals[idx] || `${idx + 1}`}
              </span>
              <span className="text-2xl">{info.emoji}</span>
              <div className="flex-1">
                <p className="font-semibold text-earth-800">
                  {player?.display_name || info.name}
                </p>
                <p className="text-sm text-earth-500">{info.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-earth-800">
                  {formatCurrency(summary.totalCost)}
                </p>
                <p className="text-xs text-earth-400">costo total</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
