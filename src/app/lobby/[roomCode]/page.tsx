import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LobbyView from "@/components/lobby/LobbyView";

export default async function LobbyPage({
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

  if (game.status === "playing") {
    redirect(`/game/${roomCode}`);
  }

  if (game.status === "finished") {
    redirect(`/results/${roomCode}`);
  }

  return <LobbyView roomCode={roomCode} initialGame={game} />;
}
