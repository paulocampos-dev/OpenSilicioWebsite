import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '../errors/AppError';

// Centralized error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error values
  let statusCode = 500;
  let message = 'Erro interno do servidor';
  let errors: Array<{ field: string; message: string }> | undefined;

  // Log error for debugging
  console.error('❌ Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle operational errors (AppError instances)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;

    // Handle validation errors with field-specific messages
    if (err instanceof ValidationError) {
      errors = err.errors;
    }
  }
  // Handle PostgreSQL errors
  else if ('code' in err && typeof err.code === 'string') {
    const pgError = err as any;

    switch (pgError.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Este recurso já existe';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Referência inválida - recurso relacionado não existe';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Campo obrigatório faltando';
        break;
      case '22P02': // Invalid text representation
        statusCode = 400;
        message = 'Formato de dados inválido';
        break;
      default:
        statusCode = 500;
        message = 'Erro de banco de dados';
    }
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }
  // Handle Multer errors (file upload)
  else if (err.name === 'MulterError') {
    statusCode = 400;
    const multerErr = err as any;
    if (multerErr.code === 'LIMIT_FILE_SIZE') {
      message = 'Arquivo muito grande';
    } else if (multerErr.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Campo de arquivo inesperado';
    } else {
      message = 'Erro no upload do arquivo';
    }
  }

  // Send error response
  const response: any = {
    error: message,
  };

  // Add validation errors if present
  if (errors) {
    response.details = errors;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development' && !(err instanceof AppError)) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// Async error wrapper - wraps async route handlers to catch errors
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler - must be placed after all routes
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
  });
};
