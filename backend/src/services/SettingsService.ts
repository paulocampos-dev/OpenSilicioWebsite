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

export interface FeaturedProject {
  image: string;
  title: string;
  description: string;
  badge: string;
  gradient: string;
}

export interface SiteSettings {
  contact_email: string;
  instagram_url: string;
  linkedin_url: string;
  address: string;
  featured_projects: FeaturedProject[];
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
        if (row.key === 'featured_projects') {
          try {
            settings[row.key] = row.value ? JSON.parse(row.value) : [];
          } catch {
            settings[row.key] = [];
          }
        } else {
          settings[row.key] = row.value;
        }
      });

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
      // Convert array/object to JSON string for featured_projects
      const stringValue = key === 'featured_projects' ? JSON.stringify(value) : value;

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
   * Validate featured projects (max 3)
   */
  validateFeaturedProjects(projects: FeaturedProject[]): void {
    if (projects.length > 3) {
      throw new BadRequestError('Máximo de 3 projetos em destaque permitidos');
    }

    projects.forEach((project, index) => {
      if (!project.image || !project.title || !project.description || !project.badge || !project.gradient) {
        throw new BadRequestError(`Projeto ${index + 1}: Todos os campos são obrigatórios`);
      }
    });
  }
}

export const settingsService = new SettingsService(pool);
