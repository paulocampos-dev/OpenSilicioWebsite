-- Migration: Add optional cover letter to blog posts
-- Created: 2026-06-14
--
-- Description:
-- Adds an optional cover_letter column for a short article intro shown on the
-- post page only (separate from excerpt and cover image). Nullable so existing
-- posts are preserved unchanged.

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS cover_letter TEXT;
