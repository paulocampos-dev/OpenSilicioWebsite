import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { BaseService, PaginationOptions, WhereCondition } from './BaseService';
import { NotFoundError } from '../errors/AppError';

export interface WikiEntry {
  id: string;
  term: string;
  slug: string;
  definition: string;
  content?: string;
  aliases?: string[];
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
   * Get a wiki entry by ID
   */
  async getEntryById(id: string): Promise<WikiEntry> {
    return this.getById(id);
  }

  /**
   * Get a wiki entry by slug
   */
  async getBySlug(slug: string): Promise<WikiEntry> {
    const entry = await this.getByField('slug', slug);

    if (!entry) {
      throw new NotFoundError('Entrada não encontrada');
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
      aliases: data.aliases || [],
      published: data.published || false,
    };

    const fields = [
      'id',
      'term',
      'slug',
      'definition',
      'content',
      'aliases',
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

  /**
   * Search for a wiki entry by term or alias
   * Returns the entry if the search term matches either the main term or any alias
   */
  async getByTermOrAlias(searchTerm: string): Promise<WikiEntry | null> {
    const result = await pool.query<WikiEntry>(
      `SELECT * FROM wiki_entries
       WHERE LOWER(term) = LOWER($1)
       OR $1 = ANY(SELECT LOWER(unnest(aliases)))
       LIMIT 1`,
      [searchTerm]
    );

    return result.rows[0] || null;
  }

  /**
   * Add an alias to a wiki entry
   */
  async addAlias(id: string, alias: string): Promise<WikiEntry> {
    // First check if alias already exists
    const entry = await this.getById(id);
    if (!entry) {
      throw new Error('Entrada não encontrada');
    }

    const currentAliases = entry.aliases || [];

    // Check if alias already exists (case-insensitive)
    if (currentAliases.some(a => a.toLowerCase() === alias.toLowerCase())) {
      throw new Error('Este alias já existe para esta entrada');
    }

    // Add the new alias
    const updatedAliases = [...currentAliases, alias];

    const result = await pool.query<WikiEntry>(
      `UPDATE wiki_entries
       SET aliases = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [updatedAliases, id]
    );

    return result.rows[0];
  }

  /**
   * Remove an alias from a wiki entry
   */
  async removeAlias(id: string, alias: string): Promise<WikiEntry> {
    const entry = await this.getById(id);
    if (!entry) {
      throw new Error('Entrada não encontrada');
    }

    const currentAliases = entry.aliases || [];
    const updatedAliases = currentAliases.filter(
      a => a.toLowerCase() !== alias.toLowerCase()
    );

    const result = await pool.query<WikiEntry>(
      `UPDATE wiki_entries
       SET aliases = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [updatedAliases, id]
    );

    return result.rows[0];
  }

  /**
   * Set all aliases for a wiki entry (replaces existing aliases)
   */
  async setAliases(id: string, aliases: string[]): Promise<WikiEntry> {
    const result = await pool.query<WikiEntry>(
      `UPDATE wiki_entries
       SET aliases = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [aliases, id]
    );

    if (result.rows.length === 0) {
      throw new Error('Entrada não encontrada');
    }

    return result.rows[0];
  }
}

// Export singleton instance
export const wikiService = new WikiService();
