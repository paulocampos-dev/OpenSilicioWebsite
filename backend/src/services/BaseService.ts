import { Pool, QueryResult } from 'pg';
import { NotFoundError, DatabaseError } from '../errors/AppError';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface WhereCondition {
  field: string;
  value: any;
}

/**
 * Generic base service for CRUD operations
 * Reduces code duplication across all entity services
 */
export class BaseService<T> {
  constructor(
    protected pool: Pool,
    protected tableName: string,
    protected resourceName: string
  ) {}

  /**
   * Get all records with optional filtering and pagination
   */
  async getAll(
    whereConditions: WhereCondition[] = [],
    pagination?: PaginationOptions,
    orderBy = 'created_at DESC'
  ): Promise<PaginatedResult<T>> {
    try {
      // Build WHERE clause
      const whereClauses: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      whereConditions.forEach((condition) => {
        whereClauses.push(`${condition.field} = $${paramIndex}`);
        params.push(condition.value);
        paramIndex++;
      });

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM ${this.tableName} ${whereClause}`;
      const countResult = await this.pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count, 10);

      // Build data query with pagination
      let dataQuery = `SELECT * FROM ${this.tableName} ${whereClause} ORDER BY ${orderBy}`;

      if (pagination) {
        const offset = (pagination.page - 1) * pagination.limit;
        dataQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(pagination.limit, offset);
      }

      const dataResult = await this.pool.query(dataQuery, params);

      // Calculate pagination metadata
      const page = pagination?.page || 1;
      const limit = pagination?.limit || total;
      const totalPages = Math.ceil(total / limit);

      return {
        data: dataResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error(`Error fetching ${this.resourceName}:`, error);
      throw new DatabaseError(`Erro ao buscar ${this.resourceName}`);
    }
  }

  /**
   * Get a single record by ID
   */
  async getById(id: string): Promise<T> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(this.resourceName);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error(`Error fetching ${this.resourceName} by ID:`, error);
      throw new DatabaseError(`Erro ao buscar ${this.resourceName}`);
    }
  }

  /**
   * Get a single record by a specific field
   */
  async getByField(field: string, value: any): Promise<T | null> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.tableName} WHERE ${field} = $1`,
        [value]
      );

      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error(`Error fetching ${this.resourceName} by ${field}:`, error);
      throw new DatabaseError(`Erro ao buscar ${this.resourceName}`);
    }
  }

  /**
   * Create a new record
   */
  async create(data: Partial<T>, fields: string[]): Promise<T> {
    try {
      const columns = fields.join(', ');
      const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
      const values = fields.map((field) => (data as any)[field]);

      const query = `
        INSERT INTO ${this.tableName} (${columns})
        VALUES (${placeholders})
        RETURNING *
      `;

      const result = await this.pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error(`Error creating ${this.resourceName}:`, error);
      throw new DatabaseError(`Erro ao criar ${this.resourceName}`);
    }
  }

  /**
   * Update a record by ID
   */
  async update(id: string, data: Partial<T>, fields: string[]): Promise<T> {
    try {
      const setClauses = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
      const values = fields.map((field) => (data as any)[field]);
      values.push(id);

      const query = `
        UPDATE ${this.tableName}
        SET ${setClauses}, updated_at = NOW()
        WHERE id = $${values.length}
        RETURNING *
      `;

      const result = await this.pool.query(query, values);

      if (result.rows.length === 0) {
        throw new NotFoundError(this.resourceName);
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error(`Error updating ${this.resourceName}:`, error);
      throw new DatabaseError(`Erro ao atualizar ${this.resourceName}`);
    }
  }

  /**
   * Delete a record by ID
   */
  async delete(id: string): Promise<void> {
    try {
      const result = await this.pool.query(
        `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`,
        [id]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError(this.resourceName);
      }
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      console.error(`Error deleting ${this.resourceName}:`, error);
      throw new DatabaseError(`Erro ao deletar ${this.resourceName}`);
    }
  }

  /**
   * Check if a record exists
   */
  async exists(field: string, value: any): Promise<boolean> {
    try {
      const result = await this.pool.query(
        `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE ${field} = $1)`,
        [value]
      );
      return result.rows[0].exists;
    } catch (error) {
      console.error(`Error checking if ${this.resourceName} exists:`, error);
      throw new DatabaseError(`Erro ao verificar ${this.resourceName}`);
    }
  }
}
