"use client";

import { ROLES_ORDERED, ROLE_INFO } from "@/lib/engine/constants";
import type { Role, WeeklyState, Player } from "@/lib/engine/types";

interface SupplyChainDiagramProps {
  states: Record<Role, WeeklyState> | null;
  currentRole: Role | null;
  players: Player[];
  showAllInfo: boolean;
}

export default function SupplyChainDiagram({
  states,
  currentRole,
  players,
  showAllInfo,
}: SupplyChainDiagramProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[600px] gap-2">
        {ROLES_ORDERED.map((role, idx) => {
          const info = ROLE_INFO[role];
          const state = states?.[role];
          const player = players.find((p) => p.role === role);
          const isMe = role === currentRole;

          return (
            <div key={role} className="flex items-center flex-1">
              {/* Node */}
              <div
                className={`flex-1 rounded-xl border-2 p-3 text-center transition-all ${
                  isMe
                    ? "border-lemon-500 bg-lemon-50 ring-2 ring-lemon-300"
                    : "border-earth-200 bg-earth-50"
                }`}
              >
                <div className="text-2xl mb-1">{info.emoji}</div>
                <p className="text-sm font-semibold text-earth-800">
                  {info.name}
                </p>
                <p className="text-xs text-earth-500 truncate">
                  {player?.display_name || "—"}
                </p>

                {state && (showAllInfo || isMe) && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-center gap-3 text-xs">
                      <span className="text-campo-600 font-medium">
                        Inv: {state.inventory}
                      </span>
                      <span className="text-red-500 font-medium">
                        BL: {state.backlog}
                      </span>
                    </div>
                    <div className="text-xs text-earth-400">
                      Pipeline: {state.pipeline_1 + state.pipeline_2}
                    </div>
                  </div>
                )}
                {state && !showAllInfo && !isMe && (
                  <div className="mt-2 text-xs text-earth-300 italic">
                    Info oculta
                  </div>
                )}
              </div>

              {/* Arrow between nodes */}
              {idx < ROLES_ORDERED.length - 1 && (
                <div className="flex flex-col items-center px-1 flex-shrink-0">
                  <svg
                    width="32"
                    height="24"
                    viewBox="0 0 32 24"
                    className="text-earth-300"
                  >
                    <path
                      d="M2 12 L22 12 M18 6 L24 12 L18 18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {states && (showAllInfo || ROLES_ORDERED[idx] === currentRole || ROLES_ORDERED[idx + 1] === currentRole) && (
                    <span className="text-[10px] text-earth-400">
                      {states[ROLES_ORDERED[idx]].units_shipped} uds
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-3 text-xs text-earth-400 border-t border-earth-100 pt-2">
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-campo-500 mr-1" />
          Inventario
        </span>
        <span>
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />
          Backlog
        </span>
      </div>
    </div>
  );
}
