import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { educationService } from '../services/EducationService';
import { asyncHandler } from '../middleware/errorHandler';
import { clearCache } from '../middleware/cache';
import { filterUndefined } from '../utils/filterUndefined';
import { parsePagination } from '../utils/parsePagination';
import { parsePublishedFilter } from '../utils/parsePublishedFilter';
import { sincronizarLinksDeWiki } from '../services/wikiLinkSync';

/**
 * O formulário manda string vazia quando o campo Série fica em branco. Sem
 * normalizar, todo recurso cairia numa mesma série sem nome, porque a consulta
 * de anterior/próximo filtra por `series IS NOT NULL`. Fica aqui, e não no
 * schema, porque o middleware validate() descarta o resultado do parse.
 * `undefined` passa intacto, para não apagar o campo numa atualização parcial.
 */
const normalizarSeries = (series: unknown): string | null | undefined =>
  series === '' ? null : (series as string | null | undefined);

/**
 * A tabela de ligações é derivada do texto, não gravada na hora de inserir o
 * link. Ver services/wikiLinkSync.ts. Falhar aqui não pode derrubar o salvamento:
 * o conteúdo do autor é o que importa, os chips se recuperam no próximo save.
 */
const sincronizarSilencioso = (
  contentType: 'blog' | 'education',
  contentId: string,
  campos: Array<string | null | undefined>,
) =>
  sincronizarLinksDeWiki(contentType, contentId, campos).catch((erro) => {
    console.error(`Falha ao sincronizar links de wiki de ${contentType} ${contentId}:`, erro);
  });

export const getAllResources = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page: pageNum, limit: limitNum } = parsePagination(req.query, 10);
  const publishedFilter = parsePublishedFilter(req.query);

  const result = await educationService.getAllResources(publishedFilter, { page: pageNum, limit: limitNum });

  res.json(result);
});

export const getResourceById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const resource = await educationService.getResourceById(id);
  res.json(resource);
});

export const getSeriesNavigation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const navigation = await educationService.getSeriesNavigation(id);
  res.json(navigation);
});

export const createResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  // req.body is already validated by validate(educationResourceSchema) in the route
  const { title, description, cover_letter, image_url, content, category, difficulty, overview, resources, toc_items, series, series_order, published } = req.body;

  const resource = await educationService.createResource({
    title,
    description,
    cover_letter,
    image_url,
    content,
    category,
    difficulty,
    overview,
    resources,
    toc_items,
    series: normalizarSeries(series),
    series_order,
    published,
  });

  await sincronizarSilencioso('education', resource.id, [resource.content, resource.overview, resource.resources]);

  // Clear education cache after creating a resource
  clearCache('GET:/api/education');

  res.status(201).json(resource);
});

export const updateResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, cover_letter, image_url, content, category, difficulty, overview, resources, toc_items, series, series_order, published, created_at } = req.body;

  // Filter out undefined values to support partial updates
  const updateData = filterUndefined({
    title,
    description,
    cover_letter,
    image_url,
    content,
    category,
    difficulty,
    overview,
    resources,
    toc_items,
    series: normalizarSeries(series),
    series_order,
    published,
    created_at,
  });

  const resource = await educationService.updateResource(id, updateData);

  await sincronizarSilencioso('education', resource.id, [resource.content, resource.overview, resource.resources]);

  // Clear education cache after updating a resource
  clearCache('GET:/api/education');

  res.json(resource);
});

export const deleteResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await educationService.deleteResource(id);

  // Clear education cache after deleting a resource
  clearCache('GET:/api/education');

  res.json({ message: 'Recurso deletado com sucesso' });
});
