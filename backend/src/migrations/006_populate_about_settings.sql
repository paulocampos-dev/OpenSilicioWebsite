-- Migration: Populate about settings with Lexical JSON content
-- Description: Initializes about settings with default Lexical JSON content
-- Converts HTML content to Lexical JSON if needed
-- Preserves existing Lexical JSON (user customizations)

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

-- Update about_content with Lexical JSON
-- Replace if: empty, NULL, or HTML content (starts with '<')
-- Keep if: already Lexical JSON (starts with '{')
INSERT INTO site_settings (key, value, created_at, updated_at)
VALUES ('about_content', '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"O OpenSilício é uma iniciativa dedicada a democratizar o conhecimento em eletrônica e projeto de circuitos integrados. Nossa missão é fornecer recursos educacionais de qualidade e fomentar uma comunidade ativa de aprendizado.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = CASE
  WHEN site_settings.value = ''
    OR site_settings.value IS NULL
    OR site_settings.value LIKE '<%'
  THEN EXCLUDED.value
  ELSE site_settings.value
END,
updated_at = NOW();

-- Update about_mission with Lexical JSON
INSERT INTO site_settings (key, value, created_at, updated_at)
VALUES ('about_mission', '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Democratizar o acesso ao conhecimento em eletrônica e projeto de circuitos integrados, capacitando estudantes e profissionais através de recursos educacionais de alta qualidade.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = CASE
  WHEN site_settings.value = ''
    OR site_settings.value IS NULL
    OR site_settings.value LIKE '<%'
  THEN EXCLUDED.value
  ELSE site_settings.value
END,
updated_at = NOW();

-- Update about_vision with Lexical JSON
INSERT INTO site_settings (key, value, created_at, updated_at)
VALUES ('about_vision', '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"Ser referência no ensino de eletrônica e design de circuitos integrados, criando uma comunidade global de inovadores e desenvolvedores.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}', NOW(), NOW())
ON CONFLICT (key) DO UPDATE
SET value = CASE
  WHEN site_settings.value = ''
    OR site_settings.value IS NULL
    OR site_settings.value LIKE '<%'
  THEN EXCLUDED.value
  ELSE site_settings.value
END,
updated_at = NOW();

-- Update about_history with Lexical JSON
INSERT INTO site_settings (key, value, created_at, updated_at)
VALUES ('about_history', '{"root":{"children":[{"children":[{"detail":0,"format":0,"mode":"normal","style":"","text":"O OpenSilício nasceu da paixão de estudantes e professores pela área de eletrônica e circuitos integrados. Com o objetivo de facilitar o aprendizado e compartilhar conhecimento, criamos esta plataforma para reunir recursos, tutoriais e projetos práticos.","type":"text","version":1}],"direction":"ltr","format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}', NOW(), NOW())
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
