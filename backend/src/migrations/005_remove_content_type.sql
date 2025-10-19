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
-- Only delete the _type variant fields, keep the content fields intact
DELETE FROM site_settings WHERE key IN (
  'about_content_type',
  'about_mission_type',
  'about_vision_type',
  'about_history_type'
);
