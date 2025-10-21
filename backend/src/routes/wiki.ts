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
  addAlias,
  removeAlias,
  searchByTerm,
  getAllPendingLinks,
  getPendingLinksByTerm,
  getPendingLinksCount,
  createPendingLink,
  deletePendingLink,
} from '../controllers/wikiController';
import { authMiddleware } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimit';
import { validate, wikiEntrySchema, wikiLinkSchema } from '../middleware/validation';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Debug middleware to log all wiki route requests
router.use((req, res, next) => {
  console.log('🔍 [WIKI ROUTE] Request:', req.method, req.path, req.query);
  next();
});

// Rotas públicas (with caching - 2 minutes)
router.get('/', cacheMiddleware({ ttl: 120 }), getAllEntries);
router.get('/search/:term', cacheMiddleware({ ttl: 120 }), searchByTerm);
router.get('/links/:contentType/:contentId', cacheMiddleware({ ttl: 120 }), getWikiLinksForContent);

// Pending links routes (admin only)
router.get('/pending/all', authMiddleware, getAllPendingLinks);
router.get('/pending/count', authMiddleware, getPendingLinksCount);
router.get('/pending/term/:term', authMiddleware, getPendingLinksByTerm);
router.post('/pending', authMiddleware, createPendingLink);
router.delete('/pending/:id', authMiddleware, deletePendingLink);

// Get entry by slug (must be after /pending/* routes to avoid conflict)
router.get('/:slug', cacheMiddleware({ ttl: 120 }), getEntryBySlug);

// Rotas protegidas (com autenticação, validação e rate limiting)
router.post('/', authMiddleware, createLimiter, validate(wikiEntrySchema), createEntry);
router.put('/:id', authMiddleware, validate(wikiEntrySchema), updateEntry);
router.delete('/:id', authMiddleware, deleteEntry);

// Alias management routes
router.post('/:id/aliases', authMiddleware, addAlias);
router.delete('/:id/aliases/:alias', authMiddleware, removeAlias);

// Wiki link routes
router.post('/links', authMiddleware, validate(wikiLinkSchema), createWikiLink);
router.delete('/links/:id', authMiddleware, deleteWikiLink);

export default router;

