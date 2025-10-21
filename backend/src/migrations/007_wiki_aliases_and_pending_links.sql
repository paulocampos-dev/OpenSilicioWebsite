-- Migration: Add wiki aliases and pending wiki links
-- Description: Adds support for multiple aliases per wiki entry and pending wiki links
-- that can be created while writing content

-- Add aliases column to wiki_entries table
ALTER TABLE wiki_entries
ADD COLUMN IF NOT EXISTS aliases TEXT[] DEFAULT '{}';

-- Create index for searching aliases using GIN
CREATE INDEX IF NOT EXISTS idx_wiki_entries_aliases
ON wiki_entries USING GIN (aliases);

-- Create pending_wiki_links table
CREATE TABLE IF NOT EXISTS pending_wiki_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term VARCHAR(255) NOT NULL,
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('blog', 'education')),
    content_id UUID NOT NULL,
    context TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Composite unique constraint to prevent duplicate pending links
    UNIQUE (term, content_type, content_id)
);

-- Create indexes for pending_wiki_links
CREATE INDEX IF NOT EXISTS idx_pending_wiki_links_term
ON pending_wiki_links(term);

CREATE INDEX IF NOT EXISTS idx_pending_wiki_links_content
ON pending_wiki_links(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_pending_wiki_links_created_at
ON pending_wiki_links(created_at DESC);

-- Add comment to explain the table
COMMENT ON TABLE pending_wiki_links IS 'Stores wiki links marked in content before the actual wiki entry is created';
COMMENT ON COLUMN wiki_entries.aliases IS 'Alternative terms that can be used to reference this wiki entry';
