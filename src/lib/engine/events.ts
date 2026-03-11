import type { EventType, GameEvent, Role } from "./types";
import { EVENT_CONFIG } from "./constants";
import { SeededRandom } from "../utils/seededRandom";

/**
 * Generate random events for a given week using seeded RNG.
 * Each event is rolled independently.
 */
export function generateEvents(
  gameId: string,
  week: number,
  rng: SeededRandom
): GameEvent[] {
  const events: GameEvent[] = [];

  const eventTypes = Object.keys(EVENT_CONFIG) as EventType[];

  for (const eventType of eventTypes) {
    const config = EVENT_CONFIG[eventType];

    if (rng.chance(config.probability)) {
      const event = createEvent(gameId, week, eventType, config.targetRole, rng);
      events.push(event);
    }
  }

  return events;
}

function createEvent(
  gameId: string,
  week: number,
  eventType: EventType,
  targetRole: Role,
  rng: SeededRandom
): GameEvent {
  let magnitude: number;
  let description: string;

  switch (eventType) {
    case "frost":
      magnitude = 0.4 + rng.next() * 0.2; // 40-60% loss
      description = `Helada severa: el Campo pierde ${Math.round(magnitude * 100)}% del inventario.`;
      break;

    case "plague":
      magnitude = 0.5; // Half production for 2 weeks
      description =
        "Plaga detectada: la produccion del Campo se reduce a la mitad por 2 dias.";
      break;

    case "heavy_rain":
      magnitude = 1; // +1 week lead time
      description =
        "Lluvias excesivas: se agrega 1 dia extra de lead time entre Campo y Packing House.";
      break;

    case "cold_storage_failure":
      magnitude = 0.3; // 30% inventory loss
      description =
        "Falla en camara de frio: Distribucion pierde 30% del inventario.";
      break;

    case "trucker_strike":
      magnitude = 1; // Can't ship for 1 week
      description =
        "Paro de transportistas: Distribucion no puede enviar a Retail este dia.";
      break;

    case "retail_promotion":
      magnitude = 2; // Double demand
      description =
        "Promocion en retail: la demanda del consumidor se duplica este dia.";
      break;

    default:
      magnitude = 1;
      description = "Evento desconocido.";
  }

  return {
    game_id: gameId,
    week,
    event: eventType,
    target_role: targetRole,
    magnitude,
    description,
  };
}

/**
 * Check if a plague effect is currently active (lasts 2 weeks)
 */
export function isPlagueActive(events: GameEvent[], currentWeek: number): boolean {
  return events.some(
    (e) =>
      e.event === "plague" &&
      e.week <= currentWeek &&
      e.week > currentWeek - 2
  );
}

/**
 * Check if heavy rain is active this week (adds lead time)
 */
export function isHeavyRainActive(events: GameEvent[], currentWeek: number): boolean {
  return events.some(
    (e) => e.event === "heavy_rain" && e.week === currentWeek
  );
}

/**
 * Check if trucker strike is active this week
 */
export function isTruckerStrikeActive(events: GameEvent[], currentWeek: number): boolean {
  return events.some(
    (e) => e.event === "trucker_strike" && e.week === currentWeek
  );
}
