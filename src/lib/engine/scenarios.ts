import type { ScenarioId } from "./types";

export function generateDemandSchedule(scenario: ScenarioId): number[] {
  switch (scenario) {
    case "normal":
      // 4 cajas/semana las primeras 4 semanas, luego 8
      return [4, 4, 4, 4, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];

    case "high_season":
      // Demanda alta y creciente: 8→10→12→14→16
      return [8, 8, 8, 8, 10, 10, 10, 10, 12, 12, 12, 12, 14, 14, 14, 14, 16, 16, 16, 16];

    case "oversupply":
      // Alta demanda que colapsa en semana 8
      return [8, 8, 8, 8, 12, 12, 12, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

    case "supply_crisis":
      // Misma demanda que normal, pero lead times variables (manejado en simulation)
      return [4, 4, 4, 4, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];

    default:
      return [4, 4, 4, 4, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8];
  }
}
