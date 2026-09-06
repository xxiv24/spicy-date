const { body, query, param, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// ============================================
// SANITIZATION FUNCTIONS
// ============================================
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().substring(0, 1000);
};

const sanitizeEmail = (email) => {
  return email.toLowerCase().trim();
};

const sanitizeHtmlContent = (html) => {
  return sanitizeHtml(html, {
    allowedTags: [],
    allowedAttributes: {},
  });
};

// ============================================
// VALIDATION MIDDLEWARE
// ============================================
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array().map((err) => ({
        field: err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

// ============================================
// PROFILE VALIDATORS
// ============================================
const validateProfileCreate = [
  body('telegramId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid Telegram ID'),
  
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
    .trim()
    .escape(),
  
  body('lastName')
    .optional()
    .isLength({ max: 50 }).withMessage('Last name must be max 50 characters')
    .trim()
    .escape(),
  
  body('username')
    .notEmpty().withMessage('Username is required')
    .matches(/^[a-zA-Z0-9_]{3,30}$/).withMessage('Invalid username format')
    .trim(),
  
  body('bio')
    .optional()
    .isLength({ max: 500 }).withMessage('Bio must be max 500 characters')
    .trim()
    .escape(),
  
  body('email')
    .optional()
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('age')
    .optional()
    .isInt({ min: 18, max: 100 }).withMessage('Age must be between 18-100'),
  
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  
  body('interests')
    .optional()
    .isArray({ min: 1, max: 10 }).withMessage('Interests must be 1-10 items')
    .custom((value) => {
      if (!Array.isArray(value)) return false;
      return value.every(item => typeof item === 'string' && item.length > 0 && item.length <= 50);
    }).withMessage('Each interest must be a valid string'),
  
  body('location')
    .optional()
    .isLength({ max: 100 }).withMessage('Location must be max 100 characters')
    .trim()
    .escape(),

  handleValidationErrors,
];

// ============================================
// CHAT VALIDATORS
// ============================================
const validateMessage = [
  body('receiverId')
    .notEmpty().withMessage('Receiver ID is required')
    .isMongoId().withMessage('Invalid receiver ID'),
  
  body('message')
    .notEmpty().withMessage('Message cannot be empty')
    .isLength({ min: 1, max: 5000 }).withMessage('Message must be 1-5000 characters')
    .trim()
    .customSanitizer(value => sanitizeHtmlContent(value)),

  handleValidationErrors,
];

// ============================================
// AUTHENTICATION VALIDATORS
// ============================================
const validateLogin = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and numbers'),

  handleValidationErrors,
];

const validateSignup = [
  body('email')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and numbers'),
  
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters')
    .trim()
    .escape(),

  handleValidationErrors,
];

// ============================================
// VOICE/FILE UPLOAD VALIDATORS
// ============================================
const validateVoiceUpload = [
  body('duration')
    .optional()
    .isInt({ min: 1, max: 300 }).withMessage('Duration must be 1-300 seconds'),

  handleValidationErrors,
];

// ============================================
// VIP VALIDATORS
// ============================================
const validateVIPPurchase = [
  body('planId')
    .notEmpty().withMessage('Plan ID is required')
    .isIn(['monthly', 'yearly']).withMessage('Invalid plan'),
  
  body('paymentMethod')
    .notEmpty().withMessage('Payment method is required')
    .isIn(['credit_card', 'paypal', 'crypto']).withMessage('Invalid payment method'),

  handleValidationErrors,
];

// ============================================
// QUERY VALIDATORS
// ============================================
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
    .toInt(),

  handleValidationErrors,
];

// ============================================
// CUSTOM VALIDATORS
// ============================================
const validateUserId = [
  param('userId')
    .isMongoId().withMessage('Invalid user ID format'),

  handleValidationErrors,
];

module.exports = {
  sanitizeString,
  sanitizeEmail,
  sanitizeHtmlContent,
  validateProfileCreate,
  validateMessage,
  validateLogin,
  validateSignup,
  validateVoiceUpload,
  validateVIPPurchase,
  validatePagination,
  validateUserId,
  handleValidationErrors,
};
