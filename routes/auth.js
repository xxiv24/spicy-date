const express = require('express');
const router = express.Router();
const {
  validateLogin,
  validateSignup,
} = require('../validators/inputValidator');
const {
  PasswordService,
  TokenService,
  SessionService,
} = require('../services/authService');
const Logger = require('../utils/logger');
const { verifyToken, authLimiter } = require('../middleware/security');
const User = require('../models/User');

// ============================================
// SIGNUP ROUTE
// ============================================
router.post('/signup', authLimiter, validateSignup, async (req, res, next) => {
  try {
    const { email, password, firstName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
        code: 'EMAIL_EXISTS',
      });
    }

    // Check password strength
    const strengthCheck = PasswordService.validatePasswordStrength(password);
    if (!strengthCheck.isStrong) {
      return res.status(400).json({
        success: false,
        message: 'Password is not strong enough',
        code: 'WEAK_PASSWORD',
        requirements: strengthCheck.requirements,
      });
    }

    // Hash password
    const hashedPassword = await PasswordService.hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      isVerified: false,
    });

    // Generate tokens
    const tokens = TokenService.generateTokenPair(user._id, user.email, 'user');

    // Create session
    const sessionId = SessionService.createSession(
      user._id,
      req.headers['user-agent'],
      req.ip
    );

    Logger.info('User signed up', {
      userId: user._id,
      email: user.email,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
      },
      tokens,
      sessionId,
    });
  } catch (error) {
    Logger.error('Signup error', error, {
      email: req.body.email,
    });
    next(error);
  }
});

// ============================================
// LOGIN ROUTE
// ============================================
router.post('/login', authLimiter, validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(401).json({
        success: false,
        message: 'Account is locked. Try again later.',
        code: 'ACCOUNT_LOCKED',
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();

      Logger.warn('Failed login attempt', {
        email,
        ip: req.ip,
        loginAttempts: user.loginAttempts,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    // Generate tokens
    const tokens = TokenService.generateTokenPair(user._id, user.email, 'user');

    // Create session
    const sessionId = SessionService.createSession(
      user._id,
      req.headers['user-agent'],
      req.ip
    );

    Logger.info('User logged in', {
      userId: user._id,
      email: user.email,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
      },
      tokens,
      sessionId,
    });
  } catch (error) {
    Logger.error('Login error', error);
    next(error);
  }
});

// ============================================
// REFRESH TOKEN ROUTE
// ============================================
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required',
        code: 'NO_REFRESH_TOKEN',
      });
    }

    const verification = TokenService.verifyToken(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    const userId = verification.decoded.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    const newAccessToken = TokenService.generateAccessToken(
      user._id,
      user.email,
      'user'
    );

    res.json({
      success: true,
      message: 'Token refreshed',
      accessToken: newAccessToken,
    });
  } catch (error) {
    Logger.error('Refresh token error', error);
    next(error);
  }
});

// ============================================
// LOGOUT ROUTE
// ============================================
router.post('/logout', verifyToken, (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (sessionId) {
      SessionService.revokeSession(sessionId);
    }

    Logger.info('User logged out', {
      userId: req.userId,
    });

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    Logger.error('Logout error', error);
    next(error);
  }
});

// ============================================
// GET CURRENT USER
// ============================================
router.get('/me', verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    Logger.error('Get user error', error);
    next(error);
  }
});

module.exports = router;
