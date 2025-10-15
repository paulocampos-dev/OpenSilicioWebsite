import { Router } from 'express';
import {
  getAllPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from '../controllers/blogController';
import { authMiddleware } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimit';
import { validate, blogPostSchema } from '../middleware/validation';

const router = Router();

// Rotas públicas
router.get('/', getAllPosts);
router.get('/:slug', getPostBySlug);

// Rotas protegidas (com autenticação, validação e rate limiting)
router.post('/', authMiddleware, createLimiter, validate(blogPostSchema), createPost);
router.put('/:id', authMiddleware, validate(blogPostSchema), updatePost);
router.delete('/:id', authMiddleware, deletePost);

export default router;

