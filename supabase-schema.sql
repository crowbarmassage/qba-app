-- ============================================================
-- MWBL DATABASE SCHEMA v3 - FULL FEATURED
-- Run this in Supabase SQL Editor
-- ============================================================

------------------------------------------------------------
-- 1. CORE TABLES
------------------------------------------------------------

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL,
  color TEXT DEFAULT '#1e3a5f',
  logo_url TEXT,
  motto TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  team_id INTEGER REFERENCES teams(id) ON DELETE SET NULL,
  jersey_number INTEGER,
  photo_url TEXT,
  position TEXT CHECK (position IN ('guard', 'forward', 'center', NULL)),
  is_captain BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Games
CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  week INTEGER NOT NULL,
  home_team_id INTEGER REFERENCES teams(id),
  away_team_id INTEGER REFERENCES teams(id),
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  game_time TEXT DEFAULT '6:00 PM',
  game_date DATE,
  court INTEGER DEFAULT 1,
  home_score INTEGER,
  away_score INTEGER,
  game_type TEXT DEFAULT 'regular' CHECK (game_type IN ('regular', 'playin', 'semifinal', 'final', 'third_place')),
  is_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- 2. ENGAGEMENT TABLES
------------------------------------------------------------

-- RSVPs ("Who's coming?")
CREATE TABLE IF NOT EXISTS rsvps (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('yes', 'no', 'maybe')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id)
);

-- Game Reactions (post-game emojis)
CREATE TABLE IF NOT EXISTS game_reactions (
  id SERIAL PRIMARY KEY,
  game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  reaction TEXT NOT NULL CHECK (reaction IN ('🔥', '😭', '💪', '👏', '😮', '❤️')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, user_id)
);

-- Player of the Week votes
CREATE TABLE IF NOT EXISTS potw_votes (
  id SERIAL PRIMARY KEY,
  week INTEGER NOT NULL,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(week, voter_id)
);

-- Player of the Week winners
CREATE TABLE IF NOT EXISTS potw_winners (
  id SERIAL PRIMARY KEY,
  week INTEGER NOT NULL UNIQUE,
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
  announcement TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

------------------------------------------------------------
-- 3. SEED DATA
------------------------------------------------------------

-- Insert 6 teams (CUSTOMIZE NAMES!)
INSERT INTO teams (id, name, short_name, color, motto) VALUES
  (1, 'Crescent Queens', 'CRQ', '#1e3a5f', 'Rise and reign'),
  (2, 'Hijabi Hoopers', 'HIJ', '#7c3aed', 'Ballin'' with barakah'),
  (3, 'Salam Shooters', 'SAL', '#059669', 'Peace and buckets'),
  (4, 'Noor Knights', 'NOO', '#dc2626', 'Light it up'),
  (5, 'Ummah United', 'UMU', '#ea580c', 'Stronger together'),
  (6, 'Fajr Phenoms', 'FAJ', '#0284c7', 'Early risers win')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name, short_name = EXCLUDED.short_name, 
  color = EXCLUDED.color, motto = EXCLUDED.motto;

-- Insert 36 games (30 regular season over 7 weeks + 6 playoff in weeks 8-9)
-- Schedule: A=CrescentQueens, B=HijabiHoopers, C=SalamShooters, D=NoorKnights, E=UmmahUnited, F=FajrPhenoms
INSERT INTO games (id, week, home_team, away_team, home_team_id, away_team_id, game_time, court, game_type) VALUES
  -- WEEK 1: AB CD | EF AC
  (1,  1, 'Crescent Queens', 'Hijabi Hoopers', 1, 2, '6:00 PM', 1, 'regular'),
  (2,  1, 'Salam Shooters', 'Noor Knights', 3, 4, '6:00 PM', 2, 'regular'),
  (3,  1, 'Ummah United', 'Fajr Phenoms', 5, 6, '7:00 PM', 1, 'regular'),
  (4,  1, 'Crescent Queens', 'Salam Shooters', 1, 3, '7:00 PM', 2, 'regular'),
  -- WEEK 2: BE CF | AD BF
  (5,  2, 'Hijabi Hoopers', 'Ummah United', 2, 5, '6:00 PM', 1, 'regular'),
  (6,  2, 'Salam Shooters', 'Fajr Phenoms', 3, 6, '6:00 PM', 2, 'regular'),
  (7,  2, 'Crescent Queens', 'Noor Knights', 1, 4, '7:00 PM', 1, 'regular'),
  (8,  2, 'Hijabi Hoopers', 'Fajr Phenoms', 2, 6, '7:00 PM', 2, 'regular'),
  -- WEEK 3: DF AE | BC DE
  (9,  3, 'Noor Knights', 'Fajr Phenoms', 4, 6, '6:00 PM', 1, 'regular'),
  (10, 3, 'Crescent Queens', 'Ummah United', 1, 5, '6:00 PM', 2, 'regular'),
  (11, 3, 'Hijabi Hoopers', 'Salam Shooters', 2, 3, '7:00 PM', 1, 'regular'),
  (12, 3, 'Noor Knights', 'Ummah United', 4, 5, '7:00 PM', 2, 'regular'),
  -- WEEK 4: AF CE | BD CF
  (13, 4, 'Crescent Queens', 'Fajr Phenoms', 1, 6, '6:00 PM', 1, 'regular'),
  (14, 4, 'Salam Shooters', 'Ummah United', 3, 5, '6:00 PM', 2, 'regular'),
  (15, 4, 'Hijabi Hoopers', 'Noor Knights', 2, 4, '7:00 PM', 1, 'regular'),
  (16, 4, 'Salam Shooters', 'Fajr Phenoms', 3, 6, '7:00 PM', 2, 'regular'),
  -- WEEK 5: AB CD | EF AD
  (17, 5, 'Crescent Queens', 'Hijabi Hoopers', 1, 2, '6:00 PM', 1, 'regular'),
  (18, 5, 'Salam Shooters', 'Noor Knights', 3, 4, '6:00 PM', 2, 'regular'),
  (19, 5, 'Ummah United', 'Fajr Phenoms', 5, 6, '7:00 PM', 1, 'regular'),
  (20, 5, 'Crescent Queens', 'Noor Knights', 1, 4, '7:00 PM', 2, 'regular'),
  -- WEEK 6: BF DE | AC BE
  (21, 6, 'Hijabi Hoopers', 'Fajr Phenoms', 2, 6, '6:00 PM', 1, 'regular'),
  (22, 6, 'Noor Knights', 'Ummah United', 4, 5, '6:00 PM', 2, 'regular'),
  (23, 6, 'Crescent Queens', 'Salam Shooters', 1, 3, '7:00 PM', 1, 'regular'),
  (24, 6, 'Hijabi Hoopers', 'Ummah United', 2, 5, '7:00 PM', 2, 'regular'),
  -- WEEK 7: CE DF | AE BD | BC AF (6 games - extended session)
  (25, 7, 'Salam Shooters', 'Ummah United', 3, 5, '6:00 PM', 1, 'regular'),
  (26, 7, 'Noor Knights', 'Fajr Phenoms', 4, 6, '6:00 PM', 2, 'regular'),
  (27, 7, 'Crescent Queens', 'Ummah United', 1, 5, '7:00 PM', 1, 'regular'),
  (28, 7, 'Hijabi Hoopers', 'Noor Knights', 2, 4, '7:00 PM', 2, 'regular'),
  (29, 7, 'Hijabi Hoopers', 'Salam Shooters', 2, 3, '8:00 PM', 1, 'regular'),
  (30, 7, 'Crescent Queens', 'Fajr Phenoms', 1, 6, '8:00 PM', 2, 'regular'),
  -- WEEK 8: Play-in at 6pm, then Semifinals at 7pm
  (31, 8, 'TBD (#3)', 'TBD (#6)', NULL, NULL, '6:00 PM', 1, 'playin'),
  (32, 8, 'TBD (#4)', 'TBD (#5)', NULL, NULL, '6:00 PM', 2, 'playin'),
  (33, 8, 'TBD (#1)', 'TBD (4v5 W)', NULL, NULL, '7:00 PM', 1, 'semifinal'),
  (34, 8, 'TBD (#2)', 'TBD (3v6 W)', NULL, NULL, '7:00 PM', 2, 'semifinal'),
  -- WEEK 9: Championship + 3rd Place
  (35, 9, 'TBD', 'TBD', NULL, NULL, '6:00 PM', 1, 'final'),
  (36, 9, 'TBD', 'TBD', NULL, NULL, '6:00 PM', 2, 'third_place')
ON CONFLICT (id) DO NOTHING;

-- Sample players (REPLACE WITH REAL NAMES!)
INSERT INTO players (name, team_id, jersey_number, is_captain, position) VALUES
  ('Amira Hassan', 1, 11, true, 'guard'),
  ('Fatima Ali', 1, 23, false, 'forward'),
  ('Zainab Omar', 1, 7, false, 'center'),
  ('Layla Mahmoud', 1, 15, false, 'guard'),
  ('Nadia Khalil', 2, 3, true, 'guard'),
  ('Yasmin Ahmed', 2, 21, false, 'forward'),
  ('Maryam Ibrahim', 2, 33, false, 'center'),
  ('Sara Yusuf', 2, 10, false, 'guard'),
  ('Khadija Osman', 3, 5, true, 'guard'),
  ('Aisha Rahman', 3, 12, false, 'forward'),
  ('Hana Saleh', 3, 44, false, 'center'),
  ('Rania Faisal', 3, 8, false, 'guard'),
  ('Sumaya Nazir', 4, 1, true, 'guard'),
  ('Malika Sharif', 4, 24, false, 'forward'),
  ('Jamila Bakri', 4, 55, false, 'center'),
  ('Dina Karim', 4, 14, false, 'guard'),
  ('Hafsa Qureshi', 5, 22, true, 'guard'),
  ('Iman Siddiqui', 5, 30, false, 'forward'),
  ('Ruqayya Malik', 5, 42, false, 'center'),
  ('Samira Amir', 5, 9, false, 'guard'),
  ('Zahra Hussain', 6, 2, true, 'guard'),
  ('Leena Abbas', 6, 13, false, 'forward'),
  ('Nawal Farooq', 6, 50, false, 'center'),
  ('Asma Rizvi', 6, 6, false, 'guard')
ON CONFLICT DO NOTHING;

------------------------------------------------------------
-- 4. REALTIME SUBSCRIPTIONS
------------------------------------------------------------

ALTER PUBLICATION supabase_realtime ADD TABLE games;
ALTER PUBLICATION supabase_realtime ADD TABLE rsvps;
ALTER PUBLICATION supabase_realtime ADD TABLE game_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE potw_votes;

------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
------------------------------------------------------------

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE potw_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE potw_winners ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public read games" ON games FOR SELECT USING (true);
CREATE POLICY "Public read rsvps" ON rsvps FOR SELECT USING (true);
CREATE POLICY "Public read reactions" ON game_reactions FOR SELECT USING (true);
CREATE POLICY "Public read potw votes" ON potw_votes FOR SELECT USING (true);
CREATE POLICY "Public read potw winners" ON potw_winners FOR SELECT USING (true);

-- Public insert/update for engagement
CREATE POLICY "Public insert rsvps" ON rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update rsvps" ON rsvps FOR UPDATE USING (true);
CREATE POLICY "Public insert reactions" ON game_reactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update reactions" ON game_reactions FOR UPDATE USING (true);
CREATE POLICY "Public insert votes" ON potw_votes FOR INSERT WITH CHECK (true);

------------------------------------------------------------
-- 6. HELPER TRIGGERS
------------------------------------------------------------

-- Auto-set is_complete when scores entered
CREATE OR REPLACE FUNCTION auto_complete_game()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_complete = (NEW.home_score IS NOT NULL AND NEW.away_score IS NOT NULL);
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS game_auto_complete ON games;
CREATE TRIGGER game_auto_complete
  BEFORE INSERT OR UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION auto_complete_game();

-- Update RSVP timestamp
CREATE OR REPLACE FUNCTION update_rsvp_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rsvp_timestamp ON rsvps;
CREATE TRIGGER rsvp_timestamp
  BEFORE UPDATE ON rsvps
  FOR EACH ROW EXECUTE FUNCTION update_rsvp_timestamp();

------------------------------------------------------------
-- 7. USEFUL VIEWS
------------------------------------------------------------

-- Standings view (computed from games)
CREATE OR REPLACE VIEW standings AS
SELECT 
  t.id,
  t.name,
  t.short_name,
  t.color,
  COALESCE(SUM(CASE 
    WHEN (g.home_team_id = t.id AND g.home_score > g.away_score) OR 
         (g.away_team_id = t.id AND g.away_score > g.home_score) 
    THEN 1 ELSE 0 END), 0) as wins,
  COALESCE(SUM(CASE 
    WHEN (g.home_team_id = t.id AND g.home_score < g.away_score) OR 
         (g.away_team_id = t.id AND g.away_score < g.home_score) 
    THEN 1 ELSE 0 END), 0) as losses,
  COALESCE(SUM(CASE WHEN g.home_team_id = t.id THEN g.home_score 
                    WHEN g.away_team_id = t.id THEN g.away_score 
                    ELSE 0 END), 0) as points_for,
  COALESCE(SUM(CASE WHEN g.home_team_id = t.id THEN g.away_score 
                    WHEN g.away_team_id = t.id THEN g.home_score 
                    ELSE 0 END), 0) as points_against
FROM teams t
LEFT JOIN games g ON (g.home_team_id = t.id OR g.away_team_id = t.id) 
  AND g.is_complete = true 
  AND g.game_type = 'regular'
GROUP BY t.id, t.name, t.short_name, t.color
ORDER BY wins DESC, (points_for - points_against) DESC;
