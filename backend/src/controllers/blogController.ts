import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { published } = req.query;
    let query = 'SELECT * FROM blog_posts';
    const params: any[] = [];

    if (published !== undefined) {
      query += ' WHERE published = $1';
      params.push(published === 'true');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ error: 'Erro ao buscar posts' });
  }
};

export const getPostBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      'SELECT * FROM blog_posts WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar post:', error);
    res.status(500).json({ error: 'Erro ao buscar post' });
  }
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const {
      slug,
      title,
      excerpt,
      content,
      content_type,
      author,
      image_url,
      category,
      published,
    } = req.body;

    if (!slug || !title || !excerpt || !content) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO blog_posts 
       (id, slug, title, excerpt, content, content_type, author, image_url, category, published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
       RETURNING *`,
      [id, slug, title, excerpt, content, content_type || 'wysiwyg', author, image_url, category, published || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar post:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Slug já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar post' });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      slug,
      title,
      excerpt,
      content,
      content_type,
      author,
      image_url,
      category,
      published,
    } = req.body;

    const result = await pool.query(
      `UPDATE blog_posts 
       SET slug = $1, title = $2, excerpt = $3, content = $4, content_type = $5,
           author = $6, image_url = $7, category = $8, published = $9, updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [slug, title, excerpt, content, content_type, author, image_url, category, published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar post:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Slug já existe' });
    }
    res.status(500).json({ error: 'Erro ao atualizar post' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM blog_posts WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post não encontrado' });
    }

    res.json({ message: 'Post deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar post:', error);
    res.status(500).json({ error: 'Erro ao deletar post' });
  }
};

