-- Migration: Populate about settings with BlockNote JSON content
-- Description: Initializes about settings with default BlockNote JSON content
-- Converts HTML content to BlockNote JSON if needed
-- Preserves existing BlockNote JSON (user customizations)

-- Update about_title if empty or missing
INSERT INTO site_settings (key, value, created_at, updated_at)
VALUES ('about_title', 'Sobre o OpenSilício', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = CASE
  WHEN site_settings.value = '' OR site_settings.value IS NULL
  THEN EXCLUDED.value
  ELSE site_settings.value
END,
updated_at = NOW();

-- Update about_content with BlockNote JSON
-- Replace if: empty, NULL, or HTML content (starts with '<')
-- Keep if: already BlockNote JSON (starts with '[')
INSERT INTO site_settings (key, value, created_at, updated_at)
VALUES ('about_content', '[{"id":"1","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"O OpenSilício é uma iniciativa dedicada a democratizar o conhecimento em eletrônica e projeto de circuitos integrados. Nossa missão é fornecer recursos educacionais de qualidade e fomentar uma comunidade ativa de aprendizado.","styles":{}}],"children":[]}]', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = CASE
  WHEN site_settings.value = ''
    OR site_settings.value IS NULL
    OR site_settings.value LIKE '<%'
  THEN EXCLUDED.value
  ELSE site_settings.value
END,
updated_at = NOW();

-- Update about_mission with BlockNote JSON
INSERT INTO site_settings (key, value, created_at, updated_at)
VALUES ('about_mission', '[{"id":"1","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"Democratizar o acesso ao conhecimento em eletrônica e projeto de circuitos integrados, capacitando estudantes e profissionais através de recursos educacionais de alta qualidade.","styles":{}}],"children":[]}]', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = CASE
  WHEN site_settings.value = ''
    OR site_settings.value IS NULL
    OR site_settings.value LIKE '<%'
  THEN EXCLUDED.value
  ELSE site_settings.value
END,
updated_at = NOW();

-- Update about_vision with BlockNote JSON
INSERT INTO site_settings (key, value, created_at, updated_at)
VALUES ('about_vision', '[{"id":"1","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"Ser referência no ensino de eletrônica e design de circuitos integrados, criando uma comunidade global de inovadores e desenvolvedores.","styles":{}}],"children":[]}]', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = CASE
  WHEN site_settings.value = ''
    OR site_settings.value IS NULL
    OR site_settings.value LIKE '<%'
  THEN EXCLUDED.value
  ELSE site_settings.value
END,
updated_at = NOW();

-- Update about_history with BlockNote JSON
INSERT INTO site_settings (key, value, created_at, updated_at)
VALUES ('about_history', '[{"id":"1","type":"paragraph","props":{"textColor":"default","backgroundColor":"default","textAlignment":"left"},"content":[{"type":"text","text":"O OpenSilício nasceu da paixão de estudantes e professores pela área de eletrônica e circuitos integrados. Com o objetivo de facilitar o aprendizado e compartilhar conhecimento, criamos esta plataforma para reunir recursos, tutoriais e projetos práticos.","styles":{}}],"children":[]}]', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = CASE
  WHEN site_settings.value = ''
    OR site_settings.value IS NULL
    OR site_settings.value LIKE '<%'
  THEN EXCLUDED.value
  ELSE site_settings.value
END,
updated_at = NOW();

-- Update about_team_members if empty or missing
INSERT INTO site_settings (key, value, created_at, updated_at)
VALUES ('about_team_members', '[]', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = CASE
  WHEN site_settings.value = '' OR site_settings.value IS NULL
  THEN EXCLUDED.value
  ELSE site_settings.value
END,
updated_at = NOW();
