import { Router } from 'express';
import {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/blogController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Rotas públicas
router.get('/', getAllPosts);
router.get('/:slug', getPostBySlug);

// Rotas protegidas
router.post('/', authMiddleware, createPost);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);

export default router;

