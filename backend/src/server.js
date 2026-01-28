import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import brandsRoutes from './routes/brands.js';
import transactionsRoutes from './routes/transactions.js';
import insightsRoutes from './routes/insights.js';
import uploadRoutes from './routes/upload.js';

// Import middleware
import { authenticateToken } from './middleware/auth.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

// CORS configuration - allow requests from Vercel frontend
// CORS configuration - allow requests from Vercel frontend
const corsOptions = {
  origin: [
    'https://bd-automation-platform.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/brands', authenticateToken, brandsRoutes);
app.use('/api/transactions', authenticateToken, transactionsRoutes);
app.use('/api/insights', authenticateToken, insightsRoutes);
app.use('/api/admin', uploadRoutes); // No auth required for admin uploads

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'BD Automation Platform API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: {
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify',
      },
      dashboard: {
        overview: 'GET /api/dashboard/overview',
        platformPerformance: 'GET /api/dashboard/platform-performance',
        brandsByPlatform: 'GET /api/dashboard/brands/:platform',
      },
      brands: {
        all: 'GET /api/brands',
        byId: 'GET /api/brands/:id',
      },
      transactions: {
        all: 'GET /api/transactions',
        byId: 'GET /api/transactions/:id',
      },
      insights: {
        trends: 'GET /api/insights/trends',
        topBrands: 'GET /api/insights/top-brands',
        topProducts: 'GET /api/insights/top-products',
        overview: 'GET /api/insights/overview',
      },
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  BD Automation Platform API                               ║
║  Environment: ${process.env.NODE_ENV || 'development'}                                 ║
║  Server running on port ${PORT}                             ║
║  Health check: http://localhost:${PORT}/health              ║
╚═══════════════════════════════════════════════════════════╝
  `);
  console.log('✓ Using Prisma ORM for database access');
});

export default app;
