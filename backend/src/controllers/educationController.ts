import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { educationService } from '../services/EducationService';
import { asyncHandler } from '../middleware/errorHandler';
import { BadRequestError } from '../errors/AppError';
import { clearCache } from '../middleware/cache';

export const getAllResources = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { published, page = '1', limit = '10' } = req.query;

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));

  const publishedFilter = published === 'true' ? true : published === 'false' ? false : undefined;

  const result = await educationService.getAllResources(publishedFilter, { page: pageNum, limit: limitNum });

  res.json(result);
});

export const getResourceById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const resource = await educationService.getResourceById(id);
  res.json(resource);
});

export const createResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { title, description, content, content_type, category, published } = req.body;

  if (!title || !description || !content) {
    throw new BadRequestError('Campos obrigatórios faltando');
  }

  const resource = await educationService.createResource({
    title,
    description,
    content,
    content_type,
    category,
    published,
  });

  // Clear education cache after creating a resource
  clearCache('GET:/api/education');

  res.status(201).json(resource);
});

export const updateResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, content, content_type, category, published } = req.body;

  const resource = await educationService.updateResource(id, {
    title,
    description,
    content,
    content_type,
    category,
    published,
  });

  // Clear education cache after updating a resource
  clearCache('GET:/api/education');

  res.json(resource);
});

export const deleteResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await educationService.deleteResource(id);

  // Clear education cache after deleting a resource
  clearCache('GET:/api/education');

  res.json({ message: 'Recurso deletado com sucesso' });
});
