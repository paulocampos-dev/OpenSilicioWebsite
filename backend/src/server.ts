import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Importar configurações
import pool from './config/database';

// Importar rotas
import authRoutes from './routes/auth';
import blogRoutes from './routes/blog';
import educationRoutes from './routes/education';
import wikiRoutes from './routes/wiki';
import uploadRoutes from './routes/upload';
import imageUploadRoutes from './routes/imageUpload';
import settingsRoutes from './routes/settings';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { monitoringMiddleware, getMetricsSummary } from './middleware/monitoring';

const app = express();
const PORT = process.env.PORT || 3001;

// Request ID middleware - must be first to be available in all subsequent middleware
app.use(requestIdMiddleware);

// Performance monitoring middleware
app.use(monitoringMiddleware);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  const requestId = req.requestId || 'unknown';

  // Log request
  console.log(`[${timestamp}] [${requestId}] ${req.method} ${req.path}`);

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const resetColor = '\x1b[0m';
    console.log(
      `[${timestamp}] [${requestId}] ${req.method} ${req.path} ${statusColor}${res.statusCode}${resetColor} - ${duration}ms`
    );
  });

  next();
});

// Security headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow images from /uploads
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// CORS configuration - use environment variable for allowed origins
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://frontend:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Body parsing middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// Servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/education', educationRoutes);
app.use('/api/wiki', wikiRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/upload', imageUploadRoutes); // Image upload with compression
app.use('/api/settings', settingsRoutes);

// Rota de health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await pool.query('SELECT 1');

    res.json({
      status: 'OK',
      message: 'OpenSilício API está funcionando',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Serviço indisponível',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// Metrics endpoint (for monitoring and debugging)
app.get('/metrics', (req, res) => {
  const summary = getMetricsSummary();
  res.json({
    summary,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middlewares (MUST be after all routes)
app.use(notFoundHandler); // 404 handler
app.use(errorHandler); // Centralized error handler

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n========================================');
  console.log('🚀 OpenSilício Backend Server');
  console.log('========================================');
  console.log(`📡 API disponível em http://localhost:${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
  console.log(`🔒 CORS Origins: ${allowedOrigins.join(', ')}`);
  console.log('========================================\n');
  console.log('⏳ Aguardando requisições...\n');
});

export default app;

