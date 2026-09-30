-- 1. Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'Operator',
    daily_target_lines INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(is_active);

-- Enable RLS on team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies cleanly
DROP POLICY IF EXISTS "Allow public select on team_members" ON team_members;
CREATE POLICY "Allow public select on team_members" ON team_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on team_members" ON team_members;
CREATE POLICY "Allow public insert on team_members" ON team_members FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on team_members" ON team_members;
CREATE POLICY "Allow public update on team_members" ON team_members FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on team_members" ON team_members;
CREATE POLICY "Allow public delete on team_members" ON team_members FOR DELETE USING (true);

-- 2. Update production_line_items check constraint to accept Done, Passed, Pending, Failed
ALTER TABLE production_line_items DROP CONSTRAINT IF EXISTS production_line_items_qc_status_check;
ALTER TABLE production_line_items ADD CONSTRAINT production_line_items_qc_status_check 
    CHECK (qc_status IN ('Done', 'Passed', 'Pending', 'Failed'));

-- 3. Add member_id column to production_entries if not exists
ALTER TABLE production_entries ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES team_members(id) ON DELETE SET NULL;

-- 4. Seed initial team members if table empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM team_members LIMIT 1) THEN
        INSERT INTO team_members (name, role, phone) VALUES
            ('Rajesh Kumar', 'Senior Line Operator', '9876543210'),
            ('Priya Sharma', 'Line Operator', '9876543211'),
            ('Amit Verma', 'Line Operator', '9876543212'),
            ('Kavitha Murugan', 'Line Specialist', '9876543213');
    END IF;
END $$;
