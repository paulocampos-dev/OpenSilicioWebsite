-- Migration: Remove content_type column and clear existing content for BlockNote
-- Description: Removes content_type from all tables and clears existing content
-- to start fresh with BlockNote JSON format

-- Blog posts
ALTER TABLE blog_posts DROP COLUMN IF EXISTS content_type;
TRUNCATE TABLE blog_posts CASCADE;

-- Education resources
ALTER TABLE education_resources DROP COLUMN IF EXISTS content_type;
TRUNCATE TABLE education_resources CASCADE;

-- Wiki entries
ALTER TABLE wiki_entries DROP COLUMN IF EXISTS content_type;
TRUNCATE TABLE wiki_entries CASCADE;

-- Site settings - Remove content_type fields for about sections
DELETE FROM site_settings WHERE key IN (
  'about_content',
  'about_content_type',
  'about_mission',
  'about_mission_type',
  'about_vision',
  'about_vision_type',
  'about_history',
  'about_history_type'
);

-- Re-add about content fields (without _type variants)
INSERT INTO site_settings (key, value) VALUES
  ('about_content', ''),
  ('about_mission', ''),
  ('about_vision', ''),
  ('about_history', '')
ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value;
