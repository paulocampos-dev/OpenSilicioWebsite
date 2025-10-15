// Base application error class
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

// 400 - Bad Request
export class BadRequestError extends AppError {
  constructor(message = 'Requisição inválida') {
    super(message, 400);
  }
}

// 401 - Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 401);
  }
}

// 403 - Forbidden
export class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 403);
  }
}

// 404 - Not Found
export class NotFoundError extends AppError {
  constructor(resource = 'Recurso', message?: string) {
    super(message || `${resource} não encontrado`, 404);
  }
}

// 409 - Conflict
export class ConflictError extends AppError {
  constructor(message = 'Conflito - recurso já existe') {
    super(message, 409);
  }
}

// 422 - Unprocessable Entity
export class ValidationError extends AppError {
  public readonly errors: Array<{ field: string; message: string }>;

  constructor(
    errors: Array<{ field: string; message: string }>,
    message = 'Erro de validação'
  ) {
    super(message, 422);
    this.errors = errors;
  }
}

// 500 - Internal Server Error
export class InternalServerError extends AppError {
  constructor(message = 'Erro interno do servidor') {
    super(message, 500, false); // Not operational - unexpected error
  }
}

// Database errors
export class DatabaseError extends AppError {
  constructor(message = 'Erro de banco de dados', originalError?: Error) {
    super(message, 500, false);
    if (originalError) {
      this.stack = originalError.stack;
    }
  }
}
