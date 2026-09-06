require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const {
  securityHeaders,
  corsOptions,
  generalLimiter,
  apiLimiter,
  sanitizeInput,
  errorHandler,
} = require('./middleware/security');

const app = express();

// ============================================
// CONFIGURATION VALIDATION
// ============================================
const requiredEnvVars = [
  'MONGODB_URI',
  'PORT',
  'NODE_ENV',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'TELEGRAM_BOT_TOKEN',
  'ENCRYPTION_KEY',
];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

console.log('✅ All required environment variables are set');

// ============================================
// MIDDLEWARE SETUP
// ============================================

app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(generalLimiter);
app.use(sanitizeInput);
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB Connected Successfully');
  })
  .catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// ============================================
// API ROUTES
// ============================================

app.use('/api/auth', require('./routes/auth'));
app.use('/api', apiLimiter, require('./routes/api'));

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path,
  });
});

// ============================================
// ERROR HANDLER (Must be last)
// ============================================
app.use(errorHandler);

// ============================================
// SERVER START
// ============================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`
    ╔════════════════════════════════════════╗
    ║     🌶️ SPICY DATE SERVER STARTED 🌶️     ║
    ╚════════════════════════════════════════╝
    
    🚀 Port: ${PORT}
    🌍 Environment: ${process.env.NODE_ENV}
    📊 URL: http://localhost:${PORT}
    🔐 Security: Enabled
    
  `);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
