import request from 'supertest';
import app from '../../server';
import { cleanDatabase } from '../utils/helpers';
import { getAuthToken } from '../utils/auth';
import { testPool } from '../setup';

/**
 * Monta um curso com um módulo e as aulas pedidas, direto no banco, para os
 * testes de leitura não dependerem das rotas de escrita.
 */
const criarCurso = async (opcoes: {
  slug?: string;
  publicado?: boolean;
  aulas?: Array<{ slug: string; titulo: string; publicado: boolean; duracao_seg?: number }>;
} = {}) => {
  const slug = opcoes.slug ?? `curso-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const { rows: cursos } = await testPool.query(
    `INSERT INTO cursos (slug, titulo, descricao, nivel, publicado)
     VALUES ($1, 'Do RTL ao GDS', 'Uma trilha de teste', 'Iniciante', $2)
     RETURNING *`,
    [slug, opcoes.publicado ?? true],
  );
  const curso = cursos[0];

  const { rows: modulos } = await testPool.query(
    `INSERT INTO curso_modulos (curso_id, titulo, ordem) VALUES ($1, 'Ambiente', 0) RETURNING *`,
    [curso.id],
  );
  const modulo = modulos[0];

  const aulas = [];
  for (const [indice, aula] of (opcoes.aulas ?? []).entries()) {
    const { rows } = await testPool.query(
      `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo, publicado, ordem, duracao_seg)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [curso.id, modulo.id, aula.slug, aula.titulo, aula.publicado, indice, aula.duracao_seg ?? null],
    );
    aulas.push(rows[0]);
  }

  return { curso, modulo, aulas };
};

const criarQuizDireto = async (dados: {
  cursoId: string;
  moduloId: string;
  aulaId?: string | null;
  slug: string;
  titulo: string;
  publicado: boolean;
  questoes?: number;
}) => {
  const { rows } = await testPool.query(
    `INSERT INTO curso_quizzes
       (curso_id, modulo_id, aula_id, slug, titulo, publicado)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      dados.cursoId,
      dados.moduloId,
      dados.aulaId ?? null,
      dados.slug,
      dados.titulo,
      dados.publicado,
    ],
  );
  const quiz = rows[0];

  for (let ordem = 0; ordem < (dados.questoes ?? 0); ordem++) {
    const { rows: questoes } = await testPool.query(
      `INSERT INTO curso_quiz_questoes (quiz_id, ordem, enunciado, explicacao)
       VALUES ($1, $2, $3, 'Explicação') RETURNING id`,
      [quiz.id, ordem, `Questão ${ordem + 1}`],
    );
    for (let alternativa = 0; alternativa < 4; alternativa++) {
      await testPool.query(
        `INSERT INTO curso_quiz_alternativas (questao_id, ordem, texto, correta)
         VALUES ($1, $2, $3, $4)`,
        [questoes[0].id, alternativa, `Alternativa ${alternativa + 1}`, alternativa === 0],
      );
    }
  }

  return quiz;
};

describe('Cursos API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/cursos', () => {
    it('soma quizzes e lista somente os publicados na ordem do curso', async () => {
      const { curso, modulo, aulas } = await criarCurso({
        aulas: [
          { slug: 'a1', titulo: 'A1', publicado: true },
          { slug: 'a2', titulo: 'A2', publicado: true },
        ],
      });
      await criarQuizDireto({
        cursoId: curso.id,
        moduloId: modulo.id,
        aulaId: aulas[1].id,
        slug: 'depois-a2',
        titulo: 'Depois da A2',
        publicado: true,
      });
      await criarQuizDireto({
        cursoId: curso.id,
        moduloId: modulo.id,
        slug: 'final-rascunho',
        titulo: 'Final em preparo',
        publicado: false,
      });

      const resposta = await request(app).get('/api/cursos');
      const encontrado = resposta.body.data.find((item: { id: string }) => item.id === curso.id);

      expect(encontrado.quizzes).toBe(1);
      expect(encontrado.quizzes_rascunho).toBe(1);
      expect(encontrado.quizzes_publicados).toEqual([
        {
          slug: 'depois-a2',
          titulo: 'Depois da A2',
          aula_id: aulas[1].id,
          nota_minima: 70,
        },
      ]);
    });

    it('soma módulos, aulas e duração publicadas', async () => {
      await criarCurso({
        aulas: [
          { slug: 'pdk', titulo: 'O que é um PDK', publicado: true, duracao_seg: 480 },
          { slug: 'verilog', titulo: 'Seu primeiro Verilog', publicado: true, duracao_seg: 840 },
          { slug: 'rascunho', titulo: 'Ainda escrevendo', publicado: false, duracao_seg: 600 },
        ],
      });

      const resposta = await request(app).get('/api/cursos').query({ published: true });

      expect(resposta.status).toBe(200);
      const curso = resposta.body.data[0];
      expect(curso.modulos).toBe(1);
      expect(curso.aulas).toBe(2);
      expect(curso.aulas_rascunho).toBe(1);
      // O rascunho não entra na soma: é o denominador do progresso do leitor.
      expect(curso.duracao_seg).toBe(1320);
      expect(curso.aulas_publicadas).toEqual([
        { slug: 'pdk', titulo: 'O que é um PDK', duracao_seg: 480, opcional: false },
        { slug: 'verilog', titulo: 'Seu primeiro Verilog', duracao_seg: 840, opcional: false },
      ]);
    });

    it('ordena as aulas atravessando os módulos, não por ordem dentro de cada um', async () => {
      // Cada módulo numera as aulas a partir de zero, então ordenar só por
      // curso_aulas.ordem intercala os módulos e o botão "começar" do índice
      // manda o leitor para a aula errada.
      const { curso } = await criarCurso({
        aulas: [
          { slug: 'm1-a1', titulo: 'M1 A1', publicado: true },
          { slug: 'm1-a2', titulo: 'M1 A2', publicado: true },
        ],
      });

      const { rows: segundos } = await testPool.query(
        `INSERT INTO curso_modulos (curso_id, titulo, ordem) VALUES ($1, 'Frontend', 1) RETURNING *`,
        [curso.id],
      );
      for (const [indice, slug] of ['m2-a1', 'm2-a2'].entries()) {
        await testPool.query(
          `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo, publicado, ordem)
           VALUES ($1, $2, $3, $4, true, $5)`,
          [curso.id, segundos[0].id, slug, slug.toUpperCase(), indice],
        );
      }
      const resposta = await request(app).get('/api/cursos').query({ published: true });

      const encontrado = resposta.body.data.find((c: { slug: string }) => c.slug === curso.slug);
      expect(encontrado.aulas_publicadas.map((a: { slug: string }) => a.slug)).toEqual([
        'm1-a1',
        'm1-a2',
        'm2-a1',
        'm2-a2',
      ]);
    });

    it('ignora ?published=false na rota pública', async () => {
      await criarCurso({ slug: 'rascunho-pedido', publicado: false });
      await criarCurso({ slug: 'no-ar', publicado: true });

      // Sem isto a rota pública entrega o título dos rascunhos a quem pedir.
      const resposta = await request(app).get('/api/cursos').query({ published: false });

      expect(resposta.status).toBe(200);
      const slugs = resposta.body.data.map((c: { slug: string }) => c.slug);
      expect(slugs).not.toContain('rascunho-pedido');
      expect(slugs).toContain('no-ar');
    });

    it('a rota do admin lista rascunhos, e só com token', async () => {
      await criarCurso({ slug: 'rascunho-do-admin', publicado: false });

      const semToken = await request(app).get('/api/cursos/admin/todos');
      expect(semToken.status).toBe(401);

      const token = await getAuthToken();
      const comToken = await request(app)
        .get('/api/cursos/admin/todos')
        .set('Authorization', `Bearer ${token}`);

      expect(comToken.status).toBe(200);
      expect(comToken.body.data.map((c: { slug: string }) => c.slug)).toContain('rascunho-do-admin');
    });

    it('não lista curso despublicado', async () => {
      await criarCurso({ slug: 'rascunho-de-curso', publicado: false });

      const resposta = await request(app).get('/api/cursos').query({ published: true });

      expect(resposta.status).toBe(200);
      expect(resposta.body.data.map((c: { slug: string }) => c.slug)).not.toContain('rascunho-de-curso');
    });
  });

  describe('GET /api/cursos/:slug', () => {
    it('devolve quizzes publicados completos e rascunhos sem metadados privados', async () => {
      const { curso, modulo, aulas } = await criarCurso({
        aulas: [{ slug: 'aula-a', titulo: 'Aula A', publicado: true }],
      });
      await criarQuizDireto({
        cursoId: curso.id,
        moduloId: modulo.id,
        aulaId: aulas[0].id,
        slug: 'quiz-a',
        titulo: 'Quiz A',
        publicado: true,
        questoes: 4,
      });
      await criarQuizDireto({
        cursoId: curso.id,
        moduloId: modulo.id,
        slug: 'quiz-em-preparo',
        titulo: 'Quiz em preparo',
        publicado: false,
        questoes: 2,
      });

      const resposta = await request(app).get(`/api/cursos/${curso.slug}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.modulos[0].quizzes).toEqual([
        {
          publicado: true,
          id: expect.any(String),
          aula_id: aulas[0].id,
          slug: 'quiz-a',
          titulo: 'Quiz A',
          nota_minima: 70,
          total_questoes: 4,
        },
        { publicado: false, id: expect.any(String), titulo: 'Quiz em preparo' },
      ]);
    });

    it('devolve a árvore com a aula em rascunho sem slug nem duração', async () => {
      const { curso } = await criarCurso({
        slug: 'do-rtl-ao-gds',
        aulas: [
          { slug: 'pdk', titulo: 'O que é um PDK', publicado: true, duracao_seg: 480 },
          { slug: 'em-breve', titulo: 'Síntese com Yosys', publicado: false, duracao_seg: 900 },
        ],
      });

      const resposta = await request(app).get(`/api/cursos/${curso.slug}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.total_aulas).toBe(1);
      expect(resposta.body.duracao_seg).toBe(480);

      const [publicada, rascunho] = resposta.body.modulos[0].aulas;
      expect(publicada).toMatchObject({ publicado: true, slug: 'pdk', duracao_seg: 480 });
      expect(rascunho).toEqual({ publicado: false, id: expect.any(String), titulo: 'Síntese com Yosys' });
      expect(rascunho).not.toHaveProperty('slug');
    });

    it('devolve os módulos na ordem, e as aulas dentro de cada um', async () => {
      const { curso, modulo } = await criarCurso({
        slug: 'ordem-da-arvore',
        aulas: [
          { slug: 'a1', titulo: 'A1', publicado: true },
          { slug: 'a2', titulo: 'A2', publicado: true },
        ],
      });

      // Criado com ordem 0, igual ao primeiro: o desempate por id manteria uma
      // ordem arbitrária, então o segundo módulo recebe a posição seguinte.
      await testPool.query(
        `INSERT INTO curso_modulos (curso_id, titulo, ordem) VALUES ($1, 'Frontend', 1)`,
        [curso.id],
      );
      await testPool.query('UPDATE curso_modulos SET ordem = 0 WHERE id = $1', [modulo.id]);

      const resposta = await request(app).get(`/api/cursos/${curso.slug}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.modulos.map((m: { titulo: string }) => m.titulo)).toEqual([
        'Ambiente',
        'Frontend',
      ]);
      expect(resposta.body.modulos[0].aulas.map((a: { slug: string }) => a.slug)).toEqual([
        'a1',
        'a2',
      ]);
    });

    it('devolve 404 para curso despublicado', async () => {
      const { curso } = await criarCurso({ publicado: false });

      const resposta = await request(app).get(`/api/cursos/${curso.slug}`);

      expect(resposta.status).toBe(404);
    });
  });

  describe('GET /api/cursos/:slug/aulas/:aulaSlug', () => {
    it('traz a aula com posição e vizinhas', async () => {
      const { curso } = await criarCurso({
        slug: 'trilha',
        aulas: [
          { slug: 'um', titulo: 'Aula um', publicado: true },
          { slug: 'dois', titulo: 'Aula dois', publicado: true },
          { slug: 'tres', titulo: 'Aula três', publicado: true },
        ],
      });

      const resposta = await request(app).get(`/api/cursos/${curso.slug}/aulas/dois`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.posicao).toBe(2);
      expect(resposta.body.total).toBe(3);
      expect(resposta.body.anterior).toMatchObject({ slug: 'um' });
      expect(resposta.body.proxima).toMatchObject({ slug: 'tres' });
    });

    it('não serve aula em rascunho', async () => {
      const { curso } = await criarCurso({
        aulas: [{ slug: 'escondida', titulo: 'Escondida', publicado: false }],
      });

      const resposta = await request(app).get(`/api/cursos/${curso.slug}/aulas/escondida`);

      expect(resposta.status).toBe(404);
    });
  });

  describe('integridade da estrutura', () => {
    it('recusa quiz associado a uma aula de outro curso', async () => {
      await expect(testPool.query('SELECT 1 FROM curso_quizzes LIMIT 0')).resolves.toBeDefined();

      const a = await criarCurso({
        slug: 'curso-do-quiz',
        aulas: [{ slug: 'aula-a', titulo: 'Aula A', publicado: true }],
      });
      const b = await criarCurso({
        slug: 'curso-da-aula',
        aulas: [{ slug: 'aula-b', titulo: 'Aula B', publicado: true }],
      });

      await expect(
        testPool.query(
          `INSERT INTO curso_quizzes
             (curso_id, modulo_id, aula_id, slug, titulo)
           VALUES ($1, $2, $3, 'quiz-intruso', 'Quiz intruso')`,
          [a.curso.id, a.modulo.id, b.aulas[0].id],
        ),
      ).rejects.toThrow();
    });

    it('recusa dois quizzes associados à mesma aula', async () => {
      const { curso, modulo, aulas } = await criarCurso({
        aulas: [{ slug: 'uma-aula', titulo: 'Uma aula', publicado: true }],
      });

      await testPool.query(
        `INSERT INTO curso_quizzes (curso_id, modulo_id, aula_id, slug, titulo)
         VALUES ($1, $2, $3, 'primeiro', 'Primeiro')`,
        [curso.id, modulo.id, aulas[0].id],
      );

      await expect(
        testPool.query(
          `INSERT INTO curso_quizzes (curso_id, modulo_id, aula_id, slug, titulo)
           VALUES ($1, $2, $3, 'segundo', 'Segundo')`,
          [curso.id, modulo.id, aulas[0].id],
        ),
      ).rejects.toThrow();
    });

    it('recusa dois quizzes no fim do mesmo módulo', async () => {
      const { curso, modulo } = await criarCurso();

      await testPool.query(
        `INSERT INTO curso_quizzes (curso_id, modulo_id, slug, titulo)
         VALUES ($1, $2, 'primeiro-final', 'Primeiro final')`,
        [curso.id, modulo.id],
      );

      await expect(
        testPool.query(
          `INSERT INTO curso_quizzes (curso_id, modulo_id, slug, titulo)
           VALUES ($1, $2, 'segundo-final', 'Segundo final')`,
          [curso.id, modulo.id],
        ),
      ).rejects.toThrow();
    });

    it('recusa duas alternativas corretas na mesma questão', async () => {
      const { curso, modulo } = await criarCurso();
      const { rows: quizzes } = await testPool.query(
        `INSERT INTO curso_quizzes (curso_id, modulo_id, slug, titulo)
         VALUES ($1, $2, 'quiz-respostas', 'Quiz respostas') RETURNING id`,
        [curso.id, modulo.id],
      );
      const { rows: questoes } = await testPool.query(
        `INSERT INTO curso_quiz_questoes (quiz_id, ordem, enunciado, explicacao)
         VALUES ($1, 0, 'Uma questão', 'Uma explicação') RETURNING id`,
        [quizzes[0].id],
      );

      await testPool.query(
        `INSERT INTO curso_quiz_alternativas (questao_id, ordem, texto, correta)
         VALUES ($1, 0, 'Correta A', true)`,
        [questoes[0].id],
      );

      await expect(
        testPool.query(
          `INSERT INTO curso_quiz_alternativas (questao_id, ordem, texto, correta)
           VALUES ($1, 1, 'Correta B', true)`,
          [questoes[0].id],
        ),
      ).rejects.toThrow();
    });

    it('recusa aula cujo curso não é o curso do módulo', async () => {
      const a = await criarCurso({ slug: 'curso-a' });
      const b = await criarCurso({ slug: 'curso-b' });

      // A chave estrangeira composta é o que sustenta a URL /cursos/:curso/:aula.
      await expect(
        testPool.query(
          `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo)
           VALUES ($1, $2, 'intrusa', 'Intrusa')`,
          [a.curso.id, b.modulo.id],
        ),
      ).rejects.toThrow();
    });

    it('recusa duas aulas com o mesmo slug no mesmo curso', async () => {
      const { curso, modulo } = await criarCurso();

      await testPool.query(
        `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo) VALUES ($1, $2, 'repetida', 'Uma')`,
        [curso.id, modulo.id],
      );

      await expect(
        testPool.query(
          `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo) VALUES ($1, $2, 'repetida', 'Outra')`,
          [curso.id, modulo.id],
        ),
      ).rejects.toThrow();
    });
  });

  describe('escrita', () => {
    it('exige autenticação', async () => {
      const resposta = await request(app)
        .post('/api/cursos')
        .send({ slug: 'sem-token', titulo: 'Sem token', descricao: 'x' });

      expect(resposta.status).toBe(401);
    });

    it('cria e atualiza um curso pela API, aparando os espaços', async () => {
      const token = await getAuthToken();

      const criado = await request(app)
        .post('/api/cursos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slug: 'curso-pela-api',
          titulo: '  Do RTL ao GDS  ',
          descricao: '  Uma trilha.  ',
          nivel: 'Iniciante',
        });

      expect(criado.status).toBe(201);
      // O .trim() dos schemas é transform, e validate() descarta o parse: sem
      // aparar no controller os espaços chegariam ao banco.
      expect(criado.body.titulo).toBe('Do RTL ao GDS');
      expect(criado.body.descricao).toBe('Uma trilha.');
      expect(criado.body.publicado).toBe(false);

      const atualizado = await request(app)
        .put(`/api/cursos/${criado.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ titulo: 'Do RTL ao GDS, revisado', publicado: true });

      expect(atualizado.status).toBe(200);
      expect(atualizado.body.titulo).toBe('Do RTL ao GDS, revisado');
      expect(atualizado.body.publicado).toBe(true);
      // Um update parcial não pode apagar o que não veio no corpo.
      expect(atualizado.body.descricao).toBe('Uma trilha.');
      expect(atualizado.body.nivel).toBe('Iniciante');
    });

    it('normaliza a URL do YouTube para o id ao criar a aula', async () => {
      const token = await getAuthToken();
      const { curso, modulo } = await criarCurso();

      const resposta = await request(app)
        .post(`/api/cursos/${curso.id}/aulas`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          modulo_id: modulo.id,
          slug: 'com-video',
          titulo: 'Com vídeo',
          video_id: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10s',
        });

      expect(resposta.status).toBe(201);
      expect(resposta.body.video_id).toBe('dQw4w9WgXcQ');
    });

    it('a aula criada como opcional volta marcada na árvore e no índice', async () => {
      // É por esses dois caminhos que o leitor recebe a marca: sem ela, a aula
      // alternativa volta a entrar no denominador do progresso.
      const token = await getAuthToken();
      const { curso, modulo } = await criarCurso();

      const criada = await request(app)
        .post(`/api/cursos/${curso.id}/aulas`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          modulo_id: modulo.id,
          slug: 'instalar-no-windows',
          titulo: 'Instalar no Windows',
          publicado: true,
          opcional: true,
        });

      expect(criada.status).toBe(201);
      expect(criada.body.opcional).toBe(true);

      const arvore = await request(app).get(`/api/cursos/${curso.slug}`);
      expect(arvore.body.modulos[0].aulas[0]).toMatchObject({
        slug: 'instalar-no-windows',
        opcional: true,
      });

      const indice = await request(app).get('/api/cursos').query({ published: true });
      const naListagem = indice.body.data.find((c: { slug: string }) => c.slug === curso.slug);
      expect(naListagem.aulas_publicadas).toEqual([
        {
          slug: 'instalar-no-windows',
          titulo: 'Instalar no Windows',
          duracao_seg: null,
          opcional: true,
        },
      ]);
    });

    it('reordena as aulas numa tacada e mantém a ordem pedida', async () => {
      const token = await getAuthToken();
      const { modulo, aulas } = await criarCurso({
        aulas: [
          { slug: 'a', titulo: 'A', publicado: true },
          { slug: 'b', titulo: 'B', publicado: true },
          { slug: 'c', titulo: 'C', publicado: true },
        ],
      });

      const invertida = [aulas[2].id, aulas[1].id, aulas[0].id];
      const resposta = await request(app)
        .put(`/api/cursos/modulos/${modulo.id}/aulas/ordem`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: invertida });

      expect(resposta.status).toBe(200);

      const { rows } = await testPool.query(
        'SELECT slug FROM curso_aulas WHERE modulo_id = $1 ORDER BY ordem',
        [modulo.id],
      );
      expect(rows.map((r) => r.slug)).toEqual(['c', 'b', 'a']);
    });

    it('reordenar não mexe em aula de outro módulo', async () => {
      const token = await getAuthToken();
      const a = await criarCurso({
        slug: 'escopo-a',
        aulas: [{ slug: 'a1', titulo: 'A1', publicado: true }],
      });
      const b = await criarCurso({
        slug: 'escopo-b',
        aulas: [{ slug: 'b1', titulo: 'B1', publicado: true }],
      });

      // O id do outro módulo entra na lista; o WHERE de escopo tem que ignorá-lo,
      // senão uma requisição forjada reordenaria o curso alheio.
      const resposta = await request(app)
        .put(`/api/cursos/modulos/${a.modulo.id}/aulas/ordem`)
        .set('Authorization', `Bearer ${token}`)
        .send({ ids: [b.aulas[0].id, a.aulas[0].id] });

      expect(resposta.status).toBe(200);

      const { rows } = await testPool.query('SELECT ordem FROM curso_aulas WHERE id = $1', [
        b.aulas[0].id,
      ]);
      expect(rows[0].ordem).toBe(0);
    });

    it('id malformado dá 404, não 500', async () => {
      const token = await getAuthToken();

      // Sem a guarda, o Postgres recusa o texto como uuid (22P02) e o erro
      // sobe como 500, dizendo "quebrou" quando a resposta certa é "não existe".
      const resposta = await request(app)
        .get('/api/cursos/id/nao-e-um-uuid')
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(404);
    });

    it('esvaziar o resumo de um módulo realmente apaga', async () => {
      const token = await getAuthToken();
      const { modulo } = await criarCurso();

      await request(app)
        .put(`/api/cursos/modulos/${modulo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ titulo: 'Ambiente', resumo: 'Um resumo qualquer' });

      const resposta = await request(app)
        .put(`/api/cursos/modulos/${modulo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ titulo: 'Ambiente', resumo: null });

      expect(resposta.status).toBe(200);
      expect(resposta.body.resumo).toBeNull();
    });

    it('publicar o módulo publica só as aulas dele', async () => {
      const token = await getAuthToken();
      const { curso, modulo } = await criarCurso({
        slug: 'publicar-o-modulo',
        aulas: [
          { slug: 'a1', titulo: 'A1', publicado: false },
          { slug: 'a2', titulo: 'A2', publicado: false },
        ],
      });

      const { rows: outros } = await testPool.query(
        `INSERT INTO curso_modulos (curso_id, titulo, ordem) VALUES ($1, 'Frontend', 1) RETURNING *`,
        [curso.id],
      );
      await testPool.query(
        `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo, publicado, ordem)
         VALUES ($1, $2, 'b1', 'B1', false, 0)`,
        [curso.id, outros[0].id],
      );

      const resposta = await request(app)
        .put(`/api/cursos/modulos/${modulo.id}/publicar`)
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(200);
      expect(resposta.body.publicadas).toBe(2);

      const arvore = await request(app).get(`/api/cursos/${curso.slug}`);
      expect(arvore.body.modulos[0].aulas.map((a: { slug?: string }) => a.slug)).toEqual([
        'a1',
        'a2',
      ]);
      // O escopo é o módulo: a aula do módulo vizinho continua rascunho, e a
      // aula em rascunho volta da árvore sem slug.
      expect(arvore.body.modulos[1].aulas[0]).toEqual({
        publicado: false,
        id: expect.any(String),
        titulo: 'B1',
      });
    });

    it('apagar o curso leva módulos e aulas junto', async () => {
      const token = await getAuthToken();
      const { curso } = await criarCurso({
        aulas: [{ slug: 'a', titulo: 'A', publicado: true }],
      });

      const resposta = await request(app)
        .delete(`/api/cursos/${curso.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(resposta.status).toBe(200);

      const { rows } = await testPool.query('SELECT COUNT(*) FROM curso_aulas WHERE curso_id = $1', [
        curso.id,
      ]);
      expect(Number(rows[0].count)).toBe(0);
    });
  });

  describe('ligações com a wiki', () => {
    it('aceita content_type curso_aula depois da migração 015', async () => {
      const { curso, modulo } = await criarCurso();

      const { rows: aulas } = await testPool.query(
        `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo, publicado)
         VALUES ($1, $2, 'com-verbete', 'Com verbete', true) RETURNING *`,
        [curso.id, modulo.id],
      );

      const { rows: verbetes } = await testPool.query(
        `INSERT INTO wiki_entries (term, slug, definition, published)
         VALUES ('PDK', 'pdk', 'Process Design Kit', true) RETURNING *`,
      );

      await expect(
        testPool.query(
          `INSERT INTO content_wiki_links (content_type, content_id, wiki_entry_id, link_text)
           VALUES ('curso_aula', $1, $2, 'PDK')`,
          [aulas[0].id, verbetes[0].id],
        ),
      ).resolves.toBeDefined();
    });

    it('lista a aula em GET /api/wiki/:slug/aparicoes', async () => {
      const { curso, modulo } = await criarCurso({ slug: 'trilha-wiki' });

      const { rows: aulas } = await testPool.query(
        `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo, publicado)
         VALUES ($1, $2, 'usa-pdk', 'Usa PDK', true) RETURNING *`,
        [curso.id, modulo.id],
      );
      const { rows: verbetes } = await testPool.query(
        `INSERT INTO wiki_entries (term, slug, definition, published)
         VALUES ('PDK', 'pdk', 'Process Design Kit', true) RETURNING *`,
      );
      await testPool.query(
        `INSERT INTO content_wiki_links (content_type, content_id, wiki_entry_id, link_text)
         VALUES ('curso_aula', $1, $2, 'PDK')`,
        [aulas[0].id, verbetes[0].id],
      );

      const resposta = await request(app).get('/api/wiki/pdk/aparicoes');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toContainEqual(
        expect.objectContaining({
          content_type: 'curso_aula',
          titulo: 'Usa PDK',
          href: '/cursos/trilha-wiki/usa-pdk',
          contexto: 'Do RTL ao GDS',
        }),
      );
    });

    it('esconde a aparição quando o curso está despublicado', async () => {
      const { curso, modulo } = await criarCurso({ publicado: false });

      const { rows: aulas } = await testPool.query(
        `INSERT INTO curso_aulas (curso_id, modulo_id, slug, titulo, publicado)
         VALUES ($1, $2, 'oculta', 'Oculta', true) RETURNING *`,
        [curso.id, modulo.id],
      );
      const { rows: verbetes } = await testPool.query(
        `INSERT INTO wiki_entries (term, slug, definition, published)
         VALUES ('PDK', 'pdk', 'Process Design Kit', true) RETURNING *`,
      );
      await testPool.query(
        `INSERT INTO content_wiki_links (content_type, content_id, wiki_entry_id, link_text)
         VALUES ('curso_aula', $1, $2, 'PDK')`,
        [aulas[0].id, verbetes[0].id],
      );

      const resposta = await request(app).get('/api/wiki/pdk/aparicoes');

      expect(resposta.status).toBe(200);
      expect(resposta.body).toEqual([]);
    });
  });
});
