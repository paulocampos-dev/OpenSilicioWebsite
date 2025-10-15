import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllResources = async (req: AuthRequest, res: Response) => {
  try {
    const { published, page = '1', limit = '10' } = req.query;

    // Parse and validate pagination parameters
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10)); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    // Build count query
    let countQuery = 'SELECT COUNT(*) FROM education_resources';
    const countParams: any[] = [];

    // Build data query
    let dataQuery = 'SELECT * FROM education_resources';
    const dataParams: any[] = [];

    if (published !== undefined) {
      const publishedValue = published === 'true';
      countQuery += ' WHERE published = $1';
      countParams.push(publishedValue);
      dataQuery += ' WHERE published = $1';
      dataParams.push(publishedValue);
    }

    dataQuery += ' ORDER BY created_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limitNum, offset);

    // Execute both queries
    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, countParams),
      pool.query(dataQuery, dataParams),
    ]);

    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: dataResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
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

