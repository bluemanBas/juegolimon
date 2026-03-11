export type Role = "campo" | "packing" | "distribucion" | "retail";
export type GameStatus = "waiting" | "playing" | "finished";
export type ScenarioId = "normal" | "high_season" | "oversupply" | "supply_crisis";
export type EventType =
  | "frost"
  | "plague"
  | "heavy_rain"
  | "cold_storage_failure"
  | "trucker_strike"
  | "retail_promotion";

export interface Game {
  id: string;
  room_code: string;
  host_user_id: string;
  scenario: ScenarioId;
  status: GameStatus;
  current_week: number;
  max_weeks: number;
  seed: number;
  show_all_info: boolean;
  events_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  user_id: string;
  display_name: string;
  role: Role;
  is_bot: boolean;
  is_host: boolean;
  joined_at: string;
}

export interface WeeklyState {
  id?: string;
  game_id: string;
  player_role: Role;
  week: number;
  inventory: number;
  backlog: number;
  incoming_order: number;
  incoming_shipment: number;
  pipeline_1: number;
  pipeline_2: number;
  order_placed: number | null;
  units_shipped: number;
  inventory_cost: number;
  backlog_cost: number;
  confirmed: boolean;
  pipeline_detail?: PipelineEntry[];
}

export interface PipelineEntry {
  amount: number;
  arrives_at_week: number;
}

export interface GameEvent {
  id?: string;
  game_id: string;
  week: number;
  event: EventType;
  target_role: Role;
  magnitude: number;
  description: string;
  created_at?: string;
}

export interface DemandEntry {
  game_id: string;
  week: number;
  demand: number;
}

export interface TickInput {
  currentStates: Record<Role, WeeklyState>;
  consumerDemand: number;
  events: GameEvent[];
  scenario: ScenarioId;
  week: number;
  seed: number;
  activeEffects: ActiveEffect[];
}

export interface TickOutput {
  nextStates: Record<Role, WeeklyState>;
  shippedAmounts: Record<Role, number>;
}

export interface ActiveEffect {
  event: EventType;
  target_role: Role;
  weeks_remaining: number;
}

export interface RoleInfo {
  key: Role;
  name: string;
  emoji: string;
  description: string;
  color: string;
}

export interface ScenarioInfo {
  key: ScenarioId;
  name: string;
  description: string;
  emoji: string;
}
