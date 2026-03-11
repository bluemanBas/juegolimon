"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useGameState } from "@/lib/hooks/useGameState";
import WeekHeader from "./WeekHeader";
import SupplyChainDiagram from "./SupplyChainDiagram";
import OrderPanel from "./OrderPanel";
import ConfirmationTracker from "./ConfirmationTracker";
import EventBanner from "./EventBanner";

interface GameViewProps {
  roomCode: string;
  gameId: string;
}

export default function GameView({ roomCode, gameId }: GameViewProps) {
  const router = useRouter();
  const {
    game,
    players,
    loading,
    currentWeek,
    currentWeekStates,
    myState,
    allHumansConfirmed,
    activeEvents,
    isFinished,
    myPlayer,
    refetch,
  } = useGameState(gameId);

  const advancingRef = useRef(false);

  // Advance week when all humans confirmed
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
      if (!res.ok) {
        console.error("advance-week error:", data.error);
      }
    } catch (err) {
      console.error("advance-week fetch error:", err);
    }

    // Allow re-advancing after a short delay (for next week)
    setTimeout(() => {
      advancingRef.current = false;
    }, 2000);
  }, [gameId]);

  useEffect(() => {
    if (allHumansConfirmed && !isFinished && currentWeekStates) {
      advanceWeek();
    }
  }, [allHumansConfirmed, isFinished, currentWeekStates, advanceWeek]);

  // Redirect when finished
  useEffect(() => {
    if (isFinished) {
      toast.success("Juego terminado! Revisando resultados...");
      setTimeout(() => {
        router.push(`/results/${roomCode}`);
      }, 1500);
    }
  }, [isFinished, roomCode, router]);

  if (loading || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-lemon-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!myPlayer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-earth-500 mb-4">No tienes un rol en esta partida.</p>
        <button
          onClick={() => router.push(`/lobby/${roomCode}`)}
          className="text-lemon-600 underline"
        >
          Ir al lobby
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-earth-50 p-4 max-w-5xl mx-auto space-y-4">
      {/* Week Header */}
      <WeekHeader
        currentWeek={currentWeek}
        maxWeeks={game.max_weeks}
        scenario={game.scenario}
      />

      {/* Supply Chain Diagram */}
      <SupplyChainDiagram
        states={currentWeekStates}
        currentRole={myPlayer.role as any}
        players={players}
      />

      {/* Event Alerts */}
      <EventBanner events={activeEvents} week={currentWeek} />

      {/* Order Panel */}
      {myState && (
        <OrderPanel
          myState={myState}
          gameId={gameId}
          role={myPlayer.role as any}
          week={currentWeek}
          onConfirmed={refetch}
        />
      )}

      {/* Confirmation Tracker */}
      <ConfirmationTracker states={currentWeekStates} players={players} />
    </div>
  );
}
