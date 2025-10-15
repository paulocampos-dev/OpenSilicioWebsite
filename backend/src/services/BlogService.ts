import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { BaseService, PaginationOptions, WhereCondition } from './BaseService';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  content_type: 'wysiwyg' | 'markdown';
  author?: string;
  image_url?: string;
  category?: string;
  published: boolean;
  created_at: Date;
  updated_at: Date;
}

export class BlogService extends BaseService<BlogPost> {
  constructor() {
    super(pool, 'blog_posts', 'Post');
  }

  /**
   * Get all blog posts with optional published filter
   */
  async getAllPosts(published?: boolean, pagination?: PaginationOptions) {
    const whereConditions: WhereCondition[] = [];

    if (published !== undefined) {
      whereConditions.push({ field: 'published', value: published });
    }

    return this.getAll(whereConditions, pagination);
  }

  /**
   * Get a blog post by slug
   */
  async getBySlug(slug: string): Promise<BlogPost> {
    const post = await this.getByField('slug', slug);

    if (!post) {
      throw new Error('Post não encontrado');
    }

    return post;
  }

  /**
   * Create a new blog post
   */
  async createPost(data: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>): Promise<BlogPost> {
    const postData = {
      id: uuidv4(),
      ...data,
      content_type: data.content_type || 'wysiwyg',
      published: data.published || false,
    };

    const fields = [
      'id',
      'slug',
      'title',
      'excerpt',
      'content',
      'content_type',
      'author',
      'image_url',
      'category',
      'published',
    ];

    return this.create(postData, fields);
  }

  /**
   * Update a blog post
   */
  async updatePost(id: string, data: Partial<BlogPost>): Promise<BlogPost> {
    const fields = Object.keys(data).filter((key) => key !== 'id' && key !== 'created_at' && key !== 'updated_at');
    return this.update(id, data, fields);
  }

  /**
   * Delete a blog post
   */
  async deletePost(id: string): Promise<void> {
    return this.delete(id);
  }
}

// Export singleton instance
export const blogService = new BlogService();
