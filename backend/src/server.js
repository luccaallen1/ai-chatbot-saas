const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize database on startup
const { initDatabase } = require('./utils/initDatabase');
initDatabase().catch(console.error);

// Import routes with error handling
let authRoutes, widgetRoutes, chatRoutes, integrationRoutes, onboardingRoutes;

try {
  authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
} catch (e) {
  console.error('❌ Failed to load auth routes:', e.message);
  authRoutes = require('express').Router();
}

try {
  widgetRoutes = require('./routes/widgets');
  console.log('✅ Widget routes loaded');
} catch (e) {
  console.error('❌ Failed to load widget routes:', e.message);
  widgetRoutes = require('express').Router();
}

try {
  chatRoutes = require('./routes/chat');
  console.log('✅ Chat routes loaded');
} catch (e) {
  console.error('❌ Failed to load chat routes:', e.message);
  chatRoutes = require('express').Router();
}

try {
  integrationRoutes = require('./routes/integrations');
  console.log('✅ Integration routes loaded');
} catch (e) {
  console.error('❌ Failed to load integration routes:', e.message);
  integrationRoutes = require('express').Router();
}

try {
  onboardingRoutes = require('./routes/onboarding');
  console.log('✅ Onboarding routes loaded');
} catch (e) {
  console.error('❌ Failed to load onboarding routes:', e.message);
  onboardingRoutes = require('express').Router();
}

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const logger = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging middleware
app.use(logger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    routes: {
      auth: '/api/v1/auth',
      integrations: '/api/integrations',
      onboarding: '/api/onboarding'
    }
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/widgets', widgetRoutes);
app.use('/api/v1', chatRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/onboarding', onboardingRoutes);

// Widget CDN endpoint (public)
app.get('/widget/:widgetId/config', async (req, res) => {
  try {
    const { widgetId } = req.params;
    const config = await require('./services/widgetService').getPublicConfig(widgetId);
    
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'Access-Control-Allow-Origin': '*'
    });
    
    res.json(config);
  } catch (error) {
    res.status(404).json({ error: 'Widget not found' });
  }
});

// Serve widget JavaScript (public CDN)
app.get('/widget.js', (req, res) => {
  res.set({
    'Content-Type': 'application/javascript',
    'Cache-Control': 'public, max-age=86400', // 24 hours
    'Access-Control-Allow-Origin': '*'
  });
  
  // Serve the dynamic widget loader
  res.send(require('./services/widgetService').getWidgetScript());
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Chatbot SaaS API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`🎨 Dashboard: ${process.env.CLIENT_URL}`);
    console.log(`🤖 Widget CDN: http://localhost:${PORT}/widget.js`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;