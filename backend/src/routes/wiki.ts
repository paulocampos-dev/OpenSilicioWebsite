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

const router = Router();

// Rotas públicas
router.get('/', getAllEntries);
router.get('/:slug', getEntryBySlug);
router.get('/links/:contentType/:contentId', getWikiLinksForContent);

// Rotas protegidas
router.post('/', authMiddleware, createEntry);
router.put('/:id', authMiddleware, updateEntry);
router.delete('/:id', authMiddleware, deleteEntry);
router.post('/links', authMiddleware, createWikiLink);
router.delete('/links/:id', authMiddleware, deleteWikiLink);

export default router;

