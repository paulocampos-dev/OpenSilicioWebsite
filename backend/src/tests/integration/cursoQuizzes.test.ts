import request from 'supertest';
import app from '../../server';
import { testPool } from '../setup';
import { cleanDatabase } from '../utils/helpers';
import { getAuthToken } from '../utils/auth';
import { cursoQuizService } from '../../services/CursoQuizService';
import pool from '../../config/database';

const criarEstrutura = async (publicado = true) => {
  const { rows: cursos } = await testPool.query(
    `INSERT INTO cursos (slug, titulo, descricao, nivel, publicado)
     VALUES ($1, 'Projeto Digital', 'Curso para testes', 'Iniciante', $2)
     RETURNING *`,
    [`curso-quiz-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, publicado],
  );
  const curso = cursos[0];

  const { rows: modulos } = await testPool.query(
    `INSERT INTO curso_modulos (curso_id, titulo, ordem)
     VALUES ($1, 'Transistores', 0) RETURNING *`,
    [curso.id],
  );
  const modulo = modulos[0];

  const { rows: aulas } = await testPool.query(
    `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo, publicado, ordem)
     VALUES ($1, $2, 'celulas-padrao', 'Células padrão', true, 0) RETURNING *`,
    [curso.id, modulo.id],
  );

  return { curso, modulo, aula: aulas[0] };
};

const corpoDoQuiz = (moduloId: string, aulaId: string) => ({
  modulo_id: moduloId,
  aula_id: aulaId,
  slug: 'quiz-celulas-padrao',
  titulo: '  Quiz: células padrão  ',
  questoes: [
    {
      enunciado: '  O que caracteriza uma célula padrão?  ',
      explicacao: '  A biblioteca fixa altura e trilhos de alimentação.  ',
      alternativas: [
        { texto: '  Altura e trilhos padronizados  ', correta: true },
        { texto: 'Somente o nome', correta: false },
        { texto: 'Somente a cor', correta: false },
        { texto: 'Nenhuma regra física', correta: false },
      ],
    },
  ],
});

describe('Quizzes de cursos', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('exige autenticação e cria um rascunho completo com nota padrão', async () => {
    const { curso, modulo, aula } = await criarEstrutura();
    const corpo = corpoDoQuiz(modulo.id, aula.id);

    const semToken = await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .send(corpo);
    expect(semToken.status).toBe(401);

    const token = await getAuthToken();
    const criado = await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send(corpo);

    expect(criado.status).toBe(201);
    expect(criado.body).toMatchObject({
      curso_id: curso.id,
      modulo_id: modulo.id,
      aula_id: aula.id,
      slug: 'quiz-celulas-padrao',
      titulo: 'Quiz: células padrão',
      nota_minima: 70,
      publicado: false,
    });
    expect(criado.body.questoes).toEqual([
      expect.objectContaining({
        ordem: 0,
        enunciado: 'O que caracteriza uma célula padrão?',
        explicacao: 'A biblioteca fixa altura e trilhos de alimentação.',
        alternativas: [
          expect.objectContaining({ ordem: 0, texto: 'Altura e trilhos padronizados', correta: true }),
          expect.objectContaining({ ordem: 1, texto: 'Somente o nome', correta: false }),
          expect.objectContaining({ ordem: 2, texto: 'Somente a cor', correta: false }),
          expect.objectContaining({ ordem: 3, texto: 'Nenhuma regra física', correta: false }),
        ],
      }),
    ]);

    const lido = await request(app)
      .get(`/api/cursos/quizzes/${criado.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(lido.status).toBe(200);
    expect(lido.body).toEqual(criado.body);
  });

  it('não serve rascunho e passa a servir o quiz depois da publicação', async () => {
    const { curso, modulo, aula } = await criarEstrutura();
    const token = await getAuthToken();
    const criado = await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send(corpoDoQuiz(modulo.id, aula.id));

    const rascunho = await request(app).get(
      `/api/cursos/${curso.slug}/quizzes/quiz-celulas-padrao`,
    );
    expect(rascunho.status).toBe(404);

    const publicado = await request(app)
      .put(`/api/cursos/quizzes/${criado.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ publicado: true });
    expect(publicado.status).toBe(200);
    expect(publicado.body.publicado).toBe(true);

    const publico = await request(app).get(
      `/api/cursos/${curso.slug}/quizzes/quiz-celulas-padrao`,
    );
    expect(publico.status).toBe(200);
    expect(publico.body.quiz.questoes[0].alternativas.map((item: { ordem: number }) => item.ordem)).toEqual([
      0,
      1,
      2,
      3,
    ]);
  });

  it('reutiliza a conexão adquirida ao montar as atividades vizinhas', async () => {
    const { curso, modulo, aula } = await criarEstrutura();
    const token = await getAuthToken();
    const criado = await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...corpoDoQuiz(modulo.id, aula.id), publicado: true });
    expect(criado.status).toBe(201);

    const consultaNoPool = jest.spyOn(pool, 'query');
    await cursoQuizService.getPublico(curso.slug, criado.body.slug);

    const chamadas = consultaNoPool.mock.calls.length;
    consultaNoPool.mockRestore();
    expect(chamadas).toBe(0);
  });

  it('encadeia aulas e quizzes publicados na ordem das atividades do curso', async () => {
    const { curso, modulo, aula } = await criarEstrutura();
    const { rows: aulasDoPrimeiro } = await testPool.query(
      `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo, publicado, ordem)
       VALUES ($1, $2, 'm1-a2', 'M1 A2', true, 1) RETURNING *`,
      [curso.id, modulo.id],
    );
    const { rows: segundosModulos } = await testPool.query(
      `INSERT INTO curso_modulos (curso_id, titulo, ordem)
       VALUES ($1, 'Segundo módulo', 1) RETURNING *`,
      [curso.id],
    );
    const { rows: aulasDoSegundo } = await testPool.query(
      `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo, publicado, ordem)
       VALUES ($1, $2, 'm2-a1', 'M2 A1', true, 0) RETURNING *`,
      [curso.id, segundosModulos[0].id],
    );

    const token = await getAuthToken();
    await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...corpoDoQuiz(modulo.id, aula.id),
        slug: 'quiz-m1-a1',
        titulo: 'Quiz M1 A1',
        publicado: true,
      });
    await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        ...corpoDoQuiz(modulo.id, aula.id),
        aula_id: null,
        slug: 'revisao-m1',
        titulo: 'Revisão M1',
        publicado: true,
      });

    const aula1 = await request(app).get(`/api/cursos/${curso.slug}/aulas/${aula.slug}`);
    const quiz1 = await request(app).get(`/api/cursos/${curso.slug}/quizzes/quiz-m1-a1`);
    const aula2 = await request(app).get(`/api/cursos/${curso.slug}/aulas/${aulasDoPrimeiro[0].slug}`);
    const revisao = await request(app).get(`/api/cursos/${curso.slug}/quizzes/revisao-m1`);
    const aula3 = await request(app).get(`/api/cursos/${curso.slug}/aulas/${aulasDoSegundo[0].slug}`);

    expect([
      ['aula', aula.slug],
      [aula1.body.proxima.tipo, aula1.body.proxima.slug],
      [quiz1.body.proxima.tipo, quiz1.body.proxima.slug],
      [aula2.body.proxima.tipo, aula2.body.proxima.slug],
      [revisao.body.proxima.tipo, revisao.body.proxima.slug],
    ]).toEqual([
      ['aula', 'celulas-padrao'],
      ['quiz', 'quiz-m1-a1'],
      ['aula', 'm1-a2'],
      ['quiz', 'revisao-m1'],
      ['aula', 'm2-a1'],
    ]);
    expect(quiz1.body.anterior).toEqual({ tipo: 'aula', slug: aula.slug, titulo: aula.titulo });
    expect(aula3.body.anterior).toEqual({ tipo: 'quiz', slug: 'revisao-m1', titulo: 'Revisão M1' });
  });

  it('rejeita banco de questões incompleto ou sem uma única resposta correta', async () => {
    const { curso, modulo, aula } = await criarEstrutura();
    const token = await getAuthToken();
    const corpo = corpoDoQuiz(modulo.id, aula.id);
    corpo.questoes[0].alternativas = corpo.questoes[0].alternativas.slice(0, 3);
    corpo.questoes[0].alternativas[0].correta = false;

    const resposta = await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send(corpo);

    expect(resposta.status).toBe(400);
    expect(resposta.body.error).toBe('Dados de entrada inválidos');
  });

  it('não expõe quiz publicado quando o curso está em rascunho', async () => {
    const { curso, modulo, aula } = await criarEstrutura(false);
    const token = await getAuthToken();
    const criado = await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...corpoDoQuiz(modulo.id, aula.id), publicado: true });
    expect(criado.status).toBe(201);

    const resposta = await request(app).get(
      `/api/cursos/${curso.slug}/quizzes/quiz-celulas-padrao`,
    );
    expect(resposta.status).toBe(404);
  });

  it('substitui o banco de questões inteiro e mantém a ordem enviada', async () => {
    const { curso, modulo, aula } = await criarEstrutura();
    const token = await getAuthToken();
    const criado = await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send(corpoDoQuiz(modulo.id, aula.id));

    const questoes = [
      {
        enunciado: 'Primeira nova',
        explicacao: 'Explicação da primeira',
        alternativas: [
          { texto: 'A', correta: false },
          { texto: 'B', correta: true },
          { texto: 'C', correta: false },
          { texto: 'D', correta: false },
        ],
      },
      {
        enunciado: 'Segunda nova',
        explicacao: 'Explicação da segunda',
        alternativas: [
          { texto: 'E', correta: true },
          { texto: 'F', correta: false },
          { texto: 'G', correta: false },
          { texto: 'H', correta: false },
        ],
      },
    ];
    const atualizado = await request(app)
      .put(`/api/cursos/quizzes/${criado.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Quiz revisado', questoes });

    expect(atualizado.status).toBe(200);
    expect(atualizado.body.titulo).toBe('Quiz revisado');
    expect(atualizado.body.questoes.map((questao: { enunciado: string }) => questao.enunciado)).toEqual([
      'Primeira nova',
      'Segunda nova',
    ]);
  });

  it('restaura o banco de questões anterior se a substituição falha no banco', async () => {
    const { curso, modulo, aula } = await criarEstrutura();
    const token = await getAuthToken();
    const criado = await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send(corpoDoQuiz(modulo.id, aula.id));

    await expect(
      cursoQuizService.atualizar(criado.body.id, {
        questoes: [
          {
            enunciado: 'Inválida no banco',
            explicacao: 'Duas corretas violam o índice parcial',
            alternativas: [
              { texto: 'A', correta: true },
              { texto: 'B', correta: true },
              { texto: 'C', correta: false },
              { texto: 'D', correta: false },
            ],
          },
        ],
      }),
    ).rejects.toThrow();

    const preservado = await cursoQuizService.getById(criado.body.id);
    expect(preservado.questoes).toHaveLength(1);
    expect(preservado.questoes[0].enunciado).toBe('O que caracteriza uma célula padrão?');
  });

  it('exclui quiz e seu banco de questões por cascata', async () => {
    const { curso, modulo, aula } = await criarEstrutura();
    const token = await getAuthToken();
    const criado = await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send(corpoDoQuiz(modulo.id, aula.id));

    const removido = await request(app)
      .delete(`/api/cursos/quizzes/${criado.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removido.status).toBe(200);

    const { rows } = await testPool.query(
      'SELECT COUNT(*) FROM curso_quiz_questoes WHERE quiz_id = $1',
      [criado.body.id],
    );
    expect(Number(rows[0].count)).toBe(0);
  });

  it('move o quiz para o fim do módulo e o despublica ao excluir a aula', async () => {
    const { curso, modulo, aula } = await criarEstrutura();
    const token = await getAuthToken();
    const criado = await request(app)
      .post(`/api/cursos/${curso.id}/modulos/${modulo.id}/quizzes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ ...corpoDoQuiz(modulo.id, aula.id), publicado: true });

    const removida = await request(app)
      .delete(`/api/cursos/aulas/${aula.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removida.status).toBe(200);

    const { rows } = await testPool.query(
      'SELECT aula_id, publicado FROM curso_quizzes WHERE id = $1',
      [criado.body.id],
    );
    expect(rows[0]).toEqual({ aula_id: null, publicado: false });
  });

  it('mantém aula e quiz intactos se já existe um quiz no fim do módulo', async () => {
    const { curso, modulo, aula } = await criarEstrutura();
    const { rows: associados } = await testPool.query(
      `INSERT INTO curso_quizzes
         (curso_id, modulo_id, aula_id, slug, titulo, publicado)
       VALUES ($1, $2, $3, 'associado', 'Associado', true) RETURNING id`,
      [curso.id, modulo.id, aula.id],
    );
    await testPool.query(
      `INSERT INTO curso_quizzes (curso_id, modulo_id, slug, titulo, publicado)
       VALUES ($1, $2, 'final', 'Final', true)`,
      [curso.id, modulo.id],
    );

    const token = await getAuthToken();
    const resposta = await request(app)
      .delete(`/api/cursos/aulas/${aula.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(resposta.status).toBe(409);

    const { rows: aulas } = await testPool.query('SELECT id FROM curso_aulas WHERE id = $1', [aula.id]);
    expect(aulas).toHaveLength(1);
    const { rows: quizzes } = await testPool.query(
      'SELECT aula_id, publicado FROM curso_quizzes WHERE id = $1',
      [associados[0].id],
    );
    expect(quizzes[0]).toEqual({ aula_id: aula.id, publicado: true });
  });
});
