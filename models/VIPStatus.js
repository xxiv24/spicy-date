const mongoose = require('mongoose');

const vipStatusSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  plan: {
    type: String,
    enum: ['monthly', 'yearly', 'lifetime'],
  },
  startDate: Date,
  expiresAt: Date,
  autoRenew: {
    type: Boolean,
    default: true,
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'crypto'],
  },
  transactionId: String,
  visibilityMultiplier: {
    type: Number,
    default: 3,
  },
  features: [{
    type: String,
    enum: ['unlimited_likes', 'night_mask', 'ad_free', 'priority_match', 'see_likes', 'rewind'],
  }],
  price: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  cancellationDate: Date,
  cancellationReason: String,
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

vipStatusSchema.index({ userId: 1 });
vipStatusSchema.index({ expiresAt: 1 });
vipStatusSchema.index({ isActive: 1 });

module.exports = mongoose.model('VIPStatus', vipStatusSchema);
