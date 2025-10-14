import { Router } from 'express';
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from '../controllers/educationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Rotas públicas
router.get('/', getAllResources);
router.get('/:id', getResourceById);

// Rotas protegidas
router.post('/', authMiddleware, createResource);
router.put('/:id', authMiddleware, updateResource);
router.delete('/:id', authMiddleware, deleteResource);

export default router;

