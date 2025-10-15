import { Router } from 'express';
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from '../controllers/educationController';
import { authMiddleware } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimit';
import { validate, educationResourceSchema } from '../middleware/validation';

const router = Router();

// Rotas públicas
router.get('/', getAllResources);
router.get('/:id', getResourceById);

// Rotas protegidas (com autenticação, validação e rate limiting)
router.post('/', authMiddleware, createLimiter, validate(educationResourceSchema), createResource);
router.put('/:id', authMiddleware, validate(educationResourceSchema), updateResource);
router.delete('/:id', authMiddleware, deleteResource);

export default router;

