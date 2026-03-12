"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGameSubscription } from "@/lib/hooks/useGameSubscription";
import { ROLES_ORDERED, ROLE_INFO } from "@/lib/engine/constants";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Role, WeeklyState } from "@/lib/engine/types";
import WeekHeader from "./WeekHeader";
import SupplyChainDiagram from "./SupplyChainDiagram";
import OrderPanel from "./OrderPanel";
import EventBanner from "./EventBanner";

interface DebugGameViewProps {
  roomCode: string;
  gameId: string;
}

export default function DebugGameView({ roomCode, gameId }: DebugGameViewProps) {
  const router = useRouter();
  const [activeRole, setActiveRole] = useState<Role>("campo");
  const { game, players, weeklyStates, gameEvents, loading, refetch } =
    useGameSubscription(gameId);

  const advancingRef = useRef(false);

  const currentWeek = game?.current_week ?? 0;

  const currentWeekStates = useMemo(() => {
    const states = weeklyStates.filter((s) => s.week === currentWeek);
    if (states.length < 4) return null;
    const record = {} as Record<Role, WeeklyState>;
    for (const s of states) record[s.player_role as Role] = s;
    return record;
  }, [weeklyStates, currentWeek]);

  const allConfirmed = useMemo(() => {
    if (!currentWeekStates) return false;
    return ROLES_ORDERED.every((r) => currentWeekStates[r]?.confirmed === true);
  }, [currentWeekStates]);

  const activeEvents = useMemo(
    () => gameEvents.filter((e) => e.week === currentWeek),
    [gameEvents, currentWeek]
  );

  const isFinished = game?.status === "finished";

  // Past weeks for log
  const pastWeeks = useMemo(() => {
    const weeks: number[] = [];
    for (let w = 1; w < currentWeek; w++) weeks.push(w);
    return weeks;
  }, [currentWeek]);

  const advanceWeek = useCallback(async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    try {
      const res = await fetch("/api/advance-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (!res.ok) console.error("advance-week error:", data.error);
    } catch (err) {
      console.error("advance-week fetch error:", err);
    }
    setTimeout(() => { advancingRef.current = false; }, 2000);
  }, [gameId]);

  useEffect(() => {
    if (allConfirmed && !isFinished && currentWeekStates) advanceWeek();
  }, [allConfirmed, isFinished, currentWeekStates, advanceWeek]);

  useEffect(() => {
    if (isFinished) {
      toast.success("¡Juego terminado! Revisando resultados...");
      setTimeout(() => router.push(`/results/${roomCode}`), 1500);
    }
  }, [isFinished, roomCode, router]);

  if (loading || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-lemon-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const myState = currentWeekStates?.[activeRole] ?? null;

  return (
    <div className="min-h-screen bg-earth-50 p-4 max-w-6xl mx-auto space-y-4">
      {/* Debug banner */}
      <div className="bg-amber-100 border border-amber-300 rounded-xl px-4 py-2 flex items-center gap-2 text-amber-800 text-sm font-medium">
        🛠 Modo Debug — visibilidad completa · todos los roles en un PC
      </div>

      {/* Week Header */}
      <WeekHeader
        currentWeek={currentWeek}
        maxWeeks={game.max_weeks}
        scenario={game.scenario}
      />

      {/* Supply Chain Diagram */}
      <SupplyChainDiagram
        states={currentWeekStates}
        currentRole={activeRole}
        players={players}
        showAllInfo={true}
      />

      {/* Event Alerts */}
      <EventBanner events={activeEvents} week={currentWeek} />

      {/* Role switcher */}
      <div className="bg-white rounded-xl shadow-sm p-3">
        <p className="text-xs text-earth-500 mb-2 font-medium">Selecciona el rol a jugar:</p>
        <div className="grid grid-cols-4 gap-2">
          {ROLES_ORDERED.map((role) => {
            const info = ROLE_INFO[role];
            const state = currentWeekStates?.[role];
            const confirmed = state?.confirmed ?? false;
            return (
              <button
                key={role}
                onClick={() => setActiveRole(role)}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                  activeRole === role
                    ? "border-lemon-500 bg-lemon-50 text-lemon-800"
                    : confirmed
                    ? "border-campo-300 bg-campo-50 text-campo-700"
                    : "border-earth-200 bg-white text-earth-700 hover:border-lemon-300"
                }`}
              >
                <span className="text-xl">{info.emoji}</span>
                <span>{info.name}</span>
                {confirmed && (
                  <span className="text-[10px] bg-campo-200 text-campo-700 px-1.5 rounded-full">
                    ✓ Confirmado
                  </span>
                )}
                {!confirmed && (
                  <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded-full">
                    Pendiente
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Order Panel for active role */}
      {myState && (
        <OrderPanel
          myState={myState}
          gameId={gameId}
          role={activeRole}
          week={currentWeek}
          onConfirmed={refetch}
        />
      )}

      {/* Movement Log */}
      {pastWeeks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-earth-800 mb-3">
            📋 Log de movimientos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-earth-100">
                  <th className="py-2 pr-3 text-earth-500 font-medium">Día</th>
                  {ROLES_ORDERED.map((role) => (
                    <th key={role} className="py-2 px-2 text-earth-500 font-medium text-center">
                      {ROLE_INFO[role].emoji} {ROLE_INFO[role].name}
                    </th>
                  ))}
                  {gameEvents.length > 0 && (
                    <th className="py-2 px-2 text-earth-500 font-medium">Eventos</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pastWeeks.map((week) => {
                  const weekStates = weeklyStates.filter((s) => s.week === week);
                  const weekEvents = gameEvents.filter((e) => e.week === week - 1);
                  return (
                    <tr key={week} className="border-b border-earth-50 hover:bg-earth-50">
                      <td className="py-2 pr-3 font-mono font-bold text-earth-600">
                        {week}
                      </td>
                      {ROLES_ORDERED.map((role) => {
                        const s = weekStates.find((ws) => ws.player_role === role);
                        return (
                          <td key={role} className="py-2 px-2 text-center">
                            {s ? (
                              <div className="space-y-0.5">
                                <div className="font-mono font-bold text-earth-800">
                                  Pedido: {s.order_placed ?? "—"}
                                </div>
                                <div className="text-campo-600">Inv: {s.inventory}</div>
                                <div className="text-red-500">BL: {s.backlog}</div>
                                <div className="text-earth-400">
                                  {formatCurrency(Number(s.inventory_cost) + Number(s.backlog_cost))}
                                </div>
                              </div>
                            ) : (
                              <span className="text-earth-300">—</span>
                            )}
                          </td>
                        );
                      })}
                      {gameEvents.length > 0 && (
                        <td className="py-2 px-2 text-earth-500">
                          {weekEvents.map((e, i) => (
                            <div key={i} className="text-amber-600">
                              {e.description}
                            </div>
                          ))}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
