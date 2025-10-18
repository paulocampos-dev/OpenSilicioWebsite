-- Migration: Add About page settings
-- Created: 2025-10-18
-- Author: OpenSilício Team
--
-- Description:
-- Adds settings for the About page including title, main content, mission,
-- vision, history, and team members. Uses the existing site_settings table
-- with key-value pairs.
--
-- Changes:
-- - Add about_title setting
-- - Add about_content setting (rich text)
-- - Add about_content_type setting ('wysiwyg' or 'markdown')
-- - Add about_mission setting
-- - Add about_mission_type setting
-- - Add about_vision setting
-- - Add about_vision_type setting
-- - Add about_history setting
-- - Add about_history_type setting
-- - Add about_team_members setting (JSON array)

-- Add About page title
INSERT INTO site_settings (key, value)
VALUES ('about_title', 'Sobre o OpenSilício')
ON CONFLICT (key) DO NOTHING;

-- Add About page main content
INSERT INTO site_settings (key, value)
VALUES ('about_content', '<p>O OpenSilício é um grupo de pesquisa e extensão da Escola Politécnica da USP dedicado a democratizar o desenvolvimento de microeletrônica através de educação aberta e colaboração.</p>')
ON CONFLICT (key) DO NOTHING;

-- Add About page content type
INSERT INTO site_settings (key, value)
VALUES ('about_content_type', 'wysiwyg')
ON CONFLICT (key) DO NOTHING;

-- Add mission statement
INSERT INTO site_settings (key, value)
VALUES ('about_mission', '<p>Nossa missão é democratizar o acesso ao conhecimento em design de circuitos integrados, formando profissionais qualificados e promovendo inovação tecnológica no Brasil.</p>')
ON CONFLICT (key) DO NOTHING;

-- Add mission content type
INSERT INTO site_settings (key, value)
VALUES ('about_mission_type', 'wysiwyg')
ON CONFLICT (key) DO NOTHING;

-- Add vision statement
INSERT INTO site_settings (key, value)
VALUES ('about_vision', '<p>Ser referência nacional em educação e pesquisa em microeletrônica, contribuindo para o desenvolvimento tecnológico e a soberania nacional na área de semicondutores.</p>')
ON CONFLICT (key) DO NOTHING;

-- Add vision content type
INSERT INTO site_settings (key, value)
VALUES ('about_vision_type', 'wysiwyg')
ON CONFLICT (key) DO NOTHING;

-- Add history content
INSERT INTO site_settings (key, value)
VALUES ('about_history', '<p>Fundado em 2024 na Escola Politécnica da USP, o OpenSilício nasceu da necessidade de democratizar o acesso ao conhecimento em design de circuitos integrados no Brasil.</p>')
ON CONFLICT (key) DO NOTHING;

-- Add history content type
INSERT INTO site_settings (key, value)
VALUES ('about_history_type', 'wysiwyg')
ON CONFLICT (key) DO NOTHING;

-- Add team members (empty array initially)
INSERT INTO site_settings (key, value)
VALUES ('about_team_members', '[]')
ON CONFLICT (key) DO NOTHING;
