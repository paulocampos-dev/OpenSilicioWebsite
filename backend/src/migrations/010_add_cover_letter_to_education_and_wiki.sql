-- Migration: Add optional cover letter to education and wiki content
-- Created: 2026-06-14
--
-- Description:
-- Adds cover_letter to education_resources and wiki_entries so all published
-- content types can show an optional article intro. Nullable for existing rows.

ALTER TABLE education_resources ADD COLUMN IF NOT EXISTS cover_letter TEXT;
ALTER TABLE wiki_entries ADD COLUMN IF NOT EXISTS cover_letter TEXT;
