-- Migration: [Brief description of what this migration does]
-- Created: [YYYY-MM-DD]
-- Author: [Your name]
--
-- Description:
-- [Detailed description of the changes and why they're needed]
--
-- Example usage:
-- 1. Copy this file and rename it with the next number: 00X_your_migration_name.sql
-- 2. Fill in the description above
-- 3. Write your SQL below
-- 4. Run: npm run migrate

-- Your SQL changes go here
-- Examples:

-- Add a new column
-- ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user';

-- Create a new table
-- CREATE TABLE comments (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     content TEXT NOT NULL,
--     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- Create an index
-- CREATE INDEX idx_comments_user_id ON comments(user_id);

-- Insert default data
-- INSERT INTO site_settings (key, value) VALUES ('new_setting', 'value') ON CONFLICT (key) DO NOTHING;
