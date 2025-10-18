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
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Debug middleware to log all blog route requests
router.use((req, res, next) => {
  console.log('🔍 [BLOG ROUTE] Request:', req.method, req.path, req.query);
  next();
});

// Rotas públicas (with caching - 2 minutes)
router.get('/', cacheMiddleware({ ttl: 120 }), getAllPosts);
router.get('/:slug', cacheMiddleware({ ttl: 120 }), getPostBySlug);

// Rotas protegidas (com autenticação, validação e rate limiting)
router.post('/', authMiddleware, createLimiter, validate(blogPostSchema), createPost);
router.put('/:id', authMiddleware, validate(blogPostSchema), updatePost);
router.delete('/:id', authMiddleware, deletePost);

export default router;

