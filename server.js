// ==================== Spicy Date Backend ====================
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// ==================== Middleware ====================

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Setup untuk upload file
const upload = multer({ dest: 'uploads/voices/' });
if (!fs.existsSync('uploads/voices')) {
    fs.mkdirSync('uploads/voices', { recursive: true });
}

// ==================== Database Connection ====================

// استفاده از MongoDB Local یا In-Memory (برای Demo)
const users = {}; // Temporary in-memory database
const interactions = {};
const matches = {};

// ==================== Models/Schemas ====================

class User {
    constructor(userId, name, age, city, interests, isVip = false) {
        this.userId = userId;
        this.name = name;
        this.age = age;
        this.city = city;
        this.interests = interests;
        this.isVip = isVip;
        this.createdAt = new Date();
        this.profileImage = this.getRandomImage();
        this.voiceFile = null;
    }

    getRandomImage() {
        const images = [
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600',
            'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600',
            'https://images.unsplash.com/photo-1539571696357-5a69c006ae6f?w=600',
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600',
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600'
        ];
        return images[Math.floor(Math.random() * images.length)];
    }
}

// ==================== Routes ====================

// ROOT
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// HEALTH CHECK
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// ==================== API مدیریت پروفایل ====================

app.post('/api/profile/create', (req, res) => {
    try {
        const { userId, name, age, city, interests } = req.body;

        // تایید ورودی‌ها
        if (!userId || !name || !age || !city || !interests || interests.length !== 3) {
            return res.status(400).json({
                success: false,
                message: 'اطلاعات ناقص است'
            });
        }

        if (age < 18 || age > 100) {
            return res.status(400).json({
                success: false,
                message: 'سن باید بین ۱۸ تا ۱۰۰ باشد'
            });
        }

        // ایجاد یا بروزرسانی کاربر
        const user = new User(userId, name, age, city, interests);
        users[userId] = user;

        res.json({
            success: true,
            message: 'پروفایل با موفقیت ایجاد شد',
            user: user
        });

    } catch (err) {
        console.error('Profile create error:', err);
        res.status(500).json({
            success: false,
            message: 'خطا در ایجاد پروفایل'
        });
    }
});

app.post('/api/profile/upload-voice', upload.single('audio'), (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId || !req.file) {
            return res.status(400).json({ success: false, message: 'خطای آپلود' });
        }

        if (users[userId]) {
            users[userId].voiceFile = req.file.path;
        }

        res.json({
            success: true,
            message: 'صدا با موفقیت آپلود شد',
            filePath: req.file.path
        });

    } catch (err) {
        console.error('Voice upload error:', err);
        res.status(500).json({ success: false, message: 'خطا در آپلود صدا' });
    }
});

// ==================== API Discover (Feed) ====================

app.get('/api/users/discover', (req, res) => {
    try {
        const { userId } = req.query;

        // فیلتر کردن کاربران (حذف خود کاربر و افرادی که قبلاً action گرفته‌اند)
        const availableUsers = Object.values(users)
            .filter(u => u.userId !== userId)
            .filter(u => !interactions[`${userId}_${u.userId}`])
            .slice(0, 10);

        res.json({
            success: true,
            users: availableUsers.map(u => ({
                id: u.userId,
                name: u.name,
                age: u.age,
                city: u.city,
                interests: u.interests,
                profileImage: u.profileImage,
                isVip: u.isVip,
                hasVoice: !!u.voiceFile
            }))
        });

    } catch (err) {
        console.error('Discover error:', err);
        res.status(500).json({ success: false, message: 'خطا در بارگذاری کاربران' });
    }
});

// ==================== API Interactions ====================

app.post('/api/interactions/action', (req, res) => {
    try {
        const { userId, targetUserId, action } = req.body;

        // ثبت interaction
        const key = `${userId}_${targetUserId}`;
        interactions[key] = {
            from: userId,
            to: targetUserId,
            action: action,
            timestamp: new Date()
        };

        // اگر mutual like یا super بود
        if ((action === 'like' || action === 'super') && interactions[`${targetUserId}_${userId}`]) {
            const targetAction = interactions[`${targetUserId}_${userId}`].action;
            if (targetAction === 'like' || targetAction === 'super') {
                // Match ایجاد کن
                matches[`${userId}_${targetUserId}`] = {
                    user1: userId,
                    user2: targetUserId,
                    matchedAt: new Date(),
                    type: 'mutual_like'
                };
            }
        }

        res.json({
            success: true,
            message: 'action ثبت شد',
            action: action
        });

    } catch (err) {
        console.error('Interaction error:', err);
        res.status(500).json({ success: false, message: 'خطا در ثبت action' });
    }
});

// ==================== API Night Chat ====================

app.post('/api/night-chat/match', (req, res) => {
    try {
        const { userId, preferredGender } = req.body;

        // در عمل، باید matching algorithm داشت
        // اینجا یک demo ساده است
        const userList = Object.values(users).filter(u => u.userId !== userId);
        const randomPartner = userList[Math.floor(Math.random() * userList.length)];

        if (!randomPartner) {
            return res.status(404).json({
                success: false,
                message: 'پارتنری برای chat یافت نشد'
            });
        }

        // ایجاد Night Chat Session
        const sessionId = `${userId}_${randomPartner.userId}_${Date.now()}`;
        
        res.json({
            success: true,
            message: 'پارتنر یافت شد',
            sessionId: sessionId,
            partner: {
                id: randomPartner.userId,
                name: randomPartner.name,
                age: randomPartner.age,
                profileImage: randomPartner.profileImage
            },
            duration: 180 // 3 دقیقه
        });

    } catch (err) {
        console.error('Night chat error:', err);
        res.status(500).json({ success: false, message: 'خطا در matching' });
    }
});

// ==================== API Chats ====================

app.get('/api/chats/:userId', (req, res) => {
    try {
        const { userId } = req.params;

        // پیدا کردن تمام matches این کاربر
        const userMatches = Object.values(matches)
            .filter(m => m.user1 === userId || m.user2 === userId);

        const chats = userMatches.map(m => {
            const partnerId = m.user1 === userId ? m.user2 : m.user1;
            const partner = users[partnerId];

            return {
                matchId: `${m.user1}_${m.user2}`,
                partner: {
                    id: partner.userId,
                    name: partner.name,
                    profileImage: partner.profileImage
                },
                lastMessage: 'سلام! چطور می‌تونم کمکت کنم؟',
                lastMessageTime: m.matchedAt,
                unread: 0
            };
        });

        res.json({
            success: true,
            chats: chats.slice(0, 20) // آخرین ۲۰ chat
        });

    } catch (err) {
        console.error('Get chats error:', err);
        res.status(500).json({ success: false, message: 'خطا در بارگذاری چت‌ها' });
    }
});

// ==================== API VIP ====================

app.post('/api/vip/purchase', (req, res) => {
    try {
        const { userId, paymentId } = req.body;

        if (!userId || !paymentId) {
            return res.status(400).json({ success: false, message: 'اطلاعات ناقص' });
        }

        if (users[userId]) {
            users[userId].isVip = true;
            users[userId].vipExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 روز
        }

        res.json({
            success: true,
            message: 'ارتقا به VIP موفقیت‌آمیز بود',
            expiresAt: users[userId].vipExpiresAt
        });

    } catch (err) {
        console.error('VIP purchase error:', err);
        res.status(500).json({ success: false, message: 'خطا در خریدVIP' });
    }
});

// ==================== Error Handling ====================

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'خطای سروری',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'endpoint پیدا نشد'
    });
});

// ==================== Server Start ====================

app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  🌶️  SPICY DATE BACKEND RUNNING 🌶️    ║
║  Server: http://localhost:${PORT}       ║
║  Version: 1.0.0                        ║
║  Status: ✅ Ready                       ║
╚════════════════════════════════════════╝
    `);

    // Sample data برای testing
    createSampleUsers();
});

function createSampleUsers() {
    const sampleNames = ['مینا', 'سارا', 'نیلا', 'لیلا', 'پریا'];
    const sampleCities = ['تهران', 'شیراز', 'اصفهان', 'کرج', 'مشهد'];
    const sampleInterests = [
        ['🎮 گیمینگ', '☕ کافه‌گردی', '🎧 موسیقی'],
        ['🎬 فیلم و سریال', '⚽ ورزش', '✈️ سفر'],
        ['📚 مطالعه', '🎨 هنر و طراحی', '🍕 آشپزی'],
        ['💻 تکنولوژی', '🎧 موسیقی', '✈️ سفر'],
        ['☕ کافه‌گردی', '🎮 گیمینگ', '📚 مطالعه']
    ];

    for (let i = 1; i <= 10; i++) {
        const userId = 100 + i;
        const name = sampleNames[i % sampleNames.length] + ' ' + i;
        const city = sampleCities[i % sampleCities.length];
        const interests = sampleInterests[i % sampleInterests.length];
        const age = 20 + (i % 15);

        const user = new User(userId, name, age, city, interests, i % 3 === 0);
        users[userId] = user;
    }

    console.log('✅ Sample users created:', Object.keys(users).length);
}

module.exports = app;
