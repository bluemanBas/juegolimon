import type { Role, WeeklyState, GameEvent, ScenarioId, TickInput, TickOutput } from "./types";
import {
  ROLES_ORDERED,
  UPSTREAM,
  DOWNSTREAM,
  INVENTORY_COST,
  BACKLOG_COST,
  INITIAL_INVENTORY,
  INITIAL_PIPELINE,
} from "./constants";
import { isPlagueActive, isHeavyRainActive, isTruckerStrikeActive } from "./events";
import { SeededRandom } from "../utils/seededRandom";

/**
 * Core simulation tick — pure function.
 * Advances the game from week N to week N+1.
 *
 * Processing order: upstream → downstream (campo → packing → distribucion → retail)
 * Each role:
 *   1. Receive shipment (pipeline_2 arrives)
 *   2. Apply inventory-damaging events (frost, cold storage failure)
 *   3. Receive order from downstream
 *   4. Apply demand-modifying events (retail promotion)
 *   5. Fulfill order (ship what you can)
 *   6. Apply shipping restrictions (trucker strike)
 *   7. Calculate costs
 *   8. Advance pipeline
 */
export function tick(input: TickInput): TickOutput {
  const { currentStates, consumerDemand, events, scenario, week, seed } = input;

  // Collect all past events to check for multi-week effects
  const allEvents = events;
  const weekEvents = events.filter((e) => e.week === week);

  // Track how much each role ships this tick (needed for pipeline of downstream)
  const shippedAmounts: Record<Role, number> = {
    campo: 0,
    packing: 0,
    distribucion: 0,
    retail: 0,
  };

  const nextStates: Partial<Record<Role, WeeklyState>> = {};

  // Process upstream to downstream
  for (const role of ROLES_ORDERED) {
    const current = currentStates[role];
    const gameId = current.game_id;

    // 1. RECEIVE SHIPMENT
    let incomingShipment: number;
    if (scenario === "supply_crisis") {
      // Variable lead times — check pipeline_detail
      const detail = current.pipeline_detail || [];
      incomingShipment = detail
        .filter((p) => p.arrives_at_week <= week + 1)
        .reduce((sum, p) => sum + p.amount, 0);
    } else {
      incomingShipment = current.pipeline_2;
    }

    // 2. ADD TO INVENTORY
    let inventory = current.inventory + incomingShipment;

    // 3. APPLY INVENTORY-DAMAGING EVENTS
    for (const evt of weekEvents) {
      if (evt.target_role !== role) continue;

      if (evt.event === "frost") {
        const loss = Math.floor(inventory * evt.magnitude);
        inventory = inventory - loss;
      }
      if (evt.event === "cold_storage_failure") {
        const loss = Math.floor(inventory * evt.magnitude);
        inventory = inventory - loss;
      }
    }

    // Apply plague effect (halves effective production/capacity)
    if (role === "campo" && isPlagueActive(allEvents, week)) {
      // Plague halves what Campo can ship, not inventory directly
      // We'll handle this in the shipping step
    }

    // 4. RECEIVE ORDER FROM DOWNSTREAM
    let incomingOrder: number;
    if (role === "retail") {
      // Retail receives consumer demand
      incomingOrder = consumerDemand;

      // Check for retail promotion
      const promotion = weekEvents.find((e) => e.event === "retail_promotion");
      if (promotion) {
        incomingOrder = Math.floor(incomingOrder * promotion.magnitude);
      }
    } else {
      // Receive order from downstream role
      const downstreamRole = DOWNSTREAM[role] as Role;
      const downstreamState = currentStates[downstreamRole];
      incomingOrder = downstreamState.order_placed ?? 0;
    }

    // 5. FULFILL ORDER
    const totalDemand = incomingOrder + current.backlog;
    let maxCanShip = inventory;

    // Plague reduces Campo's shipping capacity
    if (role === "campo" && isPlagueActive(allEvents, week)) {
      maxCanShip = Math.floor(maxCanShip / 2);
    }

    // Trucker strike prevents Distribucion from shipping
    if (role === "distribucion" && isTruckerStrikeActive(weekEvents, week)) {
      maxCanShip = 0;
    }

    const unitsShipped = Math.min(totalDemand, maxCanShip);
    const newBacklog = totalDemand - unitsShipped;
    const newInventory = inventory - unitsShipped;

    shippedAmounts[role] = unitsShipped;

    // 6. CALCULATE COSTS
    const inventoryCost = newInventory * INVENTORY_COST;
    const backlogCost = newBacklog * BACKLOG_COST;

    // 7. ADVANCE PIPELINE
    let newPipeline1: number;
    let newPipeline2: number;
    let newPipelineDetail = undefined;

    const upstreamKey = UPSTREAM[role];
    if (upstreamKey === "supplier") {
      // Campo orders from infinite supplier — always fulfilled
      const orderPlaced = current.order_placed ?? 0;

      if (scenario === "supply_crisis") {
        // Variable lead time
        const rng = new SeededRandom(seed * 1000 + week * 10 + ROLES_ORDERED.indexOf(role));
        const leadTime = rng.nextInt(1, 4);
        const existingDetail = (current.pipeline_detail || []).filter(
          (p) => p.arrives_at_week > week + 1
        );
        newPipelineDetail = [
          ...existingDetail,
          { amount: orderPlaced, arrives_at_week: week + 1 + leadTime },
        ];
        // For display purposes, approximate pipeline_1 and pipeline_2
        newPipeline1 = newPipelineDetail
          .filter((p) => p.arrives_at_week === week + 2)
          .reduce((s, p) => s + p.amount, 0);
        newPipeline2 = newPipelineDetail
          .filter((p) => p.arrives_at_week === week + 3)
          .reduce((s, p) => s + p.amount, 0);
      } else {
        // Heavy rain adds 1 week lead time between supplier and campo
        if (isHeavyRainActive(weekEvents, week)) {
          // pipeline_1 stays an extra week, new order goes to pipeline_1 next
          newPipeline2 = current.pipeline_1; // delayed
          newPipeline1 = orderPlaced;
        } else {
          newPipeline2 = current.pipeline_1;
          newPipeline1 = orderPlaced;
        }
      }
    } else {
      // Normal: pipeline_2 = old pipeline_1, pipeline_1 = what upstream shipped to me
      const upstreamRole = upstreamKey as Role;
      const upstreamShipped = shippedAmounts[upstreamRole] ?? 0;

      if (scenario === "supply_crisis") {
        const rng = new SeededRandom(seed * 1000 + week * 10 + ROLES_ORDERED.indexOf(role));
        const leadTime = rng.nextInt(1, 4);
        const existingDetail = (current.pipeline_detail || []).filter(
          (p) => p.arrives_at_week > week + 1
        );
        newPipelineDetail = [
          ...existingDetail,
          { amount: upstreamShipped, arrives_at_week: week + 1 + leadTime },
        ];
        newPipeline1 = newPipelineDetail
          .filter((p) => p.arrives_at_week === week + 2)
          .reduce((s, p) => s + p.amount, 0);
        newPipeline2 = newPipelineDetail
          .filter((p) => p.arrives_at_week === week + 3)
          .reduce((s, p) => s + p.amount, 0);
      } else {
        // Heavy rain only affects Campo→Packing lead time
        if (
          role === "packing" &&
          isHeavyRainActive(weekEvents, week)
        ) {
          newPipeline2 = current.pipeline_1; // delayed
          newPipeline1 = upstreamShipped;
        } else {
          newPipeline2 = current.pipeline_1;
          newPipeline1 = upstreamShipped;
        }
      }
    }

    // 8. CREATE NEXT WEEK STATE
    const nextState: WeeklyState = {
      game_id: gameId,
      player_role: role,
      week: week + 1,
      inventory: newInventory,
      backlog: newBacklog,
      incoming_order: incomingOrder,
      incoming_shipment: incomingShipment,
      pipeline_1: newPipeline1,
      pipeline_2: newPipeline2,
      order_placed: null,
      units_shipped: unitsShipped,
      inventory_cost: inventoryCost,
      backlog_cost: backlogCost,
      confirmed: false,
      pipeline_detail: newPipelineDetail,
    };

    nextStates[role] = nextState;
  }

  return {
    nextStates: nextStates as Record<Role, WeeklyState>,
    shippedAmounts,
  };
}

/**
 * Create the initial weekly states for week 0 (game start).
 */
export function createInitialStates(gameId: string): WeeklyState[] {
  return ROLES_ORDERED.map((role) => ({
    game_id: gameId,
    player_role: role,
    week: 0,
    inventory: INITIAL_INVENTORY,
    backlog: 0,
    incoming_order: 4, // Initial demand
    incoming_shipment: 4,
    pipeline_1: INITIAL_PIPELINE,
    pipeline_2: INITIAL_PIPELINE,
    order_placed: null,
    units_shipped: 4,
    inventory_cost: INITIAL_INVENTORY * INVENTORY_COST,
    backlog_cost: 0,
    confirmed: false,
    pipeline_detail: [],
  }));
}
