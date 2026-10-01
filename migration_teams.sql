-- ==============================================================================
-- MIGRATION: ADD TEAMS
-- Run this in the Supabase SQL Editor to add the Teams feature
-- ==============================================================================

-- 1. Create the Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add team_id to the production_entries table
ALTER TABLE production_entries 
ADD COLUMN team_id UUID REFERENCES teams(id);

-- 3. Set up RLS (Row Level Security) for teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on teams" 
ON teams FOR SELECT USING (true);

CREATE POLICY "Allow public insert on teams" 
ON teams FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on teams" 
ON teams FOR UPDATE USING (true);

-- (Optional) Add a default team for existing records if you have any
-- INSERT INTO teams (id, name) VALUES ('00000000-0000-0000-0000-000000000000', 'Default Team');
-- UPDATE production_entries SET team_id = '00000000-0000-0000-0000-000000000000' WHERE team_id IS NULL;
