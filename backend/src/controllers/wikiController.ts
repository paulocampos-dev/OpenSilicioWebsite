import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { wikiService } from '../services/WikiService';
import { pendingWikiLinksService } from '../services/PendingWikiLinksService';
import { asyncHandler } from '../middleware/errorHandler';
import { BadRequestError, NotFoundError } from '../errors/AppError';
import { clearCache } from '../middleware/cache';
import { filterUndefined } from '../utils/filterUndefined';
import { parsePagination } from '../utils/parsePagination';
import { parsePublishedFilter } from '../utils/parsePublishedFilter';

export const getAllEntries = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('✅ [WikiController.getAllEntries] CALLED - This is the WIKI controller');
  const { page: pageNum, limit: limitNum } = parsePagination(req.query, 20);
  const publishedFilter = parsePublishedFilter(req.query);

  const result = await wikiService.getAllEntries(publishedFilter, { page: pageNum, limit: limitNum });
  console.log('✅ [WikiController.getAllEntries] Returning', result.data.length, 'wiki entries');
  console.log('✅ [WikiController.getAllEntries] Sample fields:', result.data[0] ? Object.keys(result.data[0]).slice(0, 5) : 'no data');

  res.json(result);
});

export const getEntryById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const entry = await wikiService.getEntryById(id);
  res.json(entry);
});

export const getEntryBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;
  const entry = await wikiService.getBySlug(slug);
  res.json(entry);
});

export const createEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  // req.body is already validated by validate(wikiEntrySchema) in the route
  const { term, slug, definition, cover_letter, content, aliases, published } = req.body;

  const entry = await wikiService.createEntry({
    term,
    slug,
    definition,
    cover_letter,
    content,
    aliases,
    published,
  });

  // Delete any pending links for this term or its aliases
  await pendingWikiLinksService.deletePendingByTerm(term);
  if (aliases && Array.isArray(aliases)) {
    for (const alias of aliases) {
      await pendingWikiLinksService.deletePendingByTerm(alias);
    }
  }

  // Clear wiki cache after creating an entry
  clearCache('GET:/api/wiki');

  res.status(201).json(entry);
});

export const updateEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { term, slug, definition, cover_letter, content, aliases, published } = req.body;

  // Filter out undefined values to support partial updates
  const updateData = filterUndefined({
    term,
    slug,
    definition,
    cover_letter,
    content,
    aliases,
    published,
  });

  const entry = await wikiService.updateEntry(id, updateData);

  // Clear wiki cache after updating an entry
  clearCache('GET:/api/wiki');

  res.json(entry);
});

export const deleteEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await wikiService.deleteEntry(id);

  // Clear wiki cache after deleting an entry
  clearCache('GET:/api/wiki');

  res.json({ message: 'Entrada deletada com sucesso' });
});

// Wiki links management (keeping original implementation for now)
export const getWikiLinksForContent = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contentType, contentId } = req.params;

  const result = await pool.query(
    `SELECT wl.*, we.term, we.slug, we.definition
     FROM content_wiki_links wl
     JOIN wiki_entries we ON wl.wiki_entry_id = we.id
     WHERE wl.content_type = $1 AND wl.content_id = $2`,
    [contentType, contentId]
  );

  res.json(result.rows);
});

export const createWikiLink = asyncHandler(async (req: AuthRequest, res: Response) => {
  // req.body is already validated by validate(wikiLinkSchema) in the route
  const { contentType, contentId, wikiEntryId, linkText } = req.body;

  const id = uuidv4();

  const result = await pool.query(
    `INSERT INTO content_wiki_links
     (id, content_type, content_id, wiki_entry_id, link_text, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [id, contentType, contentId, wikiEntryId, linkText]
  );

  // Clear wiki links cache after creating a link
  clearCache('GET:/api/wiki/links');

  res.status(201).json(result.rows[0]);
});

export const deleteWikiLink = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const result = await pool.query(
    'DELETE FROM content_wiki_links WHERE id = $1 RETURNING id',
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('Link');
  }

  // Clear wiki links cache after deleting a link
  clearCache('GET:/api/wiki/links');

  res.json({ message: 'Link deletado com sucesso' });
});

// Alias management
export const addAlias = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { alias } = req.body;

  if (!alias || !alias.trim()) {
    throw new BadRequestError('Alias não pode ser vazio');
  }

  const entry = await wikiService.addAlias(id, alias.trim());

  // Clear wiki cache after adding alias
  clearCache('GET:/api/wiki');

  res.json(entry);
});

export const removeAlias = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id, alias } = req.params;

  const entry = await wikiService.removeAlias(id, alias);

  // Clear wiki cache after removing alias
  clearCache('GET:/api/wiki');

  res.json(entry);
});

export const searchByTerm = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { term } = req.params;

  const entry = await wikiService.getByTermOrAlias(term);

  if (!entry) {
    throw new NotFoundError('Entrada da wiki');
  }

  res.json(entry);
});

// Public: term + count only (no linking content ids/titles), used by the
// empty-wiki "blank sheet" state to show the most-requested missing terms.
export const getPendingLinksGroupedPublic = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const result = await pendingWikiLinksService.getPendingGroupedByTerm();
  res.json(result);
});

// Pending wiki links management
export const getAllPendingLinks = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { grouped } = req.query;

  if (grouped === 'true') {
    const result = await pendingWikiLinksService.getPendingGroupedByTerm();
    res.json(result);
  } else {
    const { page: pageNum, limit: limitNum } = parsePagination(req.query, 50);

    const result = await pendingWikiLinksService.getAllPendingWithContent({
      page: pageNum,
      limit: limitNum,
    });
    res.json(result);
  }
});

export const getPendingLinksByTerm = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { term } = req.params;

  const links = await pendingWikiLinksService.getPendingByTerm(term);
  res.json(links);
});

export const getPendingLinksCount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const count = await pendingWikiLinksService.getPendingCount();
  const uniqueCount = await pendingWikiLinksService.getUniqueTermsCount();

  res.json({ total: count, uniqueTerms: uniqueCount });
});

export const createPendingLink = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { term, contentType, contentId, context } = req.body;

  if (!term || !contentType || !contentId) {
    throw new BadRequestError('Campos obrigatórios faltando');
  }

  // Check if a wiki entry already exists for this term
  const existingEntry = await wikiService.getByTermOrAlias(term);
  if (existingEntry) {
    throw new BadRequestError('Uma entrada da wiki já existe para este termo');
  }

  const link = await pendingWikiLinksService.createPendingLink({
    term,
    content_type: contentType,
    content_id: contentId,
    context,
  });

  res.status(201).json(link);
});

export const deletePendingLink = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  await pendingWikiLinksService.deletePendingLink(id);

  res.json({ message: 'Link pendente deletado com sucesso' });
});
