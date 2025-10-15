import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getAllEntries = async (req: AuthRequest, res: Response) => {
  try {
    const { published, page = '1', limit = '20' } = req.query;

    // Parse and validate pagination parameters
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20)); // Max 100 items per page
    const offset = (pageNum - 1) * limitNum;

    // Build count query
    let countQuery = 'SELECT COUNT(*) FROM wiki_entries';
    const countParams: any[] = [];

    // Build data query
    let dataQuery = 'SELECT * FROM wiki_entries';
    const dataParams: any[] = [];

    if (published !== undefined) {
      const publishedValue = published === 'true';
      countQuery += ' WHERE published = $1';
      countParams.push(publishedValue);
      dataQuery += ' WHERE published = $1';
      dataParams.push(publishedValue);
    }

    dataQuery += ' ORDER BY term ASC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
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
    console.error('Erro ao buscar entradas da wiki:', error);
    res.status(500).json({ error: 'Erro ao buscar entradas da wiki' });
  }
};

export const getEntryBySlug = async (req: AuthRequest, res: Response) => {
  try {
    const { slug } = req.params;
    const result = await pool.query(
      'SELECT * FROM wiki_entries WHERE slug = $1',
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar entrada:', error);
    res.status(500).json({ error: 'Erro ao buscar entrada' });
  }
};

export const createEntry = async (req: AuthRequest, res: Response) => {
  try {
    const {
      term,
      slug,
      definition,
      content,
      content_type,
      published,
    } = req.body;

    if (!term || !slug || !definition) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO wiki_entries 
       (id, term, slug, definition, content, content_type, published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [id, term, slug, definition, content || '', content_type || 'wysiwyg', published || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao criar entrada:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Termo ou slug já existe' });
    }
    res.status(500).json({ error: 'Erro ao criar entrada' });
  }
};

export const updateEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      term,
      slug,
      definition,
      content,
      content_type,
      published,
    } = req.body;

    const result = await pool.query(
      `UPDATE wiki_entries 
       SET term = $1, slug = $2, definition = $3, content = $4, 
           content_type = $5, published = $6, updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [term, slug, definition, content, content_type, published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Erro ao atualizar entrada:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Termo ou slug já existe' });
    }
    res.status(500).json({ error: 'Erro ao atualizar entrada' });
  }
};

export const deleteEntry = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM wiki_entries WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entrada não encontrada' });
    }

    res.json({ message: 'Entrada deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar entrada:', error);
    res.status(500).json({ error: 'Erro ao deletar entrada' });
  }
};

export const getWikiLinksForContent = async (req: AuthRequest, res: Response) => {
  try {
    const { contentType, contentId } = req.params;

    const result = await pool.query(
      `SELECT wl.*, we.term, we.slug 
       FROM content_wiki_links wl
       JOIN wiki_entries we ON wl.wiki_entry_id = we.id
       WHERE wl.content_type = $1 AND wl.content_id = $2`,
      [contentType, contentId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar links da wiki:', error);
    res.status(500).json({ error: 'Erro ao buscar links da wiki' });
  }
};

export const createWikiLink = async (req: AuthRequest, res: Response) => {
  try {
    const { contentType, contentId, wikiEntryId, linkText } = req.body;

    if (!contentType || !contentId || !wikiEntryId || !linkText) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO content_wiki_links 
       (id, content_type, content_id, wiki_entry_id, link_text, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [id, contentType, contentId, wikiEntryId, linkText]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar link da wiki:', error);
    res.status(500).json({ error: 'Erro ao criar link da wiki' });
  }
};

export const deleteWikiLink = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM content_wiki_links WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link não encontrado' });
    }

    res.json({ message: 'Link deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar link:', error);
    res.status(500).json({ error: 'Erro ao deletar link' });
  }
};

