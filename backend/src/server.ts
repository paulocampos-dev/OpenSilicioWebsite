import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Importar rotas
import authRoutes from './routes/auth';
import blogRoutes from './routes/blog';
import educationRoutes from './routes/education';
import wikiRoutes from './routes/wiki';
import uploadRoutes from './routes/upload';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

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

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'OpenSilício API está funcionando' });
});

// Error handling middlewares (MUST be after all routes)
app.use(notFoundHandler); // 404 handler
app.use(errorHandler); // Centralized error handler

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 API disponível em http://localhost:${PORT}`);
});

export default app;

