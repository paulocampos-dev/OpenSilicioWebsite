import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Enforce JWT_SECRET is set in environment variables
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET is not defined in environment variables');
  process.exit(1);
}

export interface AuthRequest extends Request {
  userId?: string;
  username?: string;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    
    req.userId = decoded.userId;
    req.username = decoded.username;
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

/**
 * Para as rotas públicas de leitura: reconhece o admin quando chega um token
 * válido, sem exigir um. Sem token, ou com token inválido, o pedido segue como
 * visitante, e visitante só enxerga conteúdo publicado (ver utils/rascunhos.ts).
 */
export const authOpcional = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as { userId: string; username: string };
      req.userId = decoded.userId;
      req.username = decoded.username;
    } catch {
      // token inválido ou expirado: visitante
    }
  }
  next();
};

export const generateToken = (userId: string, username: string): string => {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: '7d' });
};

