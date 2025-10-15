import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import { generateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { BadRequestError, UnauthorizedError } from '../errors/AppError';

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw new BadRequestError('Usuário e senha são obrigatórios');
  }

  const result = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Credenciais inválidas');
  }

  const user = result.rows[0];
  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw new UnauthorizedError('Credenciais inválidas');
  }

  const token = generateToken(user.id, user.username);

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
    },
  });
});

export const verifyToken = asyncHandler(async (req: Request, res: Response) => {
  // Se chegou aqui, o middleware já validou o token
  res.json({ valid: true });
});

