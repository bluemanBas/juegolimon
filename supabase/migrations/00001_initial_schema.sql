-- Juego del Limón - Initial Schema

-- ENUM types
CREATE TYPE game_status AS ENUM ('waiting', 'playing', 'finished');
CREATE TYPE player_role AS ENUM ('campo', 'packing', 'distribucion', 'retail');
CREATE TYPE scenario_id AS ENUM ('normal', 'high_season', 'oversupply', 'supply_crisis');
CREATE TYPE event_type AS ENUM (
  'frost', 'plague', 'heavy_rain',
  'cold_storage_failure', 'trucker_strike', 'retail_promotion'
);

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code CHAR(6) UNIQUE NOT NULL,
  host_user_id TEXT NOT NULL,
  scenario scenario_id NOT NULL DEFAULT 'normal',
  status game_status NOT NULL DEFAULT 'waiting',
  current_week INT NOT NULL DEFAULT 0,
  max_weeks INT NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  seed INT NOT NULL DEFAULT floor(random() * 2147483647)::int
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role player_role NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(game_id, role),
  UNIQUE(game_id, user_id)
);

-- Weekly state per player per week
CREATE TABLE weekly_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_role player_role NOT NULL,
  week INT NOT NULL,
  inventory INT NOT NULL DEFAULT 12,
  backlog INT NOT NULL DEFAULT 0,
  incoming_order INT NOT NULL DEFAULT 0,
  incoming_shipment INT NOT NULL DEFAULT 0,
  pipeline_1 INT NOT NULL DEFAULT 0,
  pipeline_2 INT NOT NULL DEFAULT 0,
  order_placed INT,
  units_shipped INT NOT NULL DEFAULT 0,
  inventory_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  backlog_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  confirmed BOOLEAN NOT NULL DEFAULT false,
  pipeline_detail JSONB DEFAULT '[]',
  UNIQUE(game_id, player_role, week)
);

-- Game events
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  week INT NOT NULL,
  event event_type NOT NULL,
  target_role player_role NOT NULL,
  magnitude NUMERIC(5,2) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consumer demand schedule
CREATE TABLE demand_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  week INT NOT NULL,
  demand INT NOT NULL,
  UNIQUE(game_id, week)
);

-- Indexes
CREATE INDEX idx_weekly_states_game_week ON weekly_states(game_id, week);
CREATE INDEX idx_weekly_states_game_role ON weekly_states(game_id, player_role);
CREATE INDEX idx_game_events_game ON game_events(game_id, week);
CREATE INDEX idx_players_game ON players(game_id);
CREATE INDEX idx_games_room_code ON games(room_code);
CREATE INDEX idx_demand_schedule_game ON demand_schedule(game_id, week);

-- Row Level Security (permissive for anonymous sessions)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_select" ON games FOR SELECT USING (true);
CREATE POLICY "games_insert" ON games FOR INSERT WITH CHECK (true);
CREATE POLICY "games_update" ON games FOR UPDATE USING (true);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_select" ON players FOR SELECT USING (true);
CREATE POLICY "players_insert" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "players_update" ON players FOR UPDATE USING (true);
CREATE POLICY "players_delete" ON players FOR DELETE USING (true);

ALTER TABLE weekly_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ws_select" ON weekly_states FOR SELECT USING (true);
CREATE POLICY "ws_insert" ON weekly_states FOR INSERT WITH CHECK (true);
CREATE POLICY "ws_update" ON weekly_states FOR UPDATE USING (true);

ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select" ON game_events FOR SELECT USING (true);
CREATE POLICY "events_insert" ON game_events FOR INSERT WITH CHECK (true);

ALTER TABLE demand_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demand_select" ON demand_schedule FOR SELECT USING (true);
CREATE POLICY "demand_insert" ON demand_schedule FOR INSERT WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE weekly_states;
ALTER PUBLICATION supabase_realtime ADD TABLE game_events;
