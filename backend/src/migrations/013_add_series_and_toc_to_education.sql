-- Migration: Series navigation and table of contents for education resources
-- Description:
-- The education track is a linear series (each tutorial ends pointing at the
-- next one), but resources had no ordering and no way to render an index.
-- blog_posts already had toc_items (migration 012); this brings the same to
-- education and adds the two columns needed for previous/next navigation.
--
-- Changes:
-- - toc_items: author-provided section titles, same shape as blog_posts
-- - series: groups resources that form one ordered track (nullable: a
--   standalone resource simply has no series)
-- - series_order: position within that series

ALTER TABLE education_resources
ADD COLUMN IF NOT EXISTS toc_items TEXT[] DEFAULT '{}';

ALTER TABLE education_resources
ADD COLUMN IF NOT EXISTS series VARCHAR(120);

ALTER TABLE education_resources
ADD COLUMN IF NOT EXISTS series_order INTEGER;

COMMENT ON COLUMN education_resources.toc_items IS 'Títulos de seção mostrados na caixa "Nesta página", na ordem de exibição';
COMMENT ON COLUMN education_resources.series IS 'Nome da série a que o recurso pertence; nulo para recursos avulsos';
COMMENT ON COLUMN education_resources.series_order IS 'Posição do recurso dentro da série, usada para anterior/próximo';

-- Sustenta a consulta de navegação, que filtra por série e ordena pela posição.
CREATE INDEX IF NOT EXISTS idx_education_series
ON education_resources (series, series_order)
WHERE series IS NOT NULL;
