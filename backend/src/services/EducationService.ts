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
  series?: string;
  series_order?: number;
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
    const atual = await this.pool.query(
      'SELECT series, series_order FROM education_resources WHERE id = $1',
      [id],
    );

    const linha = atual.rows[0];
    if (!linha || !linha.series || linha.series_order === null) {
      return { series: null, position: null, total: 0, previous: null, next: null };
    }

    const irmaos = await this.pool.query(
      `SELECT id, title, series_order
         FROM education_resources
        WHERE series = $1 AND published = true AND series_order IS NOT NULL
        ORDER BY series_order ASC`,
      [linha.series],
    );

    const lista = irmaos.rows as Array<{ id: string; title: string; series_order: number }>;
    const indice = lista.findIndex((r) => r.id === id);
    const vizinho = (i: number) =>
      i >= 0 && i < lista.length ? { id: lista[i]!.id, title: lista[i]!.title } : null;

    return {
      series: linha.series,
      // Um recurso ainda despublicado não aparece na lista: devolvemos posição
      // nula em vez de fingir que ele é o primeiro.
      position: indice >= 0 ? indice + 1 : null,
      total: lista.length,
      previous: indice > 0 ? vizinho(indice - 1) : null,
      next: indice >= 0 ? vizinho(indice + 1) : null,
    };
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
