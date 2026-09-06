const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
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
  bio: {
    type: String,
    maxlength: 500,
    default: '',
  },
  age: {
    type: Number,
    min: 18,
    max: 100,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  location: {
    type: String,
    maxlength: 100,
  },
  coordinates: {
    latitude: Number,
    longitude: Number,
  },
  interests: [{
    type: String,
    maxlength: 50,
  }],
  photos: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  profilePhoto: {
    type: String,
  },
  voiceIntro: {
    url: String,
    duration: Number,
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0,
  },
  ratingCount: {
    type: Number,
    default: 0,
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  reportedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  views: {
    type: Number,
    default: 0,
  },
  likes: {
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

userProfileSchema.index({ userId: 1 });
userProfileSchema.index({ interests: 1 });
userProfileSchema.index({ gender: 1 });
userProfileSchema.index({ age: 1 });
userProfileSchema.index({ rating: -1 });

module.exports = mongoose.model('UserProfile', userProfileSchema);
