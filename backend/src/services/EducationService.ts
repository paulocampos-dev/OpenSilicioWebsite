import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { BaseService, PaginationOptions, WhereCondition } from './BaseService';

export interface EducationResource {
  id: string;
  title: string;
  description: string;
  content: string;
  content_type: 'wysiwyg' | 'markdown';
  category?: string;
  overview?: string;
  resources?: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export class EducationService extends BaseService<EducationResource> {
  constructor() {
    super(pool, 'education_resources', 'Recurso educacional');
  }

  /**
   * Get all education resources with optional published filter
   */
  async getAllResources(published?: boolean, pagination?: PaginationOptions) {
    const whereConditions: WhereCondition[] = [];

    if (published !== undefined) {
      whereConditions.push({ field: 'published', value: published });
    }

    return this.getAll(whereConditions, pagination);
  }

  /**
   * Get an education resource by ID
   */
  async getResourceById(id: string): Promise<EducationResource> {
    return this.getById(id);
  }

  /**
   * Create a new education resource
   */
  async createResource(data: Omit<EducationResource, 'id' | 'created_at' | 'updated_at'>): Promise<EducationResource> {
    const resourceData = {
      id: uuidv4(),
      ...data,
      content_type: data.content_type || 'wysiwyg',
      published: data.published || false,
    };

    const fields = [
      'id',
      'title',
      'description',
      'content',
      'content_type',
      'category',
      'overview',
      'resources',
      'published',
    ];

    return this.create(resourceData, fields);
  }

  /**
   * Update an education resource
   */
  async updateResource(id: string, data: Partial<EducationResource>): Promise<EducationResource> {
    const fields = Object.keys(data).filter((key) => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    return this.update(id, data, fields);
  }

  /**
   * Delete an education resource
   */
  async deleteResource(id: string): Promise<void> {
    return this.delete(id);
  }
}

// Export singleton instance
export const educationService = new EducationService();
