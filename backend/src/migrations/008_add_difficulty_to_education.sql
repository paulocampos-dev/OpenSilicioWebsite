-- Migration: Add difficulty field to education resources
-- Description: Adds a difficulty level field to education_resources table
-- Valid values: 'Iniciante', 'Intermediário', 'Avançado'

-- Add difficulty column
ALTER TABLE education_resources
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20)
CHECK (difficulty IN ('Iniciante', 'Intermediário', 'Avançado'));

-- Add comment to describe the column
COMMENT ON COLUMN education_resources.difficulty IS 'Nível de dificuldade do recurso educacional: Iniciante, Intermediário ou Avançado';
