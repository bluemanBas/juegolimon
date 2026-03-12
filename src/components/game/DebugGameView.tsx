"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useGameSubscription } from "@/lib/hooks/useGameSubscription";
import { ROLES_ORDERED, ROLE_INFO } from "@/lib/engine/constants";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Role, WeeklyState } from "@/lib/engine/types";
import WeekHeader from "./WeekHeader";
import SupplyChainDiagram from "./SupplyChainDiagram";
import EventBanner from "./EventBanner";

interface DebugGameViewProps {
  roomCode: string;
  gameId: string;
}

function CompactOrderPanel({
  state,
  role,
  gameId,
  week,
  onConfirmed,
}: {
  state: WeeklyState;
  role: Role;
  gameId: string;
  week: number;
  onConfirmed: () => void;
}) {
  const info = ROLE_INFO[role];
  const [orderAmount, setOrderAmount] = useState(state.incoming_order || 4);
  const [confirming, setConfirming] = useState(false);
  const isConfirmed = state.confirmed;

  async function handleConfirm() {
    setConfirming(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("weekly_states")
        .update({ order_placed: orderAmount, confirmed: true })
        .eq("game_id", gameId)
        .eq("player_role", role)
        .eq("week", week);
      if (error) throw error;
      onConfirmed();
    } catch (err: any) {
      toast.error("Error: " + err.message);
    }
    setConfirming(false);
  }

  return (
    <div
      className={`rounded-xl border-2 p-3 flex flex-col gap-2 transition-all ${
        isConfirmed
          ? "border-campo-300 bg-campo-50"
          : "border-earth-200 bg-white"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{info.emoji}</span>
          <span className="text-sm font-bold text-earth-800">{info.name}</span>
        </div>
        {isConfirmed ? (
          <span className="text-[10px] bg-campo-200 text-campo-700 px-2 py-0.5 rounded-full font-medium">
            ✓ OK
          </span>
        ) : (
          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            Pendiente
          </span>
        )}
      </div>

      {/* Stats: 4 metrics in a row */}
      <div className="grid grid-cols-4 gap-1 text-center">
        <div className="bg-blue-50 rounded p-1">
          <div className="text-[9px] text-earth-400">Pedido</div>
          <div className="text-sm font-bold text-blue-600">{state.incoming_order}</div>
        </div>
        <div className="bg-campo-50 rounded p-1">
          <div className="text-[9px] text-earth-400">Inv</div>
          <div className="text-sm font-bold text-campo-600">{state.inventory}</div>
        </div>
        <div className="bg-red-50 rounded p-1">
          <div className="text-[9px] text-earth-400">BL</div>
          <div className="text-sm font-bold text-red-500">{state.backlog}</div>
        </div>
        <div className="bg-amber-50 rounded p-1">
          <div className="text-[9px] text-earth-400">Tránsito</div>
          <div className="text-sm font-bold text-amber-600">
            {state.pipeline_1 + state.pipeline_2}
          </div>
        </div>
      </div>

      {/* Costs */}
      <div className="flex gap-2 text-[10px] text-earth-400">
        <span>Inv: {formatCurrency(Number(state.inventory_cost))}</span>
        <span>BL: {formatCurrency(Number(state.backlog_cost))}</span>
      </div>

      {/* Order input or confirmed message */}
      {!isConfirmed ? (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setOrderAmount(Math.max(0, orderAmount - 1))}
            className="w-7 h-7 rounded bg-earth-100 hover:bg-earth-200 text-earth-700 font-bold text-sm"
          >
            -
          </button>
          <input
            type="number"
            min={0}
            value={orderAmount}
            onChange={(e) => setOrderAmount(Math.max(0, parseInt(e.target.value) || 0))}
            className="flex-1 h-7 border border-earth-200 rounded text-center text-sm font-mono focus:outline-none focus:ring-1 focus:ring-lemon-400"
          />
          <button
            onClick={() => setOrderAmount(orderAmount + 1)}
            className="w-7 h-7 rounded bg-earth-100 hover:bg-earth-200 text-earth-700 font-bold text-sm"
          >
            +
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="bg-lemon-500 hover:bg-lemon-600 text-white text-xs font-semibold px-2 py-1.5 rounded transition-colors disabled:opacity-50"
          >
            {confirming ? "..." : "✓"}
          </button>
        </div>
      ) : (
        <div className="text-center text-xs text-campo-600 font-medium py-1 bg-campo-100 rounded">
          Pedido: <strong>{state.order_placed}</strong> cajas
        </div>
      )}
    </div>
  );
}

export default function DebugGameView({ roomCode, gameId }: DebugGameViewProps) {
  const router = useRouter();
  const { game, players, weeklyStates, gameEvents, loading, refetch } =
    useGameSubscription(gameId);

  const advancingRef = useRef(false);
  const [advancing, setAdvancing] = useState(false);

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

  const pastWeeks = useMemo(() => {
    const weeks: number[] = [];
    for (let w = 1; w < currentWeek; w++) weeks.push(w);
    return weeks;
  }, [currentWeek]);

  const advanceWeek = useCallback(async () => {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setAdvancing(true);
    try {
      const res = await fetch("/api/advance-week", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (!res.ok) toast.error("Error al avanzar: " + (data.error || "desconocido"));
    } catch (err: any) {
      toast.error("Error de red: " + err.message);
    }
    setAdvancing(false);
    setTimeout(() => { advancingRef.current = false; }, 2000);
  }, [gameId]);

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

  return (
    <div className="min-h-screen bg-earth-50 p-4 max-w-7xl mx-auto space-y-4">
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
        currentRole={null}
        players={players}
        showAllInfo={true}
      />

      {/* Event Alerts */}
      <EventBanner events={activeEvents} week={currentWeek} />

      {/* 4 compact panels side by side */}
      {currentWeekStates && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {ROLES_ORDERED.map((role) => (
            <CompactOrderPanel
              key={role}
              state={currentWeekStates[role]}
              role={role}
              gameId={gameId}
              week={currentWeek}
              onConfirmed={refetch}
            />
          ))}
        </div>
      )}

      {/* Advance button */}
      {allConfirmed && !isFinished && (
        <div className="bg-campo-50 border border-campo-200 rounded-xl p-3 flex items-center justify-between">
          <p className="text-sm text-campo-700 font-medium">
            ✅ Todos confirmaron — listo para avanzar al día {currentWeek + 1}
          </p>
          <button
            onClick={advanceWeek}
            disabled={advancing}
            className="bg-campo-600 hover:bg-campo-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {advancing ? "Avanzando..." : "▶ Avanzar Día"}
          </button>
        </div>
      )}

      {/* Movement Log */}
      {pastWeeks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-earth-800 mb-3">📋 Log de movimientos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-earth-100">
                  <th className="py-1.5 pr-3 text-earth-500 font-medium">Día</th>
                  {ROLES_ORDERED.map((role) => (
                    <th key={role} className="py-1.5 px-2 text-earth-500 font-medium text-center">
                      {ROLE_INFO[role].emoji} {ROLE_INFO[role].name}
                    </th>
                  ))}
                  {gameEvents.length > 0 && (
                    <th className="py-1.5 px-2 text-earth-500 font-medium">Eventos</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pastWeeks.map((week) => {
                  const weekStates = weeklyStates.filter((s) => s.week === week);
                  const weekEvents = gameEvents.filter((e) => e.week === week - 1);
                  return (
                    <tr key={week} className="border-b border-earth-50 hover:bg-earth-50">
                      <td className="py-1.5 pr-3 font-mono font-bold text-earth-600">{week}</td>
                      {ROLES_ORDERED.map((role) => {
                        const s = weekStates.find((ws) => ws.player_role === role);
                        return (
                          <td key={role} className="py-1.5 px-2 text-center">
                            {s ? (
                              <div className="space-y-0.5">
                                <div className="font-mono font-bold text-earth-800">↑{s.order_placed ?? "—"}</div>
                                <div className="text-campo-600">Inv:{s.inventory}</div>
                                <div className="text-red-500">BL:{s.backlog}</div>
                                <div className="text-earth-400">{formatCurrency(Number(s.inventory_cost) + Number(s.backlog_cost))}</div>
                              </div>
                            ) : <span className="text-earth-300">—</span>}
                          </td>
                        );
                      })}
                      {gameEvents.length > 0 && (
                        <td className="py-1.5 px-2 text-earth-500 text-[10px]">
                          {weekEvents.map((e, i) => (
                            <div key={i} className="text-amber-600">{e.description}</div>
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
