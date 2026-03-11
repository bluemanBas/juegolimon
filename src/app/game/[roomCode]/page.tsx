import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GameView from "@/components/game/GameView";

export default async function GamePage({
  params,
}: {
  params: Promise<{ roomCode: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const { roomCode } = await params;

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

  if (game.status === "finished") {
    redirect(`/results/${roomCode}`);
  }

  return <GameView roomCode={roomCode} gameId={game.id} />;
}
