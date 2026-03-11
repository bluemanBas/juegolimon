"use client";

import { useMemo } from "react";
import { useGameSubscription } from "./useGameSubscription";
import { ROLES_ORDERED } from "@/lib/engine/constants";
import type { Role, WeeklyState, GameEvent, Player, Game } from "@/lib/engine/types";

interface GameStateData {
  game: Game | null;
  players: Player[];
  weeklyStates: WeeklyState[];
  gameEvents: GameEvent[];
  loading: boolean;
  currentWeek: number;
  currentWeekStates: Record<Role, WeeklyState> | null;
  myState: WeeklyState | null;
  allHumansConfirmed: boolean;
  activeEvents: GameEvent[];
  isFinished: boolean;
  myPlayer: Player | null;
  isHost: boolean;
  refetch: () => Promise<void>;
}

function getUserId(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)user_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function useGameState(gameId: string): GameStateData {
  const { game, players, weeklyStates, gameEvents, loading, refetch } =
    useGameSubscription(gameId);

  const userId = getUserId();

  const currentWeek = game?.current_week ?? 0;

  const myPlayer = useMemo(
    () => players.find((p) => p.user_id === userId) ?? null,
    [players, userId]
  );

  const isHost = myPlayer?.is_host ?? false;

  const currentWeekStates = useMemo(() => {
    const states = weeklyStates.filter((s) => s.week === currentWeek);
    if (states.length < 4) return null;

    const record = {} as Record<Role, WeeklyState>;
    for (const s of states) {
      record[s.player_role as Role] = s;
    }
    return record;
  }, [weeklyStates, currentWeek]);

  const myState = useMemo(() => {
    if (!myPlayer || !currentWeekStates) return null;
    return currentWeekStates[myPlayer.role as Role] ?? null;
  }, [myPlayer, currentWeekStates]);

  const allHumansConfirmed = useMemo(() => {
    if (!currentWeekStates) return false;
    const humanPlayers = players.filter((p) => !p.is_bot);
    return humanPlayers.every((p) => {
      const state = currentWeekStates[p.role as Role];
      return state?.confirmed === true;
    });
  }, [currentWeekStates, players]);

  const activeEvents = useMemo(
    () => gameEvents.filter((e) => e.week === currentWeek),
    [gameEvents, currentWeek]
  );

  const isFinished = game?.status === "finished";

  return {
    game,
    players,
    weeklyStates,
    gameEvents,
    loading,
    currentWeek,
    currentWeekStates,
    myState,
    allHumansConfirmed,
    activeEvents,
    isFinished,
    myPlayer,
    isHost,
    refetch,
  };
}
