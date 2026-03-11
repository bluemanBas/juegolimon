import type { Role, EventType, RoleInfo, ScenarioInfo } from "./types";

export const ROLES_ORDERED: Role[] = [
  "campo",
  "packing",
  "distribucion",
  "retail",
];

export const UPSTREAM: Record<Role, Role | "supplier"> = {
  retail: "distribucion",
  distribucion: "packing",
  packing: "campo",
  campo: "supplier",
};

export const DOWNSTREAM: Record<Role, Role | "consumer"> = {
  campo: "packing",
  packing: "distribucion",
  distribucion: "retail",
  retail: "consumer",
};

export const INVENTORY_COST = 0.5;
export const BACKLOG_COST = 1.0;
export const BASE_LEAD_TIME = 2;
export const INITIAL_INVENTORY = 12;
export const INITIAL_PIPELINE = 4;
export const MAX_WEEKS = 20;

export const EVENT_CONFIG: Record<
  EventType,
  { probability: number; targetRole: Role; emoji: string; name: string }
> = {
  frost: {
    probability: 0.1,
    targetRole: "campo",
    emoji: "\u{1F328}\uFE0F",
    name: "Helada",
  },
  plague: {
    probability: 0.08,
    targetRole: "campo",
    emoji: "\u{1F41B}",
    name: "Plaga",
  },
  heavy_rain: {
    probability: 0.12,
    targetRole: "campo",
    emoji: "\u{1F327}\uFE0F",
    name: "Lluvias excesivas",
  },
  cold_storage_failure: {
    probability: 0.07,
    targetRole: "distribucion",
    emoji: "\u26A1",
    name: "Falla en c\u00E1mara de fr\u00EDo",
  },
  trucker_strike: {
    probability: 0.06,
    targetRole: "distribucion",
    emoji: "\u{1F69B}",
    name: "Paro de transportistas",
  },
  retail_promotion: {
    probability: 0.15,
    targetRole: "retail",
    emoji: "\u{1F4C8}",
    name: "Promoci\u00F3n en retail",
  },
};

export const ROLE_INFO: Record<Role, RoleInfo> = {
  campo: {
    key: "campo",
    name: "Campo",
    emoji: "\u{1F33F}",
    description: "Cosecha y producci\u00F3n de limones",
    color: "#22c55e",
  },
  packing: {
    key: "packing",
    name: "Packing House",
    emoji: "\u{1F3ED}",
    description: "Selecci\u00F3n, calibrado y embalaje",
    color: "#f59e0b",
  },
  distribucion: {
    key: "distribucion",
    name: "Distribuci\u00F3n",
    emoji: "\u{1F69B}",
    description: "Centro log\u00EDstico con c\u00E1mara de fr\u00EDo",
    color: "#3b82f6",
  },
  retail: {
    key: "retail",
    name: "Retail",
    emoji: "\u{1F6D2}",
    description: "Supermercado / punto de venta final",
    color: "#ef4444",
  },
};

export const SCENARIO_INFO: ScenarioInfo[] = [
  {
    key: "normal",
    name: "Temporada Normal",
    description:
      "Demanda estable con salto en dia 5. Escenario base del Beer Game.",
    emoji: "\u{1F34B}",
  },
  {
    key: "high_season",
    name: "Temporada Alta (Verano)",
    description:
      "Demanda alta y creciente desde el inicio (8\u219212\u219216 cajas).",
    emoji: "\u2600\uFE0F",
  },
  {
    key: "oversupply",
    name: "Sobreoferta",
    description:
      "Alta demanda que colapsa abruptamente en dia 8.",
    emoji: "\u{1F4C9}",
  },
  {
    key: "supply_crisis",
    name: "Crisis de Abastecimiento",
    description:
      "Lead time aleatorio entre 1 y 4 dias.",
    emoji: "\u26A0\uFE0F",
  },
];

export const ROLE_CHART_COLORS: Record<Role, string> = {
  campo: "#22c55e",
  packing: "#f59e0b",
  distribucion: "#3b82f6",
  retail: "#ef4444",
};

export const DEMAND_CHART_COLOR = "#8b5cf6";
