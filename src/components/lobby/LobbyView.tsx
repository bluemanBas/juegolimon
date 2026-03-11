"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/lib/stores/sessionStore";
import { ROLES_ORDERED, ROLE_INFO, SCENARIO_INFO } from "@/lib/engine/constants";
import type { Role, Player, Game } from "@/lib/engine/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";

function getUserId(): string {
  const match = document.cookie.match(/(?:^|;\s*)user_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

interface LobbyViewProps {
  roomCode: string;
  initialGame: Game;
}

export default function LobbyView({ roomCode, initialGame }: LobbyViewProps) {
  const router = useRouter();
  const session = useSessionStore();
  const [game, setGame] = useState<Game>(initialGame);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [fillingBots, setFillingBots] = useState(false);
  const [starting, setStarting] = useState(false);
  const [claimingRole, setClaimingRole] = useState<Role | null>(null);
  const [nameInput, setNameInput] = useState("");

  const userId = getUserId();
  const isHost = game.host_user_id === userId;
  const myPlayer = players.find((p) => p.user_id === userId);
  const takenRoles = new Set(players.map((p) => p.role));
  const allRolesFilled = ROLES_ORDERED.every((r) => takenRoles.has(r));

  const scenarioInfo = SCENARIO_INFO.find((s) => s.key === game.scenario);

  // Fetch players
  const fetchPlayers = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("players")
      .select("*")
      .eq("game_id", game.id)
      .order("joined_at", { ascending: true });
    if (data) setPlayers(data);
    setLoading(false);
  }, [game.id]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  // Realtime subscriptions
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`lobby-${game.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "players",
          filter: `game_id=eq.${game.id}`,
        },
        () => {
          fetchPlayers();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${game.id}`,
        },
        (payload) => {
          const updated = payload.new as Game;
          setGame(updated);
          if (updated.status === "playing") {
            router.push(`/game/${roomCode}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [game.id, roomCode, router, fetchPlayers]);

  // Redirect if game already playing
  useEffect(() => {
    if (game.status === "playing") {
      router.push(`/game/${roomCode}`);
    } else if (game.status === "finished") {
      router.push(`/results/${roomCode}`);
    }
  }, [game.status, roomCode, router]);

  async function claimRole(role: Role) {
    if (myPlayer) {
      toast.error("Ya tienes un rol asignado");
      return;
    }

    const displayName = session.displayName || "Jugador";
    setClaimingRole(role);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("players").insert({
        game_id: game.id,
        user_id: userId,
        display_name: displayName,
        role,
        is_bot: false,
        is_host: isHost,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Ese rol ya fue tomado");
        } else {
          throw error;
        }
      } else {
        session.setCurrentRole(role);
        toast.success(`Rol asignado: ${ROLE_INFO[role].emoji} ${ROLE_INFO[role].name}`);
      }
    } catch (err: any) {
      toast.error("Error: " + (err.message || err));
    }
    setClaimingRole(null);
  }

  async function fillWithBots() {
    setFillingBots(true);
    try {
      const supabase = createClient();
      const emptyRoles = ROLES_ORDERED.filter((r) => !takenRoles.has(r));

      const botRows = emptyRoles.map((role) => ({
        game_id: game.id,
        user_id: `bot-${role}`,
        display_name: `Bot ${ROLE_INFO[role].name}`,
        role,
        is_bot: true,
        is_host: false,
      }));

      if (botRows.length > 0) {
        const { error } = await supabase.from("players").insert(botRows);
        if (error) throw error;
        toast.success(`${botRows.length} bot(s) agregados`);
      }
    } catch (err: any) {
      toast.error("Error al agregar bots: " + (err.message || err));
    }
    setFillingBots(false);
  }

  async function startGame() {
    setStarting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("games")
        .update({ status: "playing" })
        .eq("id", game.id);

      if (error) throw error;
      // Realtime will trigger navigation for all clients
    } catch (err: any) {
      toast.error("Error al iniciar: " + (err.message || err));
      setStarting(false);
    }
  }

  function copyCode() {
    navigator.clipboard.writeText(roomCode);
    toast.success("Codigo copiado");
  }

  function handleSetName() {
    if (!nameInput.trim()) {
      toast.error("Ingresa tu nombre");
      return;
    }
    session.setDisplayName(nameInput.trim());
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-lemon-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // If no display name yet (host arrives without name), ask for it first
  if (!session.displayName) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <h2 className="text-xl font-bold text-earth-800 mb-1">
            🍋 Sala de Espera
          </h2>
          <p className="text-sm text-earth-500 mb-4">
            Codigo: <span className="font-mono font-bold text-campo-700">{roomCode}</span>
          </p>
          <div className="space-y-4">
            <Input
              label="Tu nombre"
              placeholder="Ej: Maria"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={20}
              onKeyDown={(e) => e.key === "Enter" && handleSetName()}
            />
            <Button onClick={handleSetName} size="lg" className="w-full">
              Continuar
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-campo-700 mb-2">
          🍋 Sala de Espera
        </h1>
        {scenarioInfo && (
          <Badge color="bg-lemon-100 text-lemon-700">
            {scenarioInfo.emoji} {scenarioInfo.name}
          </Badge>
        )}
      </div>

      {/* Room Code */}
      <Card className="mb-8 text-center">
        <p className="text-sm text-earth-500 mb-1">Codigo de sala</p>
        <button
          onClick={copyCode}
          className="font-mono text-4xl font-bold tracking-[0.3em] text-campo-700 hover:text-campo-600 transition-colors"
          title="Click para copiar"
        >
          {roomCode}
        </button>
        <p className="text-xs text-earth-400 mt-1">
          Click para copiar y compartir
        </p>
      </Card>

      {/* Role Slots */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {ROLES_ORDERED.map((role) => {
          const info = ROLE_INFO[role];
          const player = players.find((p) => p.role === role);
          const isMe = player?.user_id === userId;
          const isClaiming = claimingRole === role;

          return (
            <div
              key={role}
              className={`rounded-xl border-2 p-4 transition-all ${
                player
                  ? isMe
                    ? "border-lemon-500 bg-lemon-50"
                    : "border-campo-300 bg-campo-50"
                  : "border-earth-200 bg-white hover:border-lemon-400 cursor-pointer"
              }`}
              onClick={() => {
                if (!player && !myPlayer) claimRole(role);
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{info.emoji}</span>
                  <div>
                    <p className="font-semibold text-earth-800">{info.name}</p>
                    <p className="text-xs text-earth-500">{info.description}</p>
                  </div>
                </div>

                {player ? (
                  <div className="text-right">
                    <p className="text-sm font-medium text-campo-700">
                      {player.display_name}
                    </p>
                    {player.is_bot && (
                      <Badge color="bg-earth-200 text-earth-600">Bot</Badge>
                    )}
                    {isMe && (
                      <Badge color="bg-lemon-200 text-lemon-700">Tu</Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-earth-400">
                    {isClaiming ? (
                      <span className="animate-pulse">Asignando...</span>
                    ) : myPlayer ? (
                      "Disponible"
                    ) : (
                      "Click para unirse"
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Controls */}
      {isHost && (
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {!allRolesFilled && (
            <Button
              variant="secondary"
              onClick={fillWithBots}
              loading={fillingBots}
            >
              Llenar con Bots
            </Button>
          )}
          <Button
            onClick={startGame}
            loading={starting}
            disabled={!allRolesFilled}
            size="lg"
          >
            Iniciar Partida
          </Button>
        </div>
      )}

      {/* Non-host message */}
      {!isHost && myPlayer && (
        <p className="text-earth-500 text-sm animate-pulse">
          Esperando a que el host inicie la partida...
        </p>
      )}

      {/* Not joined yet hint */}
      {!myPlayer && (
        <p className="text-earth-500 text-sm">
          Selecciona un rol para unirte a la partida
        </p>
      )}
    </div>
  );
}
