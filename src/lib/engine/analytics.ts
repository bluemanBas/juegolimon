import type { Role, WeeklyState, GameEvent } from "./types";
import { ROLES_ORDERED, ROLE_INFO } from "./constants";

/** Compute variance of a number array */
function variance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, x) => sum + (x - mean) ** 2, 0) / arr.length;
}

/** Bullwhip Index: variance of orders / variance of consumer demand */
export function bullwhipIndex(orders: number[], demand: number[]): number {
  const orderVar = variance(orders);
  const demandVar = variance(demand);
  if (demandVar === 0) return orderVar === 0 ? 1 : Infinity;
  return orderVar / demandVar;
}

/** Traffic light color for bullwhip index */
export function bullwhipColor(index: number): "green" | "yellow" | "red" {
  if (index < 1.5) return "green";
  if (index <= 3) return "yellow";
  return "red";
}

export interface CostBreakdown {
  inventory: number;
  backlog: number;
  total: number;
}

/** Total costs for a role across all weeks */
export function totalCosts(states: WeeklyState[]): CostBreakdown {
  const inventory = states.reduce((s, w) => s + Number(w.inventory_cost), 0);
  const backlog = states.reduce((s, w) => s + Number(w.backlog_cost), 0);
  return { inventory, backlog, total: inventory + backlog };
}

export interface RoleSummary {
  role: Role;
  roleName: string;
  weeksWithBacklog: number;
  maxInventory: number;
  maxOrder: number;
  totalCost: number;
  inventoryCost: number;
  backlogCost: number;
}

/** Summary stats per role */
export function summaryStats(
  allStates: WeeklyState[],
  roles: Role[] = ROLES_ORDERED
): RoleSummary[] {
  return roles.map((role) => {
    const states = allStates.filter((s) => s.player_role === role);
    const costs = totalCosts(states);

    return {
      role,
      roleName: ROLE_INFO[role].name,
      weeksWithBacklog: states.filter((s) => s.backlog > 0).length,
      maxInventory: Math.max(...states.map((s) => s.inventory), 0),
      maxOrder: Math.max(
        ...states.map((s) => s.order_placed ?? 0),
        0
      ),
      totalCost: costs.total,
      inventoryCost: costs.inventory,
      backlogCost: costs.backlog,
    };
  });
}

export interface OrdersVsDemandRow {
  week: number;
  demand: number;
  campo: number;
  packing: number;
  distribucion: number;
  retail: number;
}

/** Prepare data for the bullwhip chart (orders vs demand per week) */
export function ordersVsDemandData(
  allStates: WeeklyState[],
  demandSchedule: number[]
): OrdersVsDemandRow[] {
  const maxWeek = Math.max(...allStates.map((s) => s.week), 0);
  const rows: OrdersVsDemandRow[] = [];

  for (let w = 0; w <= maxWeek; w++) {
    const row: OrdersVsDemandRow = {
      week: w,
      demand: demandSchedule[w] ?? 0,
      campo: 0,
      packing: 0,
      distribucion: 0,
      retail: 0,
    };

    for (const role of ROLES_ORDERED) {
      const state = allStates.find(
        (s) => s.player_role === role && s.week === w
      );
      row[role] = state?.order_placed ?? 0;
    }

    rows.push(row);
  }

  return rows;
}

export interface InventoryRow {
  week: number;
  campo: number;
  packing: number;
  distribucion: number;
  retail: number;
}

/** Prepare data for inventory evolution chart */
export function inventoryData(allStates: WeeklyState[]): InventoryRow[] {
  const maxWeek = Math.max(...allStates.map((s) => s.week), 0);
  const rows: InventoryRow[] = [];

  for (let w = 0; w <= maxWeek; w++) {
    const row: InventoryRow = {
      week: w,
      campo: 0,
      packing: 0,
      distribucion: 0,
      retail: 0,
    };

    for (const role of ROLES_ORDERED) {
      const state = allStates.find(
        (s) => s.player_role === role && s.week === w
      );
      // Show inventory as positive, backlog as negative
      if (state) {
        row[role] = state.backlog > 0 ? -state.backlog : state.inventory;
      }
    }

    rows.push(row);
  }

  return rows;
}

export interface EventImpactRow {
  week: number;
  event: string;
  targetRole: Role;
  description: string;
  emoji: string;
}

/** Prepare event timeline data */
export function eventTimeline(events: GameEvent[]): EventImpactRow[] {
  const emojiMap: Record<string, string> = {
    frost: "\u{1F328}\uFE0F",
    plague: "\u{1F41B}",
    heavy_rain: "\u{1F327}\uFE0F",
    cold_storage_failure: "\u26A1",
    trucker_strike: "\u{1F69B}",
    retail_promotion: "\u{1F4C8}",
  };

  return events
    .sort((a, b) => a.week - b.week)
    .map((e) => ({
      week: e.week,
      event: e.event,
      targetRole: e.target_role,
      description: e.description,
      emoji: emojiMap[e.event] || "\u2753",
    }));
}
