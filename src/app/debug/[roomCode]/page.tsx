import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DebugGameView from "@/components/game/DebugGameView";

export default async function DebugPage({
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

  if (!game) redirect("/");
  if (game.status === "finished") redirect(`/results/${roomCode}`);

  return <DebugGameView roomCode={roomCode} gameId={game.id} />;
}
