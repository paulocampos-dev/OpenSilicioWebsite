import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { BaseService, PaginationOptions, WhereCondition } from './BaseService';

export interface EducationResource {
  id: string;
  title: string;
  description: string;
  cover_letter?: string;
  image_url?: string;
  content: string;
  category?: string;
  difficulty?: string;
  overview?: string;
  resources?: string;
  toc_items?: string[];
  series?: string | null;
  series_order?: number;
  published: boolean;
  created_at: Date | string;
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
      published: data.published || false,
    };

    const fields = [
      'id',
      'title',
      'description',
      'cover_letter',
      'image_url',
      'content',
      'category',
      'difficulty',
      'overview',
      'resources',
      'toc_items',
      'series',
      'series_order',
      'published',
    ];

    return this.create(resourceData, fields);
  }

  /**
   * Previous and next published resource within the same series.
   *
   * Kept as its own query, and selecting only what the links need, because the
   * alternative is shipping the full content of neighbouring resources just to
   * render two titles.
   */
  async getSeriesNavigation(id: string): Promise<{
    series: string | null;
    position: number | null;
    total: number;
    previous: { id: string; title: string } | null;
    next: { id: string; title: string } | null;
  }> {
    const current = await this.pool.query(
      'SELECT series, series_order FROM education_resources WHERE id = $1',
      [id],
    );

    const row = current.rows[0];
    if (!row || !row.series || row.series_order === null) {
      return { series: null, position: null, total: 0, previous: null, next: null };
    }

    const siblings = await this.pool.query(
      `SELECT id, title, series_order
         FROM education_resources
        WHERE series = $1 AND published = true AND series_order IS NOT NULL
        ORDER BY series_order ASC`,
      [row.series],
    );

    const ordered = siblings.rows as Array<{ id: string; title: string; series_order: number }>;
    const index = ordered.findIndex((r) => r.id === id);
    const neighbour = (i: number) =>
      i >= 0 && i < ordered.length ? { id: ordered[i]!.id, title: ordered[i]!.title } : null;

    return {
      series: row.series,
      // An unpublished resource is absent from the ordered list; report a null
      // position rather than pretending it is the first.
      position: index >= 0 ? index + 1 : null,
      total: ordered.length,
      previous: index > 0 ? neighbour(index - 1) : null,
      next: index >= 0 ? neighbour(index + 1) : null,
    };
  }

  /**
   * Update an education resource
   */
  async updateResource(id: string, data: Partial<EducationResource>): Promise<EducationResource> {
    // created_at fica de fora da lista negra de propósito: a data de publicação
    // é editável, para datar conteúdo escrito antes de entrar no site. O
    // updated_at continua sendo do banco, que o escreve com NOW() a cada
    // update, e o id nunca muda.
    const fields = Object.keys(data).filter((key) => key !== 'id' && key !== 'updated_at');
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
