import pool from '../config/database';
import { BaseService, PaginationOptions, PaginatedResult } from '../services/BaseService';
import { NotFoundError, DatabaseError } from '../errors/AppError';

export interface Curso {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  ementa?: string | null;
  image_url?: string | null;
  nivel?: string | null;
  publicado: boolean;
  created_at: Date | string;
  updated_at: Date;
}

export interface CursoModulo {
  id: string;
  curso_id: string;
  ordem: number;
  titulo: string;
  resumo?: string | null;
  created_at: Date | string;
  updated_at: Date;
}

export interface CursoAula {
  id: string;
  curso_id: string;
  modulo_id: string;
  ordem: number;
  slug: string;
  titulo: string;
  video_id?: string | null;
  duracao_seg?: number | null;
  conteudo?: string | null;
  publicado: boolean;
  created_at: Date | string;
  updated_at: Date;
}

/** O curso como aparece no índice: sem árvore, com os números somados. */
export interface CursoNaListagem extends Curso {
  modulos: number;
  aulas: number;
  aulas_rascunho: number;
  duracao_seg: number;
  /**
   * As aulas publicadas, em ordem, só com o necessário para duas coisas do
   * índice: o título alimenta a busca da página de Educação, onde a aula não
   * tem cartão próprio, e o slug é o que o progresso guardado no navegador usa
   * como chave, então sem ele não dá para desenhar a barra sem abrir o curso.
   */
  aulas_publicadas: Array<{ slug: string; titulo: string }>;
}

/**
 * Aula dentro da árvore do currículo. A união é discriminada por `publicado`
 * porque a aula não publicada sai sem slug: não há para onde navegar, e o
 * currículo só mostra a linha "em breve".
 */
export type AulaNaArvore =
  | {
      publicado: true;
      id: string;
      slug: string;
      titulo: string;
      duracao_seg: number | null;
      tem_video: boolean;
    }
  | { publicado: false; id: string; titulo: string };

export interface ModuloNaArvore extends CursoModulo {
  aulas: AulaNaArvore[];
}

export interface CursoComArvore extends Curso {
  modulos: ModuloNaArvore[];
  /** Contagem de aulas publicadas: é o denominador do progresso do leitor. */
  total_aulas: number;
  duracao_seg: number;
}

export interface VizinhaDaAula {
  slug: string;
  titulo: string;
}

export interface AulaComVizinhas {
  aula: CursoAula;
  curso: Pick<Curso, 'id' | 'slug' | 'titulo'>;
  modulo: Pick<CursoModulo, 'id' | 'titulo' | 'ordem'>;
  posicao: number;
  total: number;
  anterior: VizinhaDaAula | null;
  proxima: VizinhaDaAula | null;
}

type LinhaDeAula = Pick<
  CursoAula,
  'id' | 'modulo_id' | 'ordem' | 'slug' | 'titulo' | 'duracao_seg' | 'publicado'
> & { video_id: string | null };

export class CursoService extends BaseService<Curso> {
  constructor() {
    super(pool, 'cursos', 'Curso');
  }

  /**
   * Índice de cursos. Os agregados vêm de dois LATERAL, e não de uma consulta
   * por curso, para a listagem continuar sendo uma ida ao banco.
   *
   * `aulas` e `duracao_seg` contam só o que está publicado, porque são o que o
   * leitor vê e o denominador do progresso dele. `aulas_rascunho` existe para o
   * admin saber o que falta sem precisar de outra rota.
   */
  async listar(
    publicado?: boolean,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResult<CursoNaListagem>> {
    try {
      const filtro = publicado === undefined ? '' : 'WHERE c.publicado = $1';
      const params: unknown[] = publicado === undefined ? [] : [publicado];

      const contagem = await this.pool.query(
        `SELECT COUNT(*) FROM cursos c ${filtro}`,
        params,
      );
      const total = parseInt(contagem.rows[0].count, 10);

      let consulta = `
        SELECT c.*,
               COALESCE(m.total, 0)                AS modulos,
               COALESCE(a.publicadas, 0)           AS aulas,
               COALESCE(a.rascunhos, 0)            AS aulas_rascunho,
               COALESCE(a.duracao, 0)              AS duracao_seg,
               COALESCE(a.publicadas_json, '[]'::json) AS aulas_publicadas
          FROM cursos c
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS total
              FROM curso_modulos
             WHERE curso_id = c.id
          ) m ON true
          LEFT JOIN LATERAL (
            SELECT (COUNT(*) FILTER (WHERE au.publicado))::int     AS publicadas,
                   (COUNT(*) FILTER (WHERE NOT au.publicado))::int AS rascunhos,
                   COALESCE(SUM(au.duracao_seg) FILTER (WHERE au.publicado), 0)::int AS duracao,
                   -- A ordem tem que atravessar os módulos (ordem do módulo,
                   -- depois da aula). Ordenar só por au.ordem intercala os
                   -- módulos, e aí o botão "começar" do índice aponta para a
                   -- aula errada.
                   JSON_AGG(JSON_BUILD_OBJECT('slug', au.slug, 'titulo', au.titulo)
                            ORDER BY mo.ordem, au.ordem, au.id)
                     FILTER (WHERE au.publicado) AS publicadas_json
              FROM curso_aulas au
              JOIN curso_modulos mo ON mo.id = au.modulo_id
             WHERE au.curso_id = c.id
          ) a ON true
          ${filtro}
         ORDER BY c.created_at DESC
      `;

      const parametros = [...params];
      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        consulta += ` LIMIT $${parametros.length + 1} OFFSET $${parametros.length + 2}`;
        parametros.push(pagination.limit, offset);
      }

      const { rows } = await this.pool.query<CursoNaListagem>(consulta, parametros);

      const page = pagination?.page || 1;
      const limit = pagination?.limit || total;
      const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

      return {
        data: rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (erro) {
      console.error('Erro ao listar cursos:', erro);
      throw new DatabaseError('Erro ao buscar cursos');
    }
  }

  async getBySlug(slug: string, apenasPublicado: boolean): Promise<Curso> {
    const filtro = apenasPublicado ? 'AND publicado = true' : '';
    const { rows } = await this.pool.query<Curso>(
      `SELECT * FROM cursos WHERE slug = $1 ${filtro}`,
      [slug],
    );
    if (rows.length === 0) throw new NotFoundError('Curso');
    return rows[0];
  }

  /**
   * O currículo inteiro numa requisição: curso, módulos e aulas.
   *
   * A aula não publicada volta só com id e título, para o currículo mostrar
   * "em breve" sem entregar o corpo nem um endereço que daria 404. O corpo de
   * nenhuma aula vem aqui: quem quer ler abre a aula.
   */
  async getArvore(slug: string, incluirRascunhos: boolean): Promise<CursoComArvore> {
    const curso = await this.getBySlug(slug, !incluirRascunhos);

    const [modulos, aulas] = await Promise.all([
      this.pool.query<CursoModulo>(
        'SELECT * FROM curso_modulos WHERE curso_id = $1 ORDER BY ordem, id',
        [curso.id],
      ),
      this.pool.query<LinhaDeAula>(
        `SELECT a.id, a.modulo_id, a.ordem, a.slug, a.titulo, a.duracao_seg, a.publicado, a.video_id
           FROM curso_aulas a
          WHERE a.curso_id = $1
          ORDER BY a.ordem, a.id`,
        [curso.id],
      ),
    ]);

    const porModulo = new Map<string, AulaNaArvore[]>();
    let totalPublicadas = 0;
    let duracao = 0;

    for (const aula of aulas.rows) {
      const lista = porModulo.get(aula.modulo_id) ?? [];
      if (aula.publicado) {
        totalPublicadas++;
        duracao += aula.duracao_seg ?? 0;
        lista.push({
          publicado: true,
          id: aula.id,
          slug: aula.slug,
          titulo: aula.titulo,
          duracao_seg: aula.duracao_seg ?? null,
          tem_video: Boolean(aula.video_id),
        });
      } else {
        lista.push({ publicado: false, id: aula.id, titulo: aula.titulo });
      }
      porModulo.set(aula.modulo_id, lista);
    }

    return {
      ...curso,
      modulos: modulos.rows.map((m) => ({ ...m, aulas: porModulo.get(m.id) ?? [] })),
      total_aulas: totalPublicadas,
      duracao_seg: duracao,
    };
  }

  /**
   * Uma aula publicada com o corpo, mais as vizinhas na ordem do curso.
   *
   * A ordem atravessa módulos (ordem do módulo, depois ordem da aula), então a
   * última aula do módulo 1 aponta para a primeira do módulo 2.
   */
  async getAula(cursoSlug: string, aulaSlug: string): Promise<AulaComVizinhas> {
    const { rows: encontradas } = await this.pool.query<
      CursoAula & { curso_slug: string; curso_titulo: string; modulo_titulo: string; modulo_ordem: number }
    >(
      `SELECT a.*, c.slug AS curso_slug, c.titulo AS curso_titulo,
              m.titulo AS modulo_titulo, m.ordem AS modulo_ordem
         FROM curso_aulas a
         JOIN cursos c ON c.id = a.curso_id
         JOIN curso_modulos m ON m.id = a.modulo_id
        WHERE c.slug = $1 AND a.slug = $2
          AND a.publicado = true AND c.publicado = true`,
      [cursoSlug, aulaSlug],
    );

    if (encontradas.length === 0) throw new NotFoundError('Aula');
    const linha = encontradas[0];

    const { rows: ordenadas } = await this.pool.query<{ slug: string; titulo: string }>(
      `SELECT a.slug, a.titulo
         FROM curso_aulas a
         JOIN curso_modulos m ON m.id = a.modulo_id
        WHERE a.curso_id = $1 AND a.publicado = true
        ORDER BY m.ordem, a.ordem, a.id`,
      [linha.curso_id],
    );

    const indice = ordenadas.findIndex((a) => a.slug === aulaSlug);

    return {
      aula: linha,
      curso: { id: linha.curso_id, slug: linha.curso_slug, titulo: linha.curso_titulo },
      modulo: { id: linha.modulo_id, titulo: linha.modulo_titulo, ordem: linha.modulo_ordem },
      posicao: indice + 1,
      total: ordenadas.length,
      anterior: indice > 0 ? ordenadas[indice - 1] : null,
      proxima: indice >= 0 && indice < ordenadas.length - 1 ? ordenadas[indice + 1] : null,
    };
  }

  /** A aula pelo id, para o admin editar o que ainda não publicou. */
  async getAulaById(id: string): Promise<CursoAula> {
    const { rows } = await this.pool.query<CursoAula>(
      'SELECT * FROM curso_aulas WHERE id = $1',
      [id],
    );
    if (rows.length === 0) throw new NotFoundError('Aula');
    return rows[0];
  }

  async criarCurso(dados: Partial<Curso>): Promise<Curso> {
    return this.create(dados, [
      'slug',
      'titulo',
      'descricao',
      'ementa',
      'image_url',
      'nivel',
      'publicado',
    ]);
  }

  async atualizarCurso(id: string, dados: Partial<Curso>): Promise<Curso> {
    const campos = Object.keys(dados).filter((c) => c !== 'id' && c !== 'updated_at');
    if (campos.length === 0) return this.getById(id);
    return this.update(id, dados, campos);
  }

  async deletarCurso(id: string): Promise<void> {
    return this.delete(id);
  }

  // — módulos —

  async criarModulo(dados: {
    curso_id: string;
    titulo: string;
    resumo?: string | null;
  }): Promise<CursoModulo> {
    const { rows } = await this.pool.query<CursoModulo>(
      `INSERT INTO curso_modulos (curso_id, titulo, resumo, ordem)
       VALUES ($1, $2, $3, COALESCE((SELECT MAX(ordem) + 1 FROM curso_modulos WHERE curso_id = $1), 0))
       RETURNING *`,
      [dados.curso_id, dados.titulo, dados.resumo ?? null],
    );
    return rows[0];
  }

  async atualizarModulo(
    id: string,
    dados: { titulo?: string; resumo?: string | null },
  ): Promise<CursoModulo> {
    const { rows } = await this.pool.query<CursoModulo>(
      `UPDATE curso_modulos
          SET titulo = COALESCE($2, titulo),
              resumo = COALESCE($3, resumo),
              updated_at = NOW()
        WHERE id = $1
        RETURNING *`,
      [id, dados.titulo ?? null, dados.resumo ?? null],
    );
    if (rows.length === 0) throw new NotFoundError('Módulo');
    return rows[0];
  }

  async deletarModulo(id: string): Promise<void> {
    const { rows } = await this.pool.query(
      'DELETE FROM curso_modulos WHERE id = $1 RETURNING id',
      [id],
    );
    if (rows.length === 0) throw new NotFoundError('Módulo');
  }

  // — aulas —

  async criarAula(dados: {
    curso_id: string;
    modulo_id: string;
    slug: string;
    titulo: string;
    video_id?: string | null;
    duracao_seg?: number | null;
    conteudo?: string | null;
    publicado?: boolean;
  }): Promise<CursoAula> {
    const { rows } = await this.pool.query<CursoAula>(
      `INSERT INTO curso_aulas
         (curso_id, modulo_id, slug, titulo, video_id, duracao_seg, conteudo, publicado, ordem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
         COALESCE((SELECT MAX(ordem) + 1 FROM curso_aulas WHERE modulo_id = $2), 0))
       RETURNING *`,
      [
        dados.curso_id,
        dados.modulo_id,
        dados.slug,
        dados.titulo,
        dados.video_id ?? null,
        dados.duracao_seg ?? null,
        dados.conteudo ?? null,
        dados.publicado ?? false,
      ],
    );
    return rows[0];
  }

  /**
   * Atualiza a aula. `modulo_id` pode mudar, e a chave composta obriga o novo
   * módulo a ser do mesmo curso: mover uma aula para outro curso é rejeitado
   * pelo banco, não por uma checagem aqui que alguém pode esquecer de repetir.
   */
  async atualizarAula(id: string, dados: Partial<CursoAula>): Promise<CursoAula> {
    const permitidos = [
      'modulo_id',
      'slug',
      'titulo',
      'video_id',
      'duracao_seg',
      'conteudo',
      'publicado',
    ] as const;

    const campos = permitidos.filter((c) => dados[c] !== undefined);
    if (campos.length === 0) return this.getAulaById(id);

    const sets = campos.map((campo, i) => `${campo} = $${i + 2}`).join(', ');
    const valores = campos.map((campo) => dados[campo]);

    const { rows } = await this.pool.query<CursoAula>(
      `UPDATE curso_aulas SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...valores],
    );
    if (rows.length === 0) throw new NotFoundError('Aula');
    return rows[0];
  }

  async deletarAula(id: string): Promise<void> {
    const { rows } = await this.pool.query(
      'DELETE FROM curso_aulas WHERE id = $1 RETURNING id',
      [id],
    );
    if (rows.length === 0) throw new NotFoundError('Aula');
  }

  /**
   * Reordena numa tacada só.
   *
   * `unnest ... WITH ORDINALITY` transforma a lista de ids na nova posição de
   * cada linha, então a troca inteira é um UPDATE atômico: não existe instante
   * em que metade da lista está reordenada. O escopo (`curso_id`/`modulo_id`)
   * fica no WHERE para uma lista com id de outro curso não mexer onde não deve.
   */
  async reordenarModulos(cursoId: string, ids: string[]): Promise<void> {
    await this.pool.query(
      `UPDATE curso_modulos m
          SET ordem = v.posicao - 1, updated_at = NOW()
         FROM unnest($1::uuid[]) WITH ORDINALITY AS v(id, posicao)
        WHERE m.id = v.id AND m.curso_id = $2`,
      [ids, cursoId],
    );
  }

  async reordenarAulas(moduloId: string, ids: string[]): Promise<void> {
    await this.pool.query(
      `UPDATE curso_aulas a
          SET ordem = v.posicao - 1, updated_at = NOW()
         FROM unnest($1::uuid[]) WITH ORDINALITY AS v(id, posicao)
        WHERE a.id = v.id AND a.modulo_id = $2`,
      [ids, moduloId],
    );
  }
}

export const cursoService = new CursoService();
