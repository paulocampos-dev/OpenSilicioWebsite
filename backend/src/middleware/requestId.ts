import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Extend Express Request to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Request ID middleware
 * Generates a unique ID for each request to help with tracing and debugging
 */
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate a unique request ID using UUID v4
  const requestId = randomUUID();

  // Attach to request object
  req.requestId = requestId;

  // Add to response headers for client-side debugging
  res.setHeader('X-Request-ID', requestId);

  next();
};
