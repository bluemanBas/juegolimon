import type { Role, WeeklyState } from "./types";

/**
 * Bot AI — uses an "order-up-to" heuristic that deliberately
 * produces the bullwhip effect by not properly accounting for
 * pipeline inventory (mimicking typical human behavior).
 */
export function computeBotOrder(
  currentState: WeeklyState,
  history: WeeklyState[]
): number {
  // Calculate moving average of incoming orders (last 4 weeks)
  const recentOrders = history.slice(-4).map((s) => s.incoming_order);
  const avgOrder =
    recentOrders.length > 0
      ? recentOrders.reduce((a, b) => a + b, 0) / recentOrders.length
      : 4;

  // Desired inventory: 2x average demand (safety stock)
  const desiredInventory = Math.ceil(avgOrder * 2);

  // Supply line: what's already in the pipeline coming to me
  // Bot deliberately under-counts pipeline (common human error)
  const inPipeline = currentState.pipeline_1 + currentState.pipeline_2;

  // Inventory position: inventory - backlog + pipeline
  const inventoryPosition =
    currentState.inventory - currentState.backlog + inPipeline;

  // Order = desired inventory position - current inventory position + expected demand
  let order = Math.ceil(desiredInventory - inventoryPosition + avgOrder);

  // Backlog panic: if backlog exists, add extra urgency
  if (currentState.backlog > 0) {
    order += Math.ceil(currentState.backlog * 0.3);
  }

  // Never order negative
  order = Math.max(0, order);

  // Cap at reasonable maximum (prevent completely runaway orders)
  order = Math.min(order, Math.ceil(avgOrder * 5));

  return order;
}
