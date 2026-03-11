import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ResultsView from "@/components/results/ResultsView";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { roomCode } = await params;

  // Fetch game
  const { data: game } = await supabase
    .from("games")
    .select("*")
    .eq("room_code", roomCode)
    .single();

  if (!game) {
    redirect("/");
  }

  if (game.status === "waiting") {
    redirect(`/lobby/${roomCode}`);
  }

  if (game.status === "playing") {
    redirect(`/game/${roomCode}`);
  }

  // Fetch all data in parallel
  const [playersRes, statesRes, eventsRes, demandRes] = await Promise.all([
    supabase
      .from("players")
      .select("*")
      .eq("game_id", game.id)
      .order("joined_at", { ascending: true }),
    supabase
      .from("weekly_states")
      .select("*")
      .eq("game_id", game.id)
      .order("week", { ascending: true }),
    supabase
      .from("game_events")
      .select("*")
      .eq("game_id", game.id)
      .order("week", { ascending: true }),
    supabase
      .from("demand_schedule")
      .select("*")
      .eq("game_id", game.id)
      .order("week", { ascending: true }),
  ]);

  const players = playersRes.data || [];
  const weeklyStates = statesRes.data || [];
  const gameEvents = eventsRes.data || [];
  const demandSchedule = (demandRes.data || []).map(
    (d: { demand: number }) => d.demand
  );

  return (
    <ResultsView
      game={game}
      players={players}
      weeklyStates={weeklyStates}
      gameEvents={gameEvents}
      demandSchedule={demandSchedule}
    />
  );
}
