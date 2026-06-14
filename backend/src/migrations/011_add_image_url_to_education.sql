-- Migration: Add thumbnail image URL to education resources
-- Created: 2026-06-14

ALTER TABLE education_resources ADD COLUMN IF NOT EXISTS image_url TEXT;
