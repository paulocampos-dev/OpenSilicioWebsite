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

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).user?.id;

  if (!userId) {
    throw new UnauthorizedError('Usuário não autenticado');
  }

  // Buscar usuário atual
  const result = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Usuário não encontrado');
  }

  const user = result.rows[0];

  // Verificar senha atual
  const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!passwordMatch) {
    throw new UnauthorizedError('Senha atual incorreta');
  }

  // Validar nova senha (mínimo 8 caracteres, com complexidade)
  if (newPassword.length < 8) {
    throw new BadRequestError('A nova senha deve ter pelo menos 8 caracteres');
  }

  // Verificar se a nova senha é diferente da atual
  const samePassword = await bcrypt.compare(newPassword, user.password_hash);
  if (samePassword) {
    throw new BadRequestError('A nova senha deve ser diferente da senha atual');
  }

  // Hash da nova senha
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Atualizar senha no banco
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [newPasswordHash, userId]
  );

  res.json({
    success: true,
    message: 'Senha alterada com sucesso',
  });
});

