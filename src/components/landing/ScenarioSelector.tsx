"use client";

import { SCENARIO_INFO } from "@/lib/engine/constants";
import type { ScenarioId } from "@/lib/engine/types";

interface ScenarioSelectorProps {
  selected: ScenarioId;
  onSelect: (id: ScenarioId) => void;
}

export default function ScenarioSelector({
  selected,
  onSelect,
}: ScenarioSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {SCENARIO_INFO.map((scenario) => (
        <button
          key={scenario.key}
          type="button"
          onClick={() => onSelect(scenario.key)}
          className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
            selected === scenario.key
              ? "border-lemon-500 bg-lemon-50 ring-2 ring-lemon-300"
              : "border-earth-200 bg-white hover:border-earth-300"
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{scenario.emoji}</span>
            <span className="font-semibold text-earth-800">
              {scenario.name}
            </span>
          </div>
          <p className="text-sm text-earth-500">{scenario.description}</p>
        </button>
      ))}
    </div>
  );
}
