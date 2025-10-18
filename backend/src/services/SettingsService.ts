import { Pool } from 'pg';
import pool from '../config/database';
import { BadRequestError, NotFoundError, DatabaseError } from '../errors/AppError';

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}

export interface EducationResource {
  id: string;
  title: string;
  description: string;
  content: string;
  content_type: 'wysiwyg' | 'markdown';
  category: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  content_type: 'wysiwyg' | 'markdown';
  author: string;
  image_url?: string;
  category: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  contact_email: string;
  instagram_url: string;
  linkedin_url: string;
  address: string;
  featured_education_ids: string[];
  featured_blog_ids: string[];
  featured_education_resources?: EducationResource[];
  featured_blog_posts?: BlogPost[];
}

class SettingsService {
  constructor(private pool: Pool) {}

  /**
   * Get a single setting by key
   */
  async getByKey(key: string): Promise<SiteSetting | null> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM site_settings WHERE key = $1',
        [key]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error fetching setting by key:`, error);
      throw new DatabaseError('Erro ao buscar configuração');
    }
  }

  /**
   * Get all settings as an object
   */
  async getAllSettings(): Promise<SiteSettings> {
    try {
      const result = await this.pool.query('SELECT key, value FROM site_settings');

      const settings: any = {};
      result.rows.forEach((row) => {
        // Parse JSON fields
        if (row.key === 'featured_education_ids' || row.key === 'featured_blog_ids') {
          try {
            settings[row.key] = row.value ? JSON.parse(row.value) : [];
          } catch {
            settings[row.key] = [];
          }
        } else {
          settings[row.key] = row.value;
        }
      });

      // Ensure arrays exist (defaults for backward compatibility)
      settings.featured_education_ids = settings.featured_education_ids || [];
      settings.featured_blog_ids = settings.featured_blog_ids || [];

      // Safely fetch full education resources
      try {
        if (settings.featured_education_ids.length > 0) {
          const educationResult = await this.pool.query(
            `SELECT * FROM education_resources WHERE id = ANY($1::uuid[]) AND published = true ORDER BY created_at DESC`,
            [settings.featured_education_ids]
          );
          settings.featured_education_resources = educationResult.rows;
        } else {
          settings.featured_education_resources = [];
        }
      } catch (error) {
        console.warn('Error fetching featured education resources:', error);
        settings.featured_education_resources = [];
      }

      // Safely fetch full blog posts
      try {
        if (settings.featured_blog_ids.length > 0) {
          const blogResult = await this.pool.query(
            `SELECT * FROM blog_posts WHERE id = ANY($1::uuid[]) AND published = true ORDER BY created_at DESC`,
            [settings.featured_blog_ids]
          );
          settings.featured_blog_posts = blogResult.rows;
        } else {
          settings.featured_blog_posts = [];
        }
      } catch (error) {
        console.warn('Error fetching featured blog posts:', error);
        settings.featured_blog_posts = [];
      }

      return settings as SiteSettings;
    } catch (error) {
      console.error('Error fetching all settings:', error);
      throw new DatabaseError('Erro ao buscar configurações');
    }
  }

  /**
   * Update or create a setting
   */
  async updateSetting(key: string, value: any): Promise<SiteSetting> {
    try {
      // Convert array/object to JSON string for ID arrays
      const stringValue = (key === 'featured_education_ids' || key === 'featured_blog_ids')
        ? JSON.stringify(value)
        : value;

      const result = await this.pool.query(
        `INSERT INTO site_settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT (key)
         DO UPDATE SET value = $2, updated_at = NOW()
         RETURNING *`,
        [key, stringValue]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Error updating setting:', error);
      throw new DatabaseError('Erro ao atualizar configuração');
    }
  }

  /**
   * Update multiple settings at once
   */
  async updateMultiple(settings: Partial<SiteSettings>): Promise<SiteSettings> {
    try {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        if (value !== undefined) {
          await this.updateSetting(key, value);
        }
      }

      // Return updated settings
      return await this.getAllSettings();
    } catch (error) {
      console.error('Error updating multiple settings:', error);
      throw new DatabaseError('Erro ao atualizar configurações');
    }
  }

  /**
   * Validate featured content IDs (max 3 each)
   */
  validateFeaturedIds(ids: string[], type: 'education' | 'blog'): void {
    if (!Array.isArray(ids)) {
      throw new BadRequestError(`IDs de ${type} devem ser um array`);
    }

    if (ids.length > 3) {
      throw new BadRequestError(`Máximo de 3 ${type === 'education' ? 'recursos educacionais' : 'posts de blog'} em destaque permitidos`);
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    ids.forEach((id, index) => {
      if (!uuidRegex.test(id)) {
        throw new BadRequestError(`ID inválido na posição ${index + 1}`);
      }
    });
  }
}

export const settingsService = new SettingsService(pool);
