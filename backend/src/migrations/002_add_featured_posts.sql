-- Migration: Add featured education resources and blog posts
-- Created: 2025-10-18
-- Author: OpenSilício Team
--
-- Description:
-- Replaces the manual featured_projects JSON field with references to actual
-- education resources and blog posts. This allows admins to select from existing
-- content instead of manually entering project details.
--
-- Changes:
-- - Remove old featured_projects setting
-- - Add featured_education_ids setting (JSON array of UUIDs)
-- - Add featured_blog_ids setting (JSON array of UUIDs)

-- Remove old featured_projects setting
DELETE FROM site_settings WHERE key = 'featured_projects';

-- Add new settings for featured content
INSERT INTO site_settings (key, value)
VALUES ('featured_education_ids', '[]')
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_settings (key, value)
VALUES ('featured_blog_ids', '[]')
ON CONFLICT (key) DO NOTHING;
