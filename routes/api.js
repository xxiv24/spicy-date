const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/security');
const {
  validateProfileCreate,
  validateMessage,
  validatePagination,
  validateUserId,
  validateVIPPurchase,
} = require('../validators/inputValidator');
const Logger = require('../utils/logger');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Chat = require('../models/Chat');
const Interaction = require('../models/Interaction');
const VIPStatus = require('../models/VIPStatus');

// ============================================
// PROFILE ROUTES
// ============================================

router.post('/profile', verifyToken, validateProfileCreate, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { firstName, lastName, bio, age, gender, interests, location } = req.body;

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      {
        userId,
        firstName,
        lastName,
        bio,
        age,
        gender,
        interests,
        location,
        updatedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    Logger.info('Profile updated', { userId });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    Logger.error('Profile update error', error);
    next(error);
  }
});

router.get('/profile', verifyToken, async (req, res, next) => {
  try {
    const userId = req.userId;

    const profile = await UserProfile.findOne({ userId }).select('-__v');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        code: 'PROFILE_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    Logger.error('Get profile error', error);
    next(error);
  }
});

router.get('/profile/:userId', verifyToken, validateUserId, async (req, res, next) => {
  try {
    const { userId } = req.params;

    const profile = await UserProfile.findOne({ userId }).select('-__v');

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
        code: 'PROFILE_NOT_FOUND',
      });
    }

    // Increment view count
    profile.views += 1;
    await profile.save();

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    Logger.error('Get profile error', error);
    next(error);
  }
});

// ============================================
// DISCOVER ROUTES
// ============================================

router.get('/discover', verifyToken, validatePagination, async (req, res, next) => {
  try {
    const userId = req.userId;
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;

    const users = await UserProfile.find({ userId: { $ne: userId } })
      .limit(limit)
      .skip(skip)
      .select('-__v')
      .lean();

    const total = await UserProfile.countDocuments({ userId: { $ne: userId } });

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    Logger.error('Discover error', error);
    next(error);
  }
});

// ============================================
// INTERACTION ROUTES
// ============================================

router.post('/interactions/action', verifyToken, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { targetUserId, action } = req.body;

    if (!['like', 'pass', 'super_like', 'block'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action',
        code: 'INVALID_ACTION',
      });
    }

    const interaction = await Interaction.create({
      fromUser: userId,
      toUser: targetUserId,
      action,
      createdAt: new Date(),
    });

    Logger.info('Interaction recorded', {
      fromUser: userId,
      toUser: targetUserId,
      action,
    });

    res.json({
      success: true,
      message: 'Action recorded',
      data: interaction,
    });
  } catch (error) {
    Logger.error('Interaction error', error);
    next(error);
  }
});

// ============================================
// CHAT ROUTES
// ============================================

router.get('/chats', verifyToken, async (req, res, next) => {
  try {
    const userId = req.userId;

    const chats = await Chat.find({
      participants: userId,
      isActive: true,
    })
      .populate('participants', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .select('-__v')
      .lean();

    res.json({
      success: true,
      data: chats,
    });
  } catch (error) {
    Logger.error('Get chats error', error);
    next(error);
  }
});

router.get('/chats/:userId', verifyToken, async (req, res, next) => {
  try {
    const myUserId = req.userId;
    const { userId } = req.params;

    const chat = await Chat.findOne({
      participants: { $all: [myUserId, userId] },
    })
      .populate('messages.sender', 'firstName lastName')
      .sort({ 'messages.createdAt': -1 });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
        code: 'CHAT_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: chat,
    });
  } catch (error) {
    Logger.error('Get chat error', error);
    next(error);
  }
});

router.post('/chats/message', verifyToken, validateMessage, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { receiverId, message } = req.body;

    let chat = await Chat.findOne({
      participants: { $all: [userId, receiverId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [userId, receiverId],
        messages: [],
      });
    }

    const newMessage = {
      sender: userId,
      text: message,
      createdAt: new Date(),
      read: false,
    };

    chat.messages.push(newMessage);
    chat.lastMessage = {
      text: message,
      sender: userId,
      createdAt: new Date(),
    };
    chat.updatedAt = new Date();
    await chat.save();

    Logger.info('Message sent', {
      from: userId,
      to: receiverId,
    });

    res.json({
      success: true,
      message: 'Message sent',
      data: newMessage,
    });
  } catch (error) {
    Logger.error('Send message error', error);
    next(error);
  }
});

// ============================================
// VIP ROUTES
// ============================================

router.get('/vip/status', verifyToken, async (req, res, next) => {
  try {
    const userId = req.userId;

    const vipStatus = await VIPStatus.findOne({ userId });

    if (!vipStatus || !vipStatus.isActive) {
      return res.json({
        success: true,
        data: {
          isVIP: false,
          plan: null,
          expiresAt: null,
        },
      });
    }

    res.json({
      success: true,
      data: {
        isVIP: true,
        plan: vipStatus.plan,
        expiresAt: vipStatus.expiresAt,
        features: vipStatus.features,
      },
    });
  } catch (error) {
    Logger.error('Get VIP status error', error);
    next(error);
  }
});

router.post('/vip/purchase', verifyToken, validateVIPPurchase, async (req, res, next) => {
  try {
    const userId = req.userId;
    const { planId, paymentMethod } = req.body;

    const prices = {
      monthly: 9.99,
      yearly: 99.99,
    };

    const duration = {
      monthly: 30,
      yearly: 365,
    };

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration[planId]);

    let vipStatus = await VIPStatus.findOne({ userId });

    if (!vipStatus) {
      vipStatus = await VIPStatus.create({
        userId,
        isActive: true,
        plan: planId,
        startDate: new Date(),
        expiresAt,
        paymentMethod,
        price: prices[planId],
        features: ['unlimited_likes', 'night_mask', 'ad_free', 'priority_match'],
      });
    } else {
      vipStatus.isActive = true;
      vipStatus.plan = planId;
      vipStatus.startDate = new Date();
      vipStatus.expiresAt = expiresAt;
      vipStatus.paymentMethod = paymentMethod;
      vipStatus.price = prices[planId];
      await vipStatus.save();
    }

    Logger.info('VIP purchased', {
      userId,
      plan: planId,
    });

    res.json({
      success: true,
      message: 'VIP subscription successful',
      data: vipStatus,
    });
  } catch (error) {
    Logger.error('VIP purchase error', error);
    next(error);
  }
});

// ============================================
// HEALTH CHECK
// ============================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
