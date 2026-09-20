-- Migration: quizzes de cursos
-- Description:
-- Quizzes são atividades do curso ligadas a uma aula ou ao fim de um módulo.
-- Questões e alternativas são gravadas como um documento aninhado pelo serviço.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
          FROM pg_constraint
         WHERE conname = 'curso_aulas_curso_modulo_id_unique'
           AND conrelid = 'curso_aulas'::regclass
    ) THEN
        ALTER TABLE curso_aulas
            ADD CONSTRAINT curso_aulas_curso_modulo_id_unique
            UNIQUE (curso_id, modulo_id, id);
    END IF;
END
$$;

CREATE TABLE curso_quizzes (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id     UUID NOT NULL,
    modulo_id    UUID NOT NULL,
    aula_id      UUID,
    ordem        INTEGER NOT NULL DEFAULT 0,
    slug         VARCHAR(255) NOT NULL,
    titulo       VARCHAR(500) NOT NULL,
    nota_minima  INTEGER NOT NULL DEFAULT 70
                 CHECK (nota_minima BETWEEN 0 AND 100),
    publicado    BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (curso_id, modulo_id)
        REFERENCES curso_modulos (curso_id, id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id, modulo_id, aula_id)
        REFERENCES curso_aulas (curso_id, modulo_id, id),
    UNIQUE (curso_id, slug)
);

CREATE UNIQUE INDEX curso_quizzes_uma_por_aula
    ON curso_quizzes (aula_id)
    WHERE aula_id IS NOT NULL;

CREATE UNIQUE INDEX curso_quizzes_um_final_por_modulo
    ON curso_quizzes (modulo_id)
    WHERE aula_id IS NULL;

CREATE INDEX curso_quizzes_curso_publicado
    ON curso_quizzes (curso_id, publicado);

CREATE TABLE curso_quiz_questoes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id     UUID NOT NULL REFERENCES curso_quizzes(id) ON DELETE CASCADE,
    ordem       INTEGER NOT NULL,
    enunciado   TEXT NOT NULL,
    explicacao  TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX curso_quiz_questoes_quiz_ordem
    ON curso_quiz_questoes (quiz_id, ordem);

CREATE TABLE curso_quiz_alternativas (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    questao_id  UUID NOT NULL REFERENCES curso_quiz_questoes(id) ON DELETE CASCADE,
    ordem       INTEGER NOT NULL,
    texto       TEXT NOT NULL,
    correta     BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX curso_quiz_alternativas_questao_ordem
    ON curso_quiz_alternativas (questao_id, ordem);

CREATE UNIQUE INDEX curso_quiz_uma_correta
    ON curso_quiz_alternativas (questao_id)
    WHERE correta;

COMMENT ON COLUMN curso_quizzes.aula_id IS 'nulo posiciona o quiz no fim do módulo';
COMMENT ON COLUMN curso_quizzes.nota_minima IS 'porcentagem inclusiva necessária para concluir o quiz';
