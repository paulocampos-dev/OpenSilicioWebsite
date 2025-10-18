-- Migration: Add project-specific sections to education resources
-- Created: 2025-10-18
-- Author: OpenSilício Team
--
-- Description:
-- Adds overview and resources fields to education_resources table.
-- These fields are used only for resources with category='Projetos' to provide
-- additional structured content sections.
--
-- Changes:
-- - Add overview column (TEXT, nullable) for "Visão Geral" section
-- - Add resources column (TEXT, nullable) for "Recursos" section

-- Add overview column
ALTER TABLE education_resources
ADD COLUMN IF NOT EXISTS overview TEXT;

-- Add resources column
ALTER TABLE education_resources
ADD COLUMN IF NOT EXISTS resources TEXT;
