import type { PoolClient, QueryResultRow } from 'pg';
import pool from '../config/database';
import { BadRequestError, ConflictError, NotFoundError } from '../errors/AppError';

export interface QuizAlternativa {
  id: string;
  ordem: number;
  texto: string;
  correta: boolean;
}

export interface QuizQuestao {
  id: string;
  ordem: number;
  enunciado: string;
  explicacao: string;
  alternativas: QuizAlternativa[];
}

export interface CursoQuiz {
  id: string;
  curso_id: string;
  modulo_id: string;
  aula_id: string | null;
  ordem: number;
  slug: string;
  titulo: string;
  nota_minima: number;
  publicado: boolean;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface QuizCompleto extends CursoQuiz {
  questoes: QuizQuestao[];
}

interface AlternativaInput {
  texto: string;
  correta: boolean;
}

interface QuestaoInput {
  enunciado: string;
  explicacao: string;
  alternativas: AlternativaInput[];
}

export interface QuizInput {
  modulo_id: string;
  aula_id?: string | null;
  slug: string;
  titulo: string;
  nota_minima?: number;
  publicado?: boolean;
  questoes: QuestaoInput[];
}

type QuizUpdate = Partial<Omit<QuizInput, 'questoes'>> & { questoes?: QuestaoInput[] };

interface LinhaQuestao extends QueryResultRow {
  questao_id: string;
  questao_ordem: number;
  enunciado: string;
  explicacao: string;
  alternativa_id: string;
  alternativa_ordem: number;
  alternativa_texto: string;
  correta: boolean;
}

class CursoQuizService {
  private async montarCompleto(cliente: PoolClient, quiz: CursoQuiz): Promise<QuizCompleto> {
    const { rows } = await cliente.query<LinhaQuestao>(
      `SELECT q.id AS questao_id,
              q.ordem AS questao_ordem,
              q.enunciado,
              q.explicacao,
              a.id AS alternativa_id,
              a.ordem AS alternativa_ordem,
              a.texto AS alternativa_texto,
              a.correta
         FROM curso_quiz_questoes q
         JOIN curso_quiz_alternativas a ON a.questao_id = q.id
        WHERE q.quiz_id = $1
        ORDER BY q.ordem, q.id, a.ordem, a.id`,
      [quiz.id],
    );

    const questoes = new Map<string, QuizQuestao>();
    for (const linha of rows) {
      let questao = questoes.get(linha.questao_id);
      if (!questao) {
        questao = {
          id: linha.questao_id,
          ordem: linha.questao_ordem,
          enunciado: linha.enunciado,
          explicacao: linha.explicacao,
          alternativas: [],
        };
        questoes.set(linha.questao_id, questao);
      }
      questao.alternativas.push({
        id: linha.alternativa_id,
        ordem: linha.alternativa_ordem,
        texto: linha.alternativa_texto,
        correta: linha.correta,
      });
    }

    return { ...quiz, questoes: [...questoes.values()] };
  }

  private async validarPosicao(
    cliente: PoolClient,
    cursoId: string,
    moduloId: string,
    aulaId: string | null,
  ): Promise<void> {
    const modulo = await cliente.query(
      'SELECT id FROM curso_modulos WHERE id = $1 AND curso_id = $2',
      [moduloId, cursoId],
    );
    if (modulo.rows.length === 0) {
      throw new BadRequestError('O módulo não pertence ao curso informado');
    }

    if (aulaId) {
      const aula = await cliente.query(
        `SELECT id FROM curso_aulas
          WHERE id = $1 AND modulo_id = $2 AND curso_id = $3`,
        [aulaId, moduloId, cursoId],
      );
      if (aula.rows.length === 0) {
        throw new BadRequestError('A aula não pertence ao curso e módulo informados');
      }
    }
  }

  private async gravarQuestoes(
    cliente: PoolClient,
    quizId: string,
    questoes: QuestaoInput[],
  ): Promise<void> {
    for (const [ordemQuestao, questao] of questoes.entries()) {
      const { rows } = await cliente.query<{ id: string }>(
        `INSERT INTO curso_quiz_questoes (quiz_id, ordem, enunciado, explicacao)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [quizId, ordemQuestao, questao.enunciado, questao.explicacao],
      );

      for (const [ordemAlternativa, alternativa] of questao.alternativas.entries()) {
        await cliente.query(
          `INSERT INTO curso_quiz_alternativas (questao_id, ordem, texto, correta)
           VALUES ($1, $2, $3, $4)`,
          [rows[0].id, ordemAlternativa, alternativa.texto, alternativa.correta],
        );
      }
    }
  }

  private traduzirConflito(erro: unknown): never {
    if (typeof erro === 'object' && erro !== null && 'code' in erro && erro.code === '23505') {
      const restricao = 'constraint' in erro ? String(erro.constraint) : '';
      if (restricao === 'curso_quizzes_uma_por_aula') {
        throw new ConflictError('Esta aula já tem um quiz');
      }
      if (restricao === 'curso_quizzes_um_final_por_modulo') {
        throw new ConflictError('Este módulo já tem um quiz final');
      }
      if (restricao === 'curso_quizzes_curso_id_slug_key') {
        throw new ConflictError('Já existe um quiz com este slug no curso');
      }
    }
    throw erro;
  }

  async getPublico(cursoSlug: string, quizSlug: string): Promise<QuizCompleto> {
    const cliente = await pool.connect();
    try {
      const { rows } = await cliente.query<CursoQuiz>(
        `SELECT q.*
           FROM curso_quizzes q
           JOIN cursos c ON c.id = q.curso_id
          WHERE c.slug = $1
            AND q.slug = $2
            AND c.publicado = true
            AND q.publicado = true`,
        [cursoSlug, quizSlug],
      );
      if (rows.length === 0) throw new NotFoundError('Quiz');
      return this.montarCompleto(cliente, rows[0]);
    } finally {
      cliente.release();
    }
  }

  async getById(id: string): Promise<QuizCompleto> {
    const cliente = await pool.connect();
    try {
      const { rows } = await cliente.query<CursoQuiz>('SELECT * FROM curso_quizzes WHERE id = $1', [id]);
      if (rows.length === 0) throw new NotFoundError('Quiz');
      return this.montarCompleto(cliente, rows[0]);
    } finally {
      cliente.release();
    }
  }

  async criar(cursoId: string, input: QuizInput): Promise<QuizCompleto> {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      await this.validarPosicao(cliente, cursoId, input.modulo_id, input.aula_id ?? null);
      const { rows } = await cliente.query<CursoQuiz>(
        `INSERT INTO curso_quizzes
           (curso_id, modulo_id, aula_id, slug, titulo, nota_minima, publicado)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          cursoId,
          input.modulo_id,
          input.aula_id ?? null,
          input.slug,
          input.titulo,
          input.nota_minima ?? 70,
          input.publicado ?? false,
        ],
      );
      await this.gravarQuestoes(cliente, rows[0].id, input.questoes);
      const quiz = await this.montarCompleto(cliente, rows[0]);
      await cliente.query('COMMIT');
      return quiz;
    } catch (erro) {
      await cliente.query('ROLLBACK');
      return this.traduzirConflito(erro);
    } finally {
      cliente.release();
    }
  }

  async atualizar(id: string, input: QuizUpdate): Promise<QuizCompleto> {
    const cliente = await pool.connect();
    try {
      await cliente.query('BEGIN');
      const { rows } = await cliente.query<CursoQuiz>(
        'SELECT * FROM curso_quizzes WHERE id = $1 FOR UPDATE',
        [id],
      );
      if (rows.length === 0) throw new NotFoundError('Quiz');
      const atual = rows[0];
      const moduloId = input.modulo_id ?? atual.modulo_id;
      const aulaId = input.aula_id === undefined ? atual.aula_id : input.aula_id;
      await this.validarPosicao(cliente, atual.curso_id, moduloId, aulaId ?? null);

      const atualizado = await cliente.query<CursoQuiz>(
        `UPDATE curso_quizzes
            SET modulo_id = $2,
                aula_id = $3,
                slug = $4,
                titulo = $5,
                nota_minima = $6,
                publicado = $7,
                updated_at = NOW()
          WHERE id = $1
          RETURNING *`,
        [
          id,
          moduloId,
          aulaId ?? null,
          input.slug ?? atual.slug,
          input.titulo ?? atual.titulo,
          input.nota_minima ?? atual.nota_minima,
          input.publicado ?? atual.publicado,
        ],
      );

      if (input.questoes) {
        await cliente.query('DELETE FROM curso_quiz_questoes WHERE quiz_id = $1', [id]);
        await this.gravarQuestoes(cliente, id, input.questoes);
      }

      const quiz = await this.montarCompleto(cliente, atualizado.rows[0]);
      await cliente.query('COMMIT');
      return quiz;
    } catch (erro) {
      await cliente.query('ROLLBACK');
      return this.traduzirConflito(erro);
    } finally {
      cliente.release();
    }
  }

  async deletar(id: string): Promise<void> {
    const { rows } = await pool.query('DELETE FROM curso_quizzes WHERE id = $1 RETURNING id', [id]);
    if (rows.length === 0) throw new NotFoundError('Quiz');
  }
}

export const cursoQuizService = new CursoQuizService();
