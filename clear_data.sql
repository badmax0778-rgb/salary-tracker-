-- ==============================================================================
-- CLEAR ALL DATA (Hard Reset)
-- Run this in the Supabase SQL Editor to wipe all test data and start fresh
-- ==============================================================================

-- Delete all data from all tables
TRUNCATE TABLE production_line_items CASCADE;
TRUNCATE TABLE production_entry_members CASCADE;
TRUNCATE TABLE production_entries CASCADE;
TRUNCATE TABLE team_members CASCADE;

-- Note: CASCADE will ensure all linked records (foreign keys) are deleted properly.
-- After running this, your dashboard will be completely empty.
