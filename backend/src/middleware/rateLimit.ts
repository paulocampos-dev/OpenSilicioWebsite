import rateLimit from 'express-rate-limit';

// Check if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// General API rate limiter - 100 requests per 15 minutes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Muitas requisições deste IP, por favor tente novamente após 15 minutos',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter for authentication endpoints
// Development: 100 attempts per 15 minutes (for testing)
// Production: 10 attempts per 15 minutes (secure but reasonable)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 10 : 100, // Production: 10, Development: 100
  message: {
    error: 'Muitas tentativas de login. Por favor, tente novamente após 15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests (only count failed login attempts)
  skipSuccessfulRequests: true,
});

// Moderate rate limiter for content creation - 20 requests per hour
export const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 create requests per windowMs
  message: {
    error: 'Muitas criações de conteúdo. Por favor, tente novamente após 1 hora',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter - 10 uploads per hour
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per windowMs
  message: {
    error: 'Muitos uploads de arquivos. Por favor, tente novamente após 1 hora',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
