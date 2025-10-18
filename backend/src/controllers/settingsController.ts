import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { settingsService } from '../services/SettingsService';
import { asyncHandler } from '../middleware/errorHandler';
import { BadRequestError } from '../errors/AppError';
import { clearCache } from '../middleware/cache';

export const getAllSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await settingsService.getAllSettings();
  res.json(settings);
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const {
    contact_email,
    instagram_url,
    linkedin_url,
    address,
    featured_education_ids,
    featured_blog_ids
  } = req.body;

  // Validate featured education IDs if provided
  if (featured_education_ids !== undefined) {
    settingsService.validateFeaturedIds(featured_education_ids, 'education');
  }

  // Validate featured blog IDs if provided
  if (featured_blog_ids !== undefined) {
    settingsService.validateFeaturedIds(featured_blog_ids, 'blog');
  }

  const updates: any = {};
  if (contact_email !== undefined) updates.contact_email = contact_email;
  if (instagram_url !== undefined) updates.instagram_url = instagram_url;
  if (linkedin_url !== undefined) updates.linkedin_url = linkedin_url;
  if (address !== undefined) updates.address = address;
  if (featured_education_ids !== undefined) updates.featured_education_ids = featured_education_ids;
  if (featured_blog_ids !== undefined) updates.featured_blog_ids = featured_blog_ids;

  const settings = await settingsService.updateMultiple(updates);

  // Clear settings cache after update
  clearCache('GET:/api/settings');

  res.json(settings);
});
