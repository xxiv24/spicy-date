const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
const helmet = require('helmet');

// ============================================
// 1. HELMET - HTTP Security Headers
// ============================================
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
});

// ============================================
// 2. CORS - Proper Configuration
// ============================================
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.TELEGRAM_APP_URL,
      process.env.CLIENT_URL,
      'https://yourdomain.com',
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600,
};

// ============================================
// 3. RATE LIMITING - Prevent Brute Force
// ============================================
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'API rate limit exceeded.',
});

// ============================================
// 4. JWT TOKEN VALIDATION
// ============================================
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
        code: 'NO_TOKEN',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN',
    });
  }
};

// ============================================
// 5. TELEGRAM VALIDATION
// ============================================
const verifyTelegramUser = (req, res, next) => {
  try {
    const initData = req.headers['x-telegram-init-data'];

    if (!initData) {
      return res.status(401).json({
        success: false,
        message: 'Telegram verification failed',
        code: 'TELEGRAM_INVALID',
      });
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Telegram data',
        code: 'TELEGRAM_INVALID',
      });
    }

    req.telegramData = Object.fromEntries(params);
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Telegram verification failed',
      code: 'TELEGRAM_ERROR',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================
// 6. MONGO SANITIZATION
// ============================================
const sanitizeInput = (req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
};

// ============================================
// 7. ERROR HANDLER MIDDLEWARE
// ============================================
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[${new Date().toISOString()}] Error:`, {
    statusCode,
    message,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  if (process.env.NODE_ENV === 'production') {
    const fs = require('fs');
    const log = `[${new Date().toISOString()}] ${statusCode} - ${message}\n`;
    fs.appendFileSync('logs/errors.log', log);
  }

  res.status(statusCode).json({
    success: false,
    message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = {
  securityHeaders,
  corsOptions,
  generalLimiter,
  authLimiter,
  apiLimiter,
  verifyToken,
  verifyTelegramUser,
  sanitizeInput,
  errorHandler,
};
