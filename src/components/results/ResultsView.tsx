"use client";

import { useRef } from "react";
import {
  ordersVsDemandData,
  inventoryData,
  summaryStats,
  eventTimeline,
} from "@/lib/engine/analytics";
import type { Game, Player, WeeklyState, GameEvent } from "@/lib/engine/types";
import { SCENARIO_INFO } from "@/lib/engine/constants";
import Badge from "@/components/ui/Badge";
import OrdersVsDemandChart from "./OrdersVsDemandChart";
import InventoryChart from "./InventoryChart";
import CostBreakdownChart from "./CostBreakdownChart";
import BullwhipDisplay from "./BullwhipDisplay";
import SummaryTable from "./SummaryTable";
import EventTimeline from "./EventTimeline";
import PlayerRanking from "./PlayerRanking";
import PdfExportButton from "./PdfExportButton";

interface ResultsViewProps {
  game: Game;
  players: Player[];
  weeklyStates: WeeklyState[];
  gameEvents: GameEvent[];
  demandSchedule: number[];
}

export default function ResultsView({
  game,
  players,
  weeklyStates,
  gameEvents,
  demandSchedule,
}: ResultsViewProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const scenarioInfo = SCENARIO_INFO.find((s) => s.key === game.scenario);

  const ordersData = ordersVsDemandData(weeklyStates, demandSchedule);
  const invData = inventoryData(weeklyStates);
  const summaries = summaryStats(weeklyStates);
  const events = eventTimeline(gameEvents);

  return (
    <div className="min-h-screen bg-earth-50 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-campo-700">
            🍋 Resultados del Juego
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-earth-500">
              Sala: {game.room_code}
            </span>
            {scenarioInfo && (
              <Badge color="bg-lemon-100 text-lemon-700">
                {scenarioInfo.emoji} {scenarioInfo.name}
              </Badge>
            )}
            <span className="text-sm text-earth-400">
              {game.max_weeks} semanas
            </span>
          </div>
        </div>
        <PdfExportButton targetRef={printRef} />
      </div>

      {/* Printable content */}
      <div ref={printRef} className="space-y-6">
        {/* Player Ranking */}
        <PlayerRanking players={players} summaries={summaries} />

        {/* Bullwhip Index */}
        <BullwhipDisplay
          weeklyStates={weeklyStates}
          demandSchedule={demandSchedule}
        />

        {/* Orders vs Demand Chart */}
        <OrdersVsDemandChart data={ordersData} />

        {/* Inventory Chart */}
        <InventoryChart data={invData} />

        {/* Cost Breakdown */}
        <CostBreakdownChart data={summaries} />

        {/* Summary Table */}
        <SummaryTable data={summaries} />

        {/* Event Timeline */}
        <EventTimeline events={events} />
      </div>

      {/* Back button */}
      <div className="text-center mt-8 mb-4">
        <a
          href="/"
          className="text-lemon-600 hover:text-lemon-700 underline text-sm"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  );
}
