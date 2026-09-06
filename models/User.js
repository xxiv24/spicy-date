const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    unique: true,
    sparse: true,
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    select: false,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
  },
  phone: {
    type: String,
    sparse: true,
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    select: false,
  },
  verificationTokenExpiry: {
    type: Date,
    select: false,
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpiry: {
    type: Date,
    select: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  blockedUntil: {
    type: Date,
  },
  lastLogin: {
    type: Date,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  maxLoginAttempts: {
    type: Number,
    default: 5,
  },
  lockUntil: {
    type: Date,
  },
  profileVisits: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ telegramId: 1 });
userSchema.index({ createdAt: -1 });

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Method to increment login attempts
userSchema.methods.incLoginAttempts = function() {
  if (this.maxLoginAttempts && this.maxLoginAttempts <= this.loginAttempts + 1) {
    this.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
  }
  this.loginAttempts += 1;
  return this.save();
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
