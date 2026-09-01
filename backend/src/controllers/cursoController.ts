import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { cursoService, type Curso, type CursoAula } from '../services/CursoService';
import { asyncHandler } from '../middleware/errorHandler';
import { clearCache } from '../middleware/cache';
import { parsePagination } from '../utils/parsePagination';
import { parsePublishedFilter } from '../utils/parsePublishedFilter';
import { extrairIdDoYouTube } from '../utils/youtube';
import { sincronizarLinksDeWiki } from '../services/wikiLinkSync';
import { BadRequestError } from '../errors/AppError';

/**
 * As ligações da wiki são derivadas do texto da aula, igual ao blog e à
 * Educação (ver services/wikiLinkSync.ts). Falhar aqui não pode derrubar o
 * salvamento: o que o autor escreveu é o que importa, e os chips se recuperam
 * no próximo save.
 */
const sincronizarSilencioso = (aulaId: string, conteudo: string | null | undefined) =>
  sincronizarLinksDeWiki('curso_aula', aulaId, [conteudo]).catch((erro) => {
    console.error(`Falha ao sincronizar links de wiki da aula ${aulaId}:`, erro);
  });

const limparCache = () => clearCache('GET:/api/cursos');

/**
 * O formulário manda '' quando o campo de vídeo fica em branco, e a URL inteira
 * quando não. Os dois viram o que o banco guarda: o id, ou nulo. `undefined`
 * passa intacto para não apagar o vídeo numa atualização parcial.
 */
const normalizarVideo = (valor: unknown): string | null | undefined => {
  if (valor === undefined) return undefined;
  if (valor === null || valor === '') return null;
  return extrairIdDoYouTube(String(valor));
};

/**
 * Índice público: sempre só o que está publicado.
 *
 * Diferente do blog e da Educação, que deixam `?published=false` passar numa
 * rota sem autenticação e com isso entregam o título dos rascunhos a quem
 * pedir. Quem precisa ver rascunho de curso é o admin, e ele tem a rota
 * autenticada logo abaixo.
 */
export const listarCursos = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = parsePagination(req.query, 10);

  const resultado = await cursoService.listar(true, { page, limit });
  res.json(resultado);
});

/** Índice do admin: publicados e rascunhos, atrás do authMiddleware. */
export const listarCursosAdmin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page, limit } = parsePagination(req.query, 10);
  const publicado = parsePublishedFilter(req.query);

  const resultado = await cursoService.listar(publicado, { page, limit });
  res.json(resultado);
});

export const getCursoById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const curso = await cursoService.getCursoById(req.params.id);
  res.json(curso);
});

export const getCurso = asyncHandler(async (req: AuthRequest, res: Response) => {
  const arvore = await cursoService.getArvore(req.params.slug, false);
  res.json(arvore);
});

/** Mesma árvore, com os rascunhos, para a tela de estrutura do admin. */
export const getCursoCompleto = asyncHandler(async (req: AuthRequest, res: Response) => {
  const arvore = await cursoService.getArvore(req.params.slug, true);
  res.json(arvore);
});

export const getAula = asyncHandler(async (req: AuthRequest, res: Response) => {
  const aula = await cursoService.getAula(req.params.slug, req.params.aulaSlug);
  res.json(aula);
});

export const getAulaById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const aula = await cursoService.getAulaById(req.params.id);
  res.json(aula);
});

export const criarCurso = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug, titulo, descricao, ementa, image_url, nivel, publicado } =
    req.body as CorpoDeCursoNovo;

  const curso = await cursoService.criarCurso({
    slug,
    titulo,
    descricao,
    ementa,
    image_url,
    nivel,
    publicado: publicado ?? false,
  });

  limparCache();
  res.status(201).json(curso);
});

/**
 * O que os schemas de criação garantem que chegou no corpo.
 *
 * `validate(cursoSchema)` e `validate(aulaSchema)` já rodaram e rejeitaram o
 * que não tem esta forma, então declarar os obrigatórios como obrigatórios é
 * descrever o que de fato existe, e não um otimismo.
 */
type CorpoDeCursoNovo = Pick<Curso, 'slug' | 'titulo' | 'descricao'> &
  Partial<Pick<Curso, 'ementa' | 'image_url' | 'nivel' | 'publicado'>>;

type CorpoDeAulaNova = Pick<CursoAula, 'modulo_id' | 'slug' | 'titulo'> &
  Partial<Pick<CursoAula, 'video_id' | 'duracao_seg' | 'conteudo' | 'publicado'>>;

/**
 * Só os campos presentes no corpo vão para o UPDATE.
 *
 * Montado campo a campo em vez de filtrar `Object.entries(req.body)`: aquilo
 * devolve `Record<string, any>`, e o `any` atravessaria até o service sem que o
 * compilador conferisse nada.
 */
const somenteDefinidos = <T extends object>(dados: T): Partial<T> =>
  Object.fromEntries(Object.entries(dados).filter(([, valor]) => valor !== undefined)) as Partial<T>;

export const atualizarCurso = asyncHandler(async (req: AuthRequest, res: Response) => {
  // req.body é `any`; validate(cursoUpdateSchema) já rejeitou o que não tem
  // esta forma, então a fronteira é aqui e daqui para baixo o tipo vale.
  const { slug, titulo, descricao, ementa, image_url, nivel, publicado } =
    req.body as Partial<Curso>;

  const dados = somenteDefinidos({
    slug,
    titulo,
    descricao,
    ementa,
    image_url,
    nivel,
    publicado,
  } satisfies Partial<Curso>);

  const curso = await cursoService.atualizarCurso(req.params.id, dados);
  limparCache();
  res.json(curso);
});

export const deletarCurso = asyncHandler(async (req: AuthRequest, res: Response) => {
  await cursoService.deletarCurso(req.params.id);
  limparCache();
  res.json({ message: 'Curso deletado com sucesso' });
});

export const criarModulo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const modulo = await cursoService.criarModulo({
    curso_id: req.params.cursoId,
    titulo: req.body.titulo,
    resumo: req.body.resumo,
  });

  limparCache();
  res.status(201).json(modulo);
});

export const atualizarModulo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const modulo = await cursoService.atualizarModulo(req.params.id, {
    titulo: req.body.titulo,
    resumo: req.body.resumo,
  });

  limparCache();
  res.json(modulo);
});

export const deletarModulo = asyncHandler(async (req: AuthRequest, res: Response) => {
  await cursoService.deletarModulo(req.params.id);
  limparCache();
  res.json({ message: 'Módulo deletado com sucesso' });
});

export const criarAula = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { modulo_id, slug, titulo, video_id, duracao_seg, conteudo, publicado } =
    req.body as CorpoDeAulaNova;

  const aula = await cursoService.criarAula({
    curso_id: req.params.cursoId,
    modulo_id,
    slug,
    titulo,
    video_id: normalizarVideo(video_id) ?? null,
    duracao_seg: duracao_seg ?? null,
    conteudo: conteudo ?? null,
    publicado: publicado ?? false,
  });

  await sincronizarSilencioso(aula.id, aula.conteudo);
  limparCache();
  res.status(201).json(aula);
});

export const atualizarAula = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { modulo_id, slug, titulo, video_id, duracao_seg, conteudo, publicado } =
    req.body as Partial<CursoAula>;

  const dados = somenteDefinidos({
    modulo_id,
    slug,
    titulo,
    video_id: normalizarVideo(video_id),
    duracao_seg,
    conteudo,
    publicado,
  } satisfies Partial<CursoAula>);

  const aula = await cursoService.atualizarAula(req.params.id, dados);

  await sincronizarSilencioso(aula.id, aula.conteudo);
  limparCache();
  res.json(aula);
});

export const deletarAula = asyncHandler(async (req: AuthRequest, res: Response) => {
  await cursoService.deletarAula(req.params.id);
  limparCache();
  res.json({ message: 'Aula deletada com sucesso' });
});

export const reordenarModulos = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { ids } = req.body;
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestError('A lista de ids tem repetições');
  }

  await cursoService.reordenarModulos(req.params.cursoId, ids);
  limparCache();
  res.json({ message: 'Módulos reordenados' });
});

export const reordenarAulas = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { ids } = req.body;
  if (new Set(ids).size !== ids.length) {
    throw new BadRequestError('A lista de ids tem repetições');
  }

  await cursoService.reordenarAulas(req.params.moduloId, ids);
  limparCache();
  res.json({ message: 'Aulas reordenadas' });
});
