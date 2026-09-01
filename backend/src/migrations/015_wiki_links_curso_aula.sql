-- Migration: aulas de curso podem citar verbetes da wiki
-- Description:
-- content_wiki_links e pending_wiki_links nasceram com um CHECK de
-- ('blog', 'education'). Sem alargar, sincronizarLinksDeWiki falha ao gravar as
-- ligações de uma aula e os chips de "Termos usados aqui" nunca aparecem lá.
--
-- Os dois CHECK foram declarados inline nas migrações 001 e 007, então o
-- PostgreSQL nomeou cada um como <tabela>_content_type_check. Se o nome tiver
-- sido mudado à mão em algum ambiente, o DROP não acha nada e o ADD falha por
-- duplicidade: conferir com \d content_wiki_links antes de rodar em produção.

ALTER TABLE content_wiki_links
DROP CONSTRAINT IF EXISTS content_wiki_links_content_type_check;

ALTER TABLE content_wiki_links
ADD CONSTRAINT content_wiki_links_content_type_check
CHECK (content_type IN ('blog', 'education', 'curso_aula'));

ALTER TABLE pending_wiki_links
DROP CONSTRAINT IF EXISTS pending_wiki_links_content_type_check;

ALTER TABLE pending_wiki_links
ADD CONSTRAINT pending_wiki_links_content_type_check
CHECK (content_type IN ('blog', 'education', 'curso_aula'));

COMMENT ON COLUMN content_wiki_links.content_type IS 'blog, education ou curso_aula; content_id aponta para a tabela correspondente';
