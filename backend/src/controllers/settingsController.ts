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
    featured_blog_ids,
    about_title,
    about_content,
    about_content_type,
    about_mission,
    about_mission_type,
    about_vision,
    about_vision_type,
    about_history,
    about_history_type,
    about_team_members
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
  if (about_title !== undefined) updates.about_title = about_title;
  if (about_content !== undefined) updates.about_content = about_content;
  if (about_content_type !== undefined) updates.about_content_type = about_content_type;
  if (about_mission !== undefined) updates.about_mission = about_mission;
  if (about_mission_type !== undefined) updates.about_mission_type = about_mission_type;
  if (about_vision !== undefined) updates.about_vision = about_vision;
  if (about_vision_type !== undefined) updates.about_vision_type = about_vision_type;
  if (about_history !== undefined) updates.about_history = about_history;
  if (about_history_type !== undefined) updates.about_history_type = about_history_type;
  if (about_team_members !== undefined) updates.about_team_members = about_team_members;

  const settings = await settingsService.updateMultiple(updates);

  // Clear settings cache after update
  clearCache('GET:/api/settings');

  res.json(settings);
});
