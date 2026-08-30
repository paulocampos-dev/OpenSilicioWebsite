import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { educationService } from '../services/EducationService';
import { asyncHandler } from '../middleware/errorHandler';
import { clearCache } from '../middleware/cache';
import { filterUndefined } from '../utils/filterUndefined';
import { parsePagination } from '../utils/parsePagination';
import { parsePublishedFilter } from '../utils/parsePublishedFilter';

export const getAllResources = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page: pageNum, limit: limitNum } = parsePagination(req.query, 10);
  const publishedFilter = parsePublishedFilter(req.query);

  const result = await educationService.getAllResources(publishedFilter, { page: pageNum, limit: limitNum });

  res.json(result);
});

export const getResourceById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const resource = await educationService.getResourceById(id);
  res.json(resource);
});

export const createResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  // req.body is already validated by validate(educationResourceSchema) in the route
  const { title, description, cover_letter, image_url, content, category, difficulty, overview, resources, published } = req.body;

  const resource = await educationService.createResource({
    title,
    description,
    cover_letter,
    image_url,
    content,
    category,
    difficulty,
    overview,
    resources,
    published,
  });

  // Clear education cache after creating a resource
  clearCache('GET:/api/education');

  res.status(201).json(resource);
});

export const updateResource = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, cover_letter, image_url, content, category, difficulty, overview, resources, published } = req.body;

  // Filter out undefined values to support partial updates
  const updateData = filterUndefined({
    title,
    description,
    cover_letter,
    image_url,
    content,
    category,
    difficulty,
    overview,
    resources,
    published,
  });

  const resource = await educationService.updateResource(id, updateData);

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
