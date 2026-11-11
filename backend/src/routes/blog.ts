import { Router } from 'express';
import {
  getAllPosts,
  getPostById,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getCategories,
} from '../controllers/blogController';
import { authMiddleware, authOpcional } from '../middleware/auth';
import { createLimiter } from '../middleware/rateLimit';
import { validate, blogPostSchema, blogPostUpdateSchema } from '../middleware/validation';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Debug middleware to log all blog route requests
router.use((req, res, next) => {
  console.log('🔍 [BLOG ROUTE] Request:', req.method, req.path, req.query);
  next();
});

// Rotas públicas (with caching - 2 minutes)
router.get('/', authOpcional, cacheMiddleware({ ttl: 120 }), getAllPosts);
router.get('/categories/list', cacheMiddleware({ ttl: 300 }), getCategories); // 5 min cache
router.get('/id/:id', authOpcional, cacheMiddleware({ ttl: 120 }), getPostById); // Get by ID (must be before /:slug)
router.get('/:slug', authOpcional, cacheMiddleware({ ttl: 120 }), getPostBySlug);

// Rotas protegidas (com autenticação, validação e rate limiting)
router.post('/', authMiddleware, createLimiter, validate(blogPostSchema), createPost);
router.put('/:id', authMiddleware, validate(blogPostUpdateSchema), updatePost);
router.delete('/:id', authMiddleware, deletePost);

export default router;

