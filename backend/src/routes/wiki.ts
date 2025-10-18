import { Router } from 'express';
import {
  getAllEntries,
  getEntryBySlug,
  createEntry,
  updateEntry,
  deleteEntry,
  getWikiLinksForContent,
  createWikiLink,
  deleteWikiLink,
} from '../controllers/wikiController';
import { authMiddleware } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimit';
import { validate, wikiEntrySchema, wikiLinkSchema } from '../middleware/validation';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Rotas públicas (with caching - 2 minutes)
router.get('/', cacheMiddleware({ ttl: 120 }), getAllEntries);
router.get('/:slug', cacheMiddleware({ ttl: 120 }), getEntryBySlug);
router.get('/links/:contentType/:contentId', cacheMiddleware({ ttl: 120 }), getWikiLinksForContent);

// Rotas protegidas (com autenticação, validação e rate limiting)
router.post('/', authMiddleware, createLimiter, validate(wikiEntrySchema), createEntry);
router.put('/:id', authMiddleware, validate(wikiEntrySchema), updateEntry);
router.delete('/:id', authMiddleware, deleteEntry);
router.post('/links', authMiddleware, validate(wikiLinkSchema), createWikiLink);
router.delete('/links/:id', authMiddleware, deleteWikiLink);

export default router;

