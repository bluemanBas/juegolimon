"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Game, Player, WeeklyState, GameEvent } from "@/lib/engine/types";

interface GameSubscriptionData {
  game: Game | null;
  players: Player[];
  weeklyStates: WeeklyState[];
  gameEvents: GameEvent[];
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useGameSubscription(gameId: string): GameSubscriptionData {
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [weeklyStates, setWeeklyStates] = useState<WeeklyState[]>([]);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const supabase = createClient();

    const [gameRes, playersRes, statesRes, eventsRes] = await Promise.all([
      supabase.from("games").select("*").eq("id", gameId).single(),
      supabase
        .from("players")
        .select("*")
        .eq("game_id", gameId)
        .order("joined_at", { ascending: true }),
      supabase
        .from("weekly_states")
        .select("*")
        .eq("game_id", gameId)
        .order("week", { ascending: true }),
      supabase
        .from("game_events")
        .select("*")
        .eq("game_id", gameId)
        .order("week", { ascending: true }),
    ]);

    if (gameRes.data) setGame(gameRes.data);
    if (playersRes.data) setPlayers(playersRes.data);
    if (statesRes.data) setWeeklyStates(statesRes.data);
    if (eventsRes.data) setGameEvents(eventsRes.data);
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Polling fallback every 4s in case Realtime misses an event
  useEffect(() => {
    const interval = setInterval(fetchAll, 4000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setGame(payload.new as Game);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          // Refetch players on any change
          supabase
            .from("players")
            .select("*")
            .eq("game_id", gameId)
            .order("joined_at", { ascending: true })
            .then(({ data }) => {
              if (data) setPlayers(data);
            });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weekly_states",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          // Refetch all states to keep consistent
          supabase
            .from("weekly_states")
            .select("*")
            .eq("game_id", gameId)
            .order("week", { ascending: true })
            .then(({ data }) => {
              if (data) setWeeklyStates(data);
            });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "game_events",
          filter: `game_id=eq.${gameId}`,
        },
        () => {
          supabase
            .from("game_events")
            .select("*")
            .eq("game_id", gameId)
            .order("week", { ascending: true })
            .then(({ data }) => {
              if (data) setGameEvents(data);
            });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return { game, players, weeklyStates, gameEvents, loading, refetch: fetchAll };
}
