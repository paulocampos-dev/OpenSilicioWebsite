-- Migration: aula opcional (alternativa) fora da contagem de progresso
-- Description:
-- Um curso pode ter aulas alternativas entre si, como "instalar no Windows",
-- "no Linux" e "no macOS": o leitor faz uma e pula as outras. Enquanto todas
-- entram no denominador do progresso, ninguém chega a 100%.
--
-- A coluna marca essas aulas. Elas continuam publicadas, com endereço e no
-- currículo; o que muda é que saem da conta do progresso do leitor.

ALTER TABLE curso_aulas ADD COLUMN IF NOT EXISTS opcional BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN curso_aulas.opcional IS 'aula alternativa: fica fora da contagem de progresso do leitor';
