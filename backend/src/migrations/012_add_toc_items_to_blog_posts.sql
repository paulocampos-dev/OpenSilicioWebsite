-- Migration: Add author-provided table of contents to blog posts
-- Description: Adds a toc_items text array so an author can list the
-- section titles shown in the post's "Nesta página" sidebar box.

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS toc_items TEXT[] DEFAULT '{}';

COMMENT ON COLUMN blog_posts.toc_items IS 'Author-provided section titles shown in the post''s "Nesta página" box, in display order';
