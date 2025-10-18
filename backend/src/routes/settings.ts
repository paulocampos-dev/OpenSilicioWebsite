import { Router } from 'express';
import { getAllSettings, updateSettings } from '../controllers/settingsController';
import { authMiddleware } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Rotas públicas (with caching - 2 minutes)
router.get('/', cacheMiddleware({ ttl: 120 }), getAllSettings);

// Rotas protegidas (requer autenticação)
router.put('/', authMiddleware, updateSettings);

export default router;
