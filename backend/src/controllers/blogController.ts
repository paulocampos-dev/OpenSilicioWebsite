import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { blogService } from '../services/BlogService';
import { asyncHandler } from '../middleware/errorHandler';
import { BadRequestError } from '../errors/AppError';
import { clearCache } from '../middleware/cache';

export const getAllPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('📝 [BlogController.getAllPosts] CALLED - This is the BLOG controller');
  const { published, page = '1', limit = '10' } = req.query;

  // Parse and validate pagination parameters
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));

  const publishedFilter = published === 'true' ? true : published === 'false' ? false : undefined;

  const result = await blogService.getAllPosts(publishedFilter, { page: pageNum, limit: limitNum });
  console.log('📝 [BlogController.getAllPosts] Returning', result.data.length, 'blog posts');

  res.json(result);
});

export const getPostById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const post = await blogService.getById(id);
  res.json(post);
});

export const getPostBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug } = req.params;
  const post = await blogService.getBySlug(slug);
  res.json(post);
});

export const createPost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { slug, title, excerpt, content, author, image_url, category, published } = req.body;

  if (!slug || !title || !excerpt || !content) {
    throw new BadRequestError('Campos obrigatórios faltando');
  }

  const post = await blogService.createPost({
    slug,
    title,
    excerpt,
    content,
    author,
    image_url,
    category,
    published,
  });

  // Clear blog cache after creating a post
  clearCache('GET:/api/blog');

  res.status(201).json(post);
});

export const updatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { slug, title, excerpt, content, author, image_url, category, published } = req.body;

  const post = await blogService.updatePost(id, {
    slug,
    title,
    excerpt,
    content,
    author,
    image_url,
    category,
    published,
  });

  // Clear blog cache after updating a post
  clearCache('GET:/api/blog');

  res.json(post);
});

export const deletePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await blogService.deletePost(id);

  // Clear blog cache after deleting a post
  clearCache('GET:/api/blog');

  res.json({ message: 'Post deletado com sucesso' });
});

export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const categories = await blogService.getCategories();
  res.json(categories);
});

