const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ۱. اتصال به دیتابیس MongoDB
const MONGO_URI = process.env.MONGO_URI;
const BOT_TOKEN = process.env.BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || 'spicy_secret_key_2026';

mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// مدل کاربر در دیتابیس
const UserSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    firstName: String,
    username: String,
    isVip: { type: Boolean, default: false },
    likes: [Number],
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// ۲. اعتبارسنجی داده‌های تلگرام
function verifyTelegramData(initData) {
    if (!initData) return false;
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    const paramsData = Array.from(urlParams.entries())
        .map(([key, value]) => `${key}=${value}`)
        .sort()
        .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(paramsData).digest('hex');

    return calculatedHash === hash;
}

// ۳. اندپوینت ورود / ثبت‌نام
app.post('/api/auth/telegram', async (req, res) => {
    try {
        const { initData } = req.body;
        if (!verifyTelegramData(initData)) {
            return res.status(401).json({ error: 'اعتبارسنجی تلگرام ناموفق بود!' });
        }

        const urlParams = new URLSearchParams(initData);
        const userData = JSON.parse(urlParams.get('user'));

        let user = await User.findOne({ telegramId: userData.id });
        if (!user) {
            user = await User.create({
                telegramId: userData.id,
                firstName: userData.first_name,
                username: userData.username
            });
        }

        const token = jwt.sign({ telegramId: user.telegramId }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ success: true, token, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Spicy Date Server running on port ${PORT}`);
});
