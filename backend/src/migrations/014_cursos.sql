-- Migration: Cursos (curso -> módulo -> aula)
-- Description:
-- A aba Cursos guarda trilhas estruturadas, com vídeo do YouTube como campo de
-- primeira classe da aula. É um tipo de conteúdo próprio: os recursos de
-- Educação continuam como estão, e a trilha 04-19 que já está publicada lá não
-- se move.
--
-- Ver docs/superpowers/specs/2026-09-01-cursos-design.md.

CREATE TABLE IF NOT EXISTS cursos (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        VARCHAR(255) UNIQUE NOT NULL,
    titulo      VARCHAR(500) NOT NULL,
    descricao   TEXT NOT NULL,
    ementa      TEXT,
    image_url   TEXT,
    nivel       VARCHAR(20) CHECK (nivel IN ('Iniciante', 'Intermediário', 'Avançado')),
    publicado   BOOLEAN DEFAULT false,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS curso_modulos (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id    UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    ordem       INTEGER NOT NULL DEFAULT 0,
    titulo      VARCHAR(500) NOT NULL,
    resumo      TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Sustenta a chave estrangeira composta de curso_aulas.
    UNIQUE (curso_id, id)
);

CREATE TABLE IF NOT EXISTS curso_aulas (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id     UUID NOT NULL,
    modulo_id    UUID NOT NULL,
    ordem        INTEGER NOT NULL DEFAULT 0,
    slug         VARCHAR(255) NOT NULL,
    titulo       VARCHAR(500) NOT NULL,
    video_id     VARCHAR(20),
    duracao_seg  INTEGER CHECK (duracao_seg IS NULL OR duracao_seg > 0),
    conteudo     TEXT,
    publicado    BOOLEAN DEFAULT false,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- A chave composta garante que o curso da aula é sempre o curso do módulo
    -- dela. Sem isso, um update em modulo_id mudaria a aula de curso e deixaria
    -- curso_id mentindo, e a URL /cursos/:curso/:aula apontaria para o nada.
    FOREIGN KEY (curso_id, modulo_id)
        REFERENCES curso_modulos (curso_id, id) ON DELETE CASCADE,

    -- O slug é único no curso, não no módulo: assim uma aula troca de módulo
    -- sem trocar de endereço.
    UNIQUE (curso_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_cursos_publicado ON cursos(publicado);
CREATE INDEX IF NOT EXISTS idx_cursos_slug ON cursos(slug);
CREATE INDEX IF NOT EXISTS idx_curso_modulos_curso ON curso_modulos(curso_id, ordem);
CREATE INDEX IF NOT EXISTS idx_curso_aulas_modulo ON curso_aulas(modulo_id, ordem);
CREATE INDEX IF NOT EXISTS idx_curso_aulas_curso ON curso_aulas(curso_id, publicado);

COMMENT ON COLUMN cursos.descricao IS 'Uma linha, usada nos cartões e nas linhas do índice';
COMMENT ON COLUMN cursos.ementa IS 'Estado do Lexical: o que você vai aprender, pré-requisitos';
COMMENT ON COLUMN curso_aulas.video_id IS 'Id do vídeo no YouTube, 11 caracteres; nulo em aula só de texto';
COMMENT ON COLUMN curso_aulas.duracao_seg IS 'Duração do vídeo em segundos, informada pelo autor';
COMMENT ON COLUMN curso_aulas.curso_id IS 'Desnormalizado de propósito; a chave composta impede divergir do módulo';
