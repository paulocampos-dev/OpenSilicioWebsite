import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { BaseService, PaginationOptions, WhereCondition } from './BaseService';

export interface WikiEntry {
  id: string;
  term: string;
  slug: string;
  definition: string;
  content?: string;
  content_type: 'wysiwyg' | 'markdown';
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export class WikiService extends BaseService<WikiEntry> {
  constructor() {
    super(pool, 'wiki_entries', 'Entrada da wiki');
  }

  /**
   * Get all wiki entries with optional published filter
   */
  async getAllEntries(published?: boolean, pagination?: PaginationOptions) {
    const whereConditions: WhereCondition[] = [];

    if (published !== undefined) {
      whereConditions.push({ field: 'published', value: published });
    }

    return this.getAll(whereConditions, pagination, 'term ASC');
  }

  /**
   * Get a wiki entry by slug
   */
  async getBySlug(slug: string): Promise<WikiEntry> {
    const entry = await this.getByField('slug', slug);

    if (!entry) {
      throw new Error('Entrada não encontrada');
    }

    return entry;
  }

  /**
   * Create a new wiki entry
   */
  async createEntry(data: Omit<WikiEntry, 'id' | 'created_at' | 'updated_at'>): Promise<WikiEntry> {
    const entryData = {
      id: uuidv4(),
      ...data,
      content: data.content || '',
      content_type: data.content_type || 'wysiwyg',
      published: data.published || false,
    };

    const fields = [
      'id',
      'term',
      'slug',
      'definition',
      'content',
      'content_type',
      'published',
    ];

    return this.create(entryData, fields);
  }

  /**
   * Update a wiki entry
   */
  async updateEntry(id: string, data: Partial<WikiEntry>): Promise<WikiEntry> {
    const fields = Object.keys(data).filter((key) => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    return this.update(id, data, fields);
  }

  /**
   * Delete a wiki entry
   */
  async deleteEntry(id: string): Promise<void> {
    return this.delete(id);
  }
}

// Export singleton instance
export const wikiService = new WikiService();
