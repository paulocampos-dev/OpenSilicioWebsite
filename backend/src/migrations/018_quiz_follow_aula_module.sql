-- Mantém o quiz associado quando uma aula é movida entre módulos do curso.

ALTER TABLE curso_quizzes
    DROP CONSTRAINT curso_quizzes_curso_id_modulo_id_aula_id_fkey,
    ADD CONSTRAINT curso_quizzes_curso_id_modulo_id_aula_id_fkey
        FOREIGN KEY (curso_id, modulo_id, aula_id)
        REFERENCES curso_aulas (curso_id, modulo_id, id)
        ON UPDATE CASCADE;
