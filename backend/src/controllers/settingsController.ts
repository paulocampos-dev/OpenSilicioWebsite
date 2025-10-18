import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { settingsService } from '../services/SettingsService';
import { asyncHandler } from '../middleware/errorHandler';
import { BadRequestError } from '../errors/AppError';

export const getAllSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await settingsService.getAllSettings();
  res.json(settings);
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { contact_email, instagram_url, linkedin_url, address, featured_projects } = req.body;

  // Validate featured projects if provided
  if (featured_projects) {
    if (!Array.isArray(featured_projects)) {
      throw new BadRequestError('featured_projects deve ser um array');
    }
    settingsService.validateFeaturedProjects(featured_projects);
  }

  const updates: any = {};
  if (contact_email !== undefined) updates.contact_email = contact_email;
  if (instagram_url !== undefined) updates.instagram_url = instagram_url;
  if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url;
  if (address !== undefined) updates.address = address;
  if (featured_projects !== undefined) updates.featured_projects = featured_projects;

  const settings = await settingsService.updateMultiple(updates);
  res.json(settings);
});
