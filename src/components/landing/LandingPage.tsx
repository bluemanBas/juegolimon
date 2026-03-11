"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useSessionStore } from "@/lib/stores/sessionStore";
import { generateRoomCode } from "@/lib/utils/roomCode";
import { generateDemandSchedule } from "@/lib/engine/scenarios";
import { createInitialStates } from "@/lib/engine/simulation";
import type { ScenarioId } from "@/lib/engine/types";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import ScenarioSelector from "./ScenarioSelector";

function getUserId(): string {
  const match = document.cookie.match(/(?:^|;\s*)user_id=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export default function LandingPage() {
  const router = useRouter();
  const session = useSessionStore();

  // Create game state
  const [createName, setCreateName] = useState("");
  const [scenario, setScenario] = useState<ScenarioId>("normal");
  const [creating, setCreating] = useState(false);

  // Join game state
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");

  async function handleCreate() {
    if (!createName.trim()) {
      toast.error("Ingresa tu nombre");
      return;
    }

    setCreating(true);
    try {
      const supabase = createClient();
      const userId = getUserId();
      const roomCode = generateRoomCode();
      const seed = Math.floor(Math.random() * 2147483647);

      // Insert game
      const { data: game, error: gameError } = await supabase
        .from("games")
        .insert({
          room_code: roomCode,
          host_user_id: userId,
          scenario,
          seed,
        })
        .select()
        .single();

      if (gameError) throw gameError;

      // Insert demand schedule
      const demandSchedule = generateDemandSchedule(scenario);
      const demandRows = demandSchedule.map((demand, week) => ({
        game_id: game.id,
        week,
        demand,
      }));
      const { error: demandError } = await supabase
        .from("demand_schedule")
        .insert(demandRows);
      if (demandError) throw demandError;

      // Insert initial weekly states
      const initialStates = createInitialStates(game.id);
      const { error: statesError } = await supabase
        .from("weekly_states")
        .insert(initialStates);
      if (statesError) throw statesError;

      // Update session store
      session.setUserId(userId);
      session.setDisplayName(createName.trim());
      session.setGameId(game.id);
      session.setRoomCode(roomCode);

      router.push(`/lobby/${roomCode}`);
    } catch (err: any) {
      toast.error("Error al crear partida: " + (err.message || err));
      setCreating(false);
    }
  }

  async function handleJoin() {
    if (!joinName.trim()) {
      toast.error("Ingresa tu nombre");
      return;
    }
    if (joinCode.length !== 6) {
      toast.error("El codigo debe tener 6 caracteres");
      return;
    }

    setJoining(true);
    try {
      const supabase = createClient();
      const userId = getUserId();
      const code = joinCode.toUpperCase();

      // Find the game
      const { data: game, error: gameError } = await supabase
        .from("games")
        .select()
        .eq("room_code", code)
        .eq("status", "waiting")
        .single();

      if (gameError || !game) {
        toast.error("Sala no encontrada o ya iniciada");
        setJoining(false);
        return;
      }

      // Update session store (player record created in lobby when picking role)
      session.setUserId(userId);
      session.setDisplayName(joinName.trim());
      session.setGameId(game.id);
      session.setRoomCode(code);

      router.push(`/lobby/${code}`);
    } catch (err: any) {
      toast.error("Error al unirse: " + (err.message || err));
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold text-campo-700 mb-2">
          <span className="text-6xl">🍋</span> Juego del Limon
        </h1>
        <p className="text-earth-500 text-lg max-w-md mx-auto">
          Simulacion de cadena de suministro agricola &mdash; Aprende sobre el
          Efecto Bullwhip
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-earth-200 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "create"
              ? "bg-white text-earth-800 shadow-sm"
              : "text-earth-500 hover:text-earth-700"
          }`}
        >
          Crear Partida
        </button>
        <button
          onClick={() => setActiveTab("join")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "join"
              ? "bg-white text-earth-800 shadow-sm"
              : "text-earth-500 hover:text-earth-700"
          }`}
        >
          Unirse a Partida
        </button>
      </div>

      {/* Forms */}
      <div className="w-full max-w-lg">
        {activeTab === "create" ? (
          <Card>
            <h2 className="text-xl font-bold text-earth-800 mb-4">
              Crear Nueva Partida
            </h2>

            <div className="space-y-4">
              <Input
                label="Tu nombre"
                placeholder="Ej: Maria"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                maxLength={20}
              />

              <div>
                <label className="block text-sm font-medium text-earth-700 mb-2">
                  Escenario
                </label>
                <ScenarioSelector
                  selected={scenario}
                  onSelect={setScenario}
                />
              </div>

              <Button
                onClick={handleCreate}
                loading={creating}
                size="lg"
                className="w-full"
              >
                Crear Partida
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <h2 className="text-xl font-bold text-earth-800 mb-4">
              Unirse a una Partida
            </h2>

            <div className="space-y-4">
              <Input
                label="Tu nombre"
                placeholder="Ej: Carlos"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                maxLength={20}
              />

              <Input
                label="Codigo de sala"
                placeholder="ABC123"
                value={joinCode}
                onChange={(e) =>
                  setJoinCode(e.target.value.toUpperCase().slice(0, 6))
                }
                maxLength={6}
                className="font-mono text-lg tracking-widest text-center"
              />

              <Button
                onClick={handleJoin}
                loading={joining}
                size="lg"
                className="w-full"
              >
                Unirse
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-8 text-center text-earth-400 text-sm max-w-md">
        <p>
          Basado en el MIT Beer Game. 4 jugadores compiten gestionando una
          cadena de suministro de limones durante 20 semanas.
        </p>
      </div>
    </div>
  );
}
