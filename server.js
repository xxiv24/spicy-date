const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const TelegramBot = require('node-telegram-bot-api');

const app = express();
app.use(express.json());
app.use(cors());

// ۱. متغیرهای محیطی و پیکربندی اولیه
const MONGO_URI = process.env.MONGO_URI;
const BOT_TOKEN = process.env.BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET || 'spicy_secret_key_2026';
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://your-app-url.netlify.app';

// راه‌اندازی ربات تلگرام (بدون Polling زاید)
let bot = null;
if (BOT_TOKEN) {
    bot = new TelegramBot(BOT_TOKEN, { polling: false });
}

// ۲. اتصال به دیتابیس MongoDB
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB Connected Successfully'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
} else {
    console.warn('⚠️ MONGO_URI تعریف نشده است. اتصال دیتابیس برقرار نشد.');
}

// ۳. مدل کاربر در دیتابیس
const UserSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    firstName: String,
    username: String,
    age: { type: Number, default: 22 },
    city: { type: String, default: 'بندرعباس' },
    photo: String,
    isVip: { type: Boolean, default: false },
    likes: [{ type: Number }], // لیست ID کسانی که لایک کرده
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

// ۴. اعتبارسنجی داده‌های تلگرام
function verifyTelegramData(initData) {
    if (!initData || !BOT_TOKEN) return false;
    try {
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
    } catch (e) {
        return false;
    }
}

// ۵. اندپوینت ورود / ثبت‌نام
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

// ۶. دریافت پیشنهاد کاربران برای کارت‌های اکسپلور
app.get('/likes/suggested/:telegramId', async (req, res) => {
    try {
        const currentId = Number(req.params.telegramId);
        
        // دریافت کاربران غیر از کاربر فعلی
        const users = await User.find({ telegramId: { $ne: currentId } }).limit(20);
        
        const formattedUsers = users.map(u => ({
            telegram_id: u.telegramId,
            name: u.firstName || 'کاربر اسپایسی',
            age: u.age,
            city: u.city,
            photo: u.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'
        }));

        res.json(formattedUsers);
    } catch (err) {
        res.status(500).json({ error: 'خطا در دریافت کاربران' });
    }
});

// ۷. اندپوینت ثبت لایک و ارسال نوتیفیکیشن
app.post('/likes/add/:fromUser/:toUser', async (req, res) => {
    try {
        const fromUser = Number(req.params.fromUser);
        const toUser = Number(req.params.toUser);

        // بروزرسانی لایک در دیتابیس
        await User.updateOne(
            { telegramId: fromUser },
            { $addToSet: { likes: toUser } }
        );

        // ارسال پیام تلگرامی به شخص دریافت‌کننده لایک
        if (bot) {
            bot.sendMessage(toUser, "🔥 **یک نفر شما را لایک کرد!**\nهمین حالا وارد مینی‌اپ شوید و ببینید چه کسی است.", {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: "🚀 باز کردن Spicy Date", web_app: { url: WEBAPP_URL } }
                    ]]
                }
            }).catch(err => console.log("Telegram notification notice:", err.message));
        }

        res.json({ success: true, message: 'لایک با موفقیت ثبت شد.' });
    } catch (err) {
        res.status(500).json({ error: 'خطا در ثبت لایک' });
    }
});

// ۸. حذف لایک
app.delete('/likes/remove/:fromUser/:toUser', async (req, res) => {
    try {
        const fromUser = Number(req.params.fromUser);
        const toUser = Number(req.params.toUser);

        await User.updateOne(
            { telegramId: fromUser },
            { $pull: { likes: toUser } }
        );

        res.json({ success: true, message: 'لایک حذف شد.' });
    } catch (err) {
        res.status(500).json({ error: 'خطا در حذف لایک' });
    }
});

// ۹. اجرای سرور
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Spicy Date Server running on port ${PORT}`);
});
