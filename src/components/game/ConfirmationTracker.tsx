"use client";

import { ROLES_ORDERED, ROLE_INFO } from "@/lib/engine/constants";
import type { Role, WeeklyState, Player } from "@/lib/engine/types";

interface ConfirmationTrackerProps {
  states: Record<Role, WeeklyState> | null;
  players: Player[];
}

export default function ConfirmationTracker({
  states,
  players,
}: ConfirmationTrackerProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h3 className="text-sm font-semibold text-earth-600 mb-3">
        Estado de decisiones
      </h3>
      <div className="flex flex-wrap gap-3">
        {ROLES_ORDERED.map((role) => {
          const info = ROLE_INFO[role];
          const state = states?.[role];
          const player = players.find((p) => p.role === role);
          const confirmed = state?.confirmed ?? false;

          return (
            <div
              key={role}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                confirmed
                  ? "border-campo-300 bg-campo-50"
                  : "border-earth-200 bg-earth-50"
              }`}
            >
              <span className="text-lg">{info.emoji}</span>
              <span className="text-sm text-earth-700">
                {player?.display_name || info.name}
              </span>
              {confirmed ? (
                <svg
                  className="w-4 h-4 text-campo-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span className="text-amber-500 text-sm animate-pulse">
                  &#9203;
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
