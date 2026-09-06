const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ============================================
// PASSWORD OPERATIONS
// ============================================
class PasswordService {
  static async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      return hashedPassword;
    } catch (error) {
      throw new Error('Error hashing password');
    }
  }

  static async comparePassword(password, hashedPassword) {
    try {
      const isMatch = await bcrypt.compare(password, hashedPassword);
      return isMatch;
    } catch (error) {
      throw new Error('Error comparing password');
    }
  }

  static validatePasswordStrength(password) {
    const requirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const isStrong = Object.values(requirements).filter(Boolean).length >= 4;

    return {
      isStrong,
      requirements,
      score: Object.values(requirements).filter(Boolean).length,
    };
  }

  static generateRandomPassword(length = 16) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

// ============================================
// JWT TOKEN OPERATIONS
// ============================================
class TokenService {
  static generateAccessToken(userId, email, role = 'user') {
    const payload = {
      userId,
      email,
      role,
      type: 'access',
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
      algorithm: 'HS256',
      issuer: 'spicy-date',
      audience: 'web',
    });

    return token;
  }

  static generateRefreshToken(userId) {
    const payload = {
      userId,
      type: 'refresh',
    };

    const token = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
      algorithm: 'HS256',
      issuer: 'spicy-date',
    });

    return token;
  }

  static verifyToken(token, secret = process.env.JWT_SECRET) {
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: 'spicy-date',
      });
      return {
        valid: true,
        decoded,
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
      };
    }
  }

  static generateTokenPair(userId, email, role = 'user') {
    return {
      accessToken: this.generateAccessToken(userId, email, role),
      refreshToken: this.generateRefreshToken(userId),
      expiresIn: 86400,
    };
  }

  static refreshAccessToken(refreshToken, userId) {
    const verification = this.verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET);

    if (!verification.valid) {
      throw new Error('Invalid refresh token');
    }

    return this.generateAccessToken(userId);
  }
}

// ============================================
// EMAIL VERIFICATION & OTP
// ============================================
class VerificationService {
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits.charAt(Math.floor(Math.random() * 10));
    }
    return otp;
  }

  static generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static generateResetToken() {
    const token = crypto.randomBytes(32).toString('hex');
    return {
      token,
      hashedToken: this.hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
  }
}

// ============================================
// SESSION MANAGEMENT
// ============================================
class SessionService {
  static sessions = new Map();

  static createSession(userId, deviceId, ipAddress) {
    const sessionId = crypto.randomUUID();
    const session = {
      sessionId,
      userId,
      deviceId,
      ipAddress,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true,
    };

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  static verifySession(sessionId, userId) {
    const session = this.sessions.get(sessionId);

    if (!session) {
      return { valid: false, error: 'Session not found' };
    }

    if (session.userId !== userId) {
      return { valid: false, error: 'User mismatch' };
    }

    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return { valid: false, error: 'Session expired' };
    }

    if (!session.isActive) {
      return { valid: false, error: 'Session inactive' };
    }

    return { valid: true, session };
  }

  static revokeSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.set(sessionId, session);
    }
  }

  static getUserSessions(userId) {
    return Array.from(this.sessions.values()).filter(
      (session) => session.userId === userId && session.isActive
    );
  }

  static clearExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = {
  PasswordService,
  TokenService,
  VerificationService,
  SessionService,
};
