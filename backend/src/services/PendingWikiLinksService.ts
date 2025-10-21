import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { BaseService, PaginationOptions, WhereCondition } from './BaseService';

export interface PendingWikiLink {
  id: string;
  term: string;
  content_type: 'blog' | 'education';
  content_id: string;
  context?: string;
  created_at: Date;
}

export interface PendingWikiLinkWithContent extends PendingWikiLink {
  content_title?: string;
}

export class PendingWikiLinksService extends BaseService<PendingWikiLink> {
  constructor() {
    super(pool, 'pending_wiki_links', 'Link pendente da wiki');
  }

  /**
   * Get all pending wiki links with optional pagination
   */
  async getAllPending(pagination?: PaginationOptions) {
    return this.getAll([], pagination, 'created_at DESC');
  }

  /**
   * Get all pending links with content information (title, etc.)
   */
  async getAllPendingWithContent(pagination?: PaginationOptions) {
    const { page = 1, limit = 20 } = pagination || {};
    const offset = (page - 1) * limit;

    const query = `
      SELECT
        pwl.*,
        CASE
          WHEN pwl.content_type = 'blog' THEN bp.title
          WHEN pwl.content_type = 'education' THEN er.title
          ELSE NULL
        END as content_title
      FROM pending_wiki_links pwl
      LEFT JOIN blog_posts bp ON pwl.content_type = 'blog' AND pwl.content_id = bp.id
      LEFT JOIN education_resources er ON pwl.content_type = 'education' AND pwl.content_id = er.id
      ORDER BY pwl.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `SELECT COUNT(*) FROM pending_wiki_links`;

    const [dataResult, countResult] = await Promise.all([
      pool.query<PendingWikiLinkWithContent>(query, [limit, offset]),
      pool.query<{ count: string }>(countQuery),
    ]);

    const total = parseInt(countResult.rows[0]?.count || '0', 10);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get all pending links for a specific term
   */
  async getPendingByTerm(term: string): Promise<PendingWikiLink[]> {
    const result = await pool.query<PendingWikiLink>(
      `SELECT * FROM pending_wiki_links WHERE LOWER(term) = LOWER($1) ORDER BY created_at DESC`,
      [term]
    );
    return result.rows;
  }

  /**
   * Get count of pending links
   */
  async getPendingCount(): Promise<number> {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM pending_wiki_links'
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Get count of unique terms in pending links
   */
  async getUniqueTermsCount(): Promise<number> {
    const result = await pool.query<{ count: string }>(
      'SELECT COUNT(DISTINCT LOWER(term)) as count FROM pending_wiki_links'
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  /**
   * Get pending links grouped by term
   */
  async getPendingGroupedByTerm() {
    const result = await pool.query<{ term: string; count: string; first_created: Date }>(
      `SELECT
        term,
        COUNT(*) as count,
        MIN(created_at) as first_created
      FROM pending_wiki_links
      GROUP BY term
      ORDER BY count DESC, first_created DESC`
    );
    return result.rows.map(row => ({
      term: row.term,
      count: parseInt(row.count, 10),
      firstCreated: row.first_created,
    }));
  }

  /**
   * Create a new pending wiki link
   */
  async createPendingLink(
    data: Omit<PendingWikiLink, 'id' | 'created_at'>
  ): Promise<PendingWikiLink> {
    const linkData = {
      id: uuidv4(),
      ...data,
      context: data.context || null,
    };

    const fields = ['id', 'term', 'content_type', 'content_id', 'context'];

    try {
      return await this.create(linkData, fields);
    } catch (error: any) {
      // Handle unique constraint violation
      if (error?.code === '23505') {
        throw new Error('Este link pendente já existe para este conteúdo');
      }
      throw error;
    }
  }

  /**
   * Delete all pending links for a specific term
   * Used when a wiki entry is created for that term
   */
  async deletePendingByTerm(term: string): Promise<number> {
    const result = await pool.query(
      'DELETE FROM pending_wiki_links WHERE LOWER(term) = LOWER($1)',
      [term]
    );
    return result.rowCount || 0;
  }

  /**
   * Delete a specific pending link
   */
  async deletePendingLink(id: string): Promise<void> {
    return this.delete(id);
  }

  /**
   * Check if a term has pending links
   */
  async hasPendingLinks(term: string): Promise<boolean> {
    const result = await pool.query<{ exists: boolean }>(
      'SELECT EXISTS(SELECT 1 FROM pending_wiki_links WHERE LOWER(term) = LOWER($1)) as exists',
      [term]
    );
    return result.rows[0]?.exists || false;
  }

  /**
   * Get pending links for specific content
   */
  async getPendingForContent(
    contentType: 'blog' | 'education',
    contentId: string
  ): Promise<PendingWikiLink[]> {
    const result = await pool.query<PendingWikiLink>(
      'SELECT * FROM pending_wiki_links WHERE content_type = $1 AND content_id = $2',
      [contentType, contentId]
    );
    return result.rows;
  }
}

// Export singleton instance
export const pendingWikiLinksService = new PendingWikiLinksService();
