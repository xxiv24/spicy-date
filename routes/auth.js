const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware: Verify token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'No token' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
}

// Get profile
router.get('/profile', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.userId,
      firstName: 'User',
      email: 'user@example.com'
    }
  });
});

// Update profile
router.post('/profile', verifyToken, (req, res) => {
  const { firstName, bio, age, gender } = req.body;
  
  res.json({
    success: true,
    message: 'Profile updated',
    data: {
      userId: req.userId,
      firstName,
      bio,
      age,
      gender
    }
  });
});

// Get discover users
router.get('/discover', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: [
      { 
        userId: 'user1', 
        firstName: 'John', 
        age: 25, 
        gender: 'male' 
      },
      { 
        userId: 'user2', 
        firstName: 'Jane', 
        age: 23, 
        gender: 'female' 
      }
    ]
  });
});

// Send message
router.post('/chats/message', verifyToken, (req, res) => {
  const { receiverId, message } = req.body;
  
  if (!receiverId || !message) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing fields' 
    });
  }
  
  res.json({
    success: true,
    message: 'Message sent',
    data: {
      sender: req.userId,
      receiver: receiverId,
      text: message,
      timestamp: new Date()
    }
  });
});

// Get chats
router.get('/chats', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: []
  });
});

// VIP status
router.get('/vip/status', verifyToken, (req, res) => {
  res.json({
    success: true,
    data: {
      isVIP: false,
      plan: null
    }
  });
});

// Health
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'API running' });
});

module.exports = router;
