import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllResources = async (req: AuthRequest, res: Response) => {
  try {
    const { published } = req.query;
    let query = 'SELECT * FROM education_resources';
    const params: any[] = [];

    if (published !== undefined) {
      query += ' WHERE published = $1';
      params.push(published === 'true');
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar recursos:', error);
    res.status(500).json({ error: 'Erro ao buscar recursos' });
  }
};

export const getResourceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM education_resources WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar recurso:', error);
    res.status(500).json({ error: 'Erro ao buscar recurso' });
  }
};

export const createResource = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      content,
      content_type,
      category,
      published,
    } = req.body;

    if (!title || !description || !content) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO education_resources 
       (id, title, description, content, content_type, category, published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [id, title, description, content, content_type || 'wysiwyg', category, published || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar recurso:', error);
    res.status(500).json({ error: 'Erro ao criar recurso' });
  }
};

export const updateResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      content,
      content_type,
      category,
      published,
    } = req.body;

    const result = await pool.query(
      `UPDATE education_resources 
       SET title = $1, description = $2, content = $3, content_type = $4,
           category = $5, published = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title, description, content, content_type, category, published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar recurso:', error);
    res.status(500).json({ error: 'Erro ao atualizar recurso' });
  }
};

export const deleteResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM education_resources WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recurso não encontrado' });
    }

    res.json({ message: 'Recurso deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar recurso:', error);
    res.status(500).json({ error: 'Erro ao deletar recurso' });
  }
};

