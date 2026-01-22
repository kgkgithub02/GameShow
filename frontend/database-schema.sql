-- Game Show App Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(8) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, in_progress, completed
  current_round INT DEFAULT 0,
  current_round_type VARCHAR(50),
  difficulty VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) NOT NULL,
  score INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  connected BOOLEAN DEFAULT true,
  last_seen TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Game state table (stores current round state)
CREATE TABLE game_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE UNIQUE,
  current_question TEXT,
  current_category VARCHAR(100),
  current_points INT,
  time_remaining INT,
  can_buzz BOOLEAN DEFAULT false,
  buzzed_team_id UUID REFERENCES teams(id),
  current_turn_team_id UUID REFERENCES teams(id),
  round_data JSONB, -- Store round-specific data (e.g., Connect 4 board)
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Buzzes table (audit trail)
CREATE TABLE buzzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id),
  player_id UUID REFERENCES players(id),
  question_text TEXT,
  was_first BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE buzzes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow all for now - refine based on your auth setup)
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);
CREATE POLICY "Allow all operations on teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
CREATE POLICY "Allow all operations on game_state" ON game_state FOR ALL USING (true);
CREATE POLICY "Allow all operations on buzzes" ON buzzes FOR ALL USING (true);

-- Indexes for performance
CREATE INDEX idx_games_code ON games(code);
CREATE INDEX idx_teams_game_id ON teams(game_id);
CREATE INDEX idx_players_game_id ON players(game_id);
CREATE INDEX idx_players_team_id ON players(team_id);
CREATE INDEX idx_game_state_game_id ON game_state(game_id);
CREATE INDEX idx_buzzes_game_id ON buzzes(game_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_game_state_updated_at BEFORE UPDATE ON game_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;
ALTER PUBLICATION supabase_realtime ADD TABLE buzzes;

-- Sample query to test (optional)
-- INSERT INTO games (code, difficulty, status) VALUES ('ABC123', 'medium-hard', 'waiting');
