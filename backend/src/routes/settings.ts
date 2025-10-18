import { Router } from 'express';
import { getAllSettings, updateSettings } from '../controllers/settingsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Rotas públicas
router.get('/', getAllSettings);

// Rotas protegidas (requer autenticação)
router.put('/', authMiddleware, updateSettings);

export default router;
