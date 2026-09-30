-- ==============================================================================
-- Salary Calculator & Multi-Line Production Tracker - Supabase SQL Schema
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Create table for Team Members
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'Line Operator',
    daily_target_lines INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);

-- 2. Create table for master production entries
CREATE TABLE IF NOT EXISTS production_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    member_name TEXT NOT NULL,
    team_size INTEGER DEFAULT 1,
    share_per_member NUMERIC(12, 2) DEFAULT 0,
    total_lines INTEGER NOT NULL DEFAULT 0,
    total_meters NUMERIC(12, 2) NOT NULL DEFAULT 0,
    rate_per_line NUMERIC(10, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Create table for members assigned to a shift (Team Split Junction)
CREATE TABLE IF NOT EXISTS production_entry_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES production_entries(id) ON DELETE CASCADE,
    member_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    member_name TEXT NOT NULL,
    share_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_entry_members_entry ON production_entry_members(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_members_member ON production_entry_members(member_id);

-- 4. Create table for individual line items (1-to-many relationship)
CREATE TABLE IF NOT EXISTS production_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES production_entries(id) ON DELETE CASCADE,
    line_number TEXT NOT NULL,
    meters NUMERIC(12, 2) NOT NULL DEFAULT 0,
    qc_status TEXT NOT NULL CHECK (qc_status IN ('Done', 'Passed', 'Pending', 'Failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_production_entries_date ON production_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_production_entries_member ON production_entries(member_name);
CREATE INDEX IF NOT EXISTS idx_production_line_items_entry ON production_line_items(entry_id);
CREATE INDEX IF NOT EXISTS idx_production_line_items_qc ON production_line_items(qc_status);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_entry_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_line_items ENABLE ROW LEVEL SECURITY;

-- 7. Public RLS Policies
DROP POLICY IF EXISTS "Allow public select on team_members" ON team_members;
CREATE POLICY "Allow public select on team_members" ON team_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on team_members" ON team_members;
CREATE POLICY "Allow public insert on team_members" ON team_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on team_members" ON team_members;
CREATE POLICY "Allow public update on team_members" ON team_members FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on team_members" ON team_members;
CREATE POLICY "Allow public delete on team_members" ON team_members FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select on production_entries" ON production_entries;
CREATE POLICY "Allow public select on production_entries" ON production_entries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on production_entries" ON production_entries;
CREATE POLICY "Allow public insert on production_entries" ON production_entries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on production_entries" ON production_entries;
CREATE POLICY "Allow public update on production_entries" ON production_entries FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on production_entries" ON production_entries;
CREATE POLICY "Allow public delete on production_entries" ON production_entries FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select on production_entry_members" ON production_entry_members;
CREATE POLICY "Allow public select on production_entry_members" ON production_entry_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on production_entry_members" ON production_entry_members;
CREATE POLICY "Allow public insert on production_entry_members" ON production_entry_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on production_entry_members" ON production_entry_members;
CREATE POLICY "Allow public update on production_entry_members" ON production_entry_members FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on production_entry_members" ON production_entry_members;
CREATE POLICY "Allow public delete on production_entry_members" ON production_entry_members FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public select on production_line_items" ON production_line_items;
CREATE POLICY "Allow public select on production_line_items" ON production_line_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert on production_line_items" ON production_line_items;
CREATE POLICY "Allow public insert on production_line_items" ON production_line_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on production_line_items" ON production_line_items;
CREATE POLICY "Allow public update on production_line_items" ON production_line_items FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Allow public delete on production_line_items" ON production_line_items;
CREATE POLICY "Allow public delete on production_line_items" ON production_line_items FOR DELETE USING (true);
