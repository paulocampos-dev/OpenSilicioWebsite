import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { blogService } from '../services/BlogService';
import { asyncHandler } from '../middleware/errorHandler';
import { clearCache } from '../middleware/cache';
import { filterUndefined } from '../utils/filterUndefined';
import { parsePagination } from '../utils/parsePagination';
import { parsePublishedFilter } from '../utils/parsePublishedFilter';
import { sincronizarLinksDeWiki } from '../services/wikiLinkSync';

/** Ver services/wikiLinkSync.ts. Falhar aqui não pode derrubar o salvamento. */
const sincronizarSilencioso = (contentId: string, content: string | null | undefined) =>
  sincronizarLinksDeWiki('blog', contentId, [content]).catch((erro) => {
    console.error(`Falha ao sincronizar links de wiki do post ${contentId}:`, erro);
  });

export const getAllPosts = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('📝 [BlogController.getAllPosts] CALLED - This is the BLOG controller');
  const { page: pageNum, limit: limitNum } = parsePagination(req.query, 10);
  const publishedFilter = parsePublishedFilter(req.query);

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
  // req.body is already validated by validate(blogPostSchema) in the route
  const { slug, title, excerpt, cover_letter, content, author, image_url, category, published } = req.body;

  const post = await blogService.createPost({
    slug,
    title,
    excerpt,
    cover_letter,
    content,
    author,
    image_url,
    category,
    published,
  });

  await sincronizarSilencioso(post.id, post.content);

  // Clear blog cache after creating a post
  clearCache('GET:/api/blog');

  res.status(201).json(post);
});

export const updatePost = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { slug, title, excerpt, cover_letter, content, author, image_url, category, published } = req.body;

  // Filter out undefined values to support partial updates
  const updateData = filterUndefined({
    slug,
    title,
    excerpt,
    cover_letter,
    content,
    author,
    image_url,
    category,
    published,
  });

  const post = await blogService.updatePost(id, updateData);

  await sincronizarSilencioso(post.id, post.content);

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

