"use client";

import { SCENARIO_INFO } from "@/lib/engine/constants";
import type { ScenarioId } from "@/lib/engine/types";
import Badge from "@/components/ui/Badge";

interface WeekHeaderProps {
  currentWeek: number;
  maxWeeks: number;
  scenario: ScenarioId;
}

export default function WeekHeader({
  currentWeek,
  maxWeeks,
  scenario,
}: WeekHeaderProps) {
  const scenarioInfo = SCENARIO_INFO.find((s) => s.key === scenario);
  const progress = Math.min((currentWeek / maxWeeks) * 100, 100);

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row items-center gap-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🍋</span>
        <div>
          <h2 className="text-lg font-bold text-earth-800">
            Semana {currentWeek}{" "}
            <span className="text-earth-400 font-normal">/ {maxWeeks}</span>
          </h2>
          {scenarioInfo && (
            <Badge color="bg-lemon-100 text-lemon-700">
              {scenarioInfo.emoji} {scenarioInfo.name}
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex-1 w-full sm:w-auto">
        <div className="h-3 bg-earth-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-campo-400 to-lemon-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
