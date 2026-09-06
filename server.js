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
const WEBAPP_URL = process.env.WEBAPP_URL || 'https://spicy-date.onrender.com';

// راه‌اندازی ربات تلگرام
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

// ۳. مدل کامل کاربر در دیتابیس
const UserSchema = new mongoose.Schema({
    telegramId: { type: Number, required: true, unique: true },
    firstName: String,
    username: String,
    age: { type: Number, default: 22 },
    gender: { type: String, default: 'female' },
    city: { type: String, default: 'بندرعباس' },
    bio: { type: String, default: '' },
    photo: String,
    isVip: { type: Boolean, default: false },
    likes: [{ type: Number }],
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

// ۶. دریافت اطلاعات کامل پروفایل کاربر
app.get('/api/user/:telegramId', async (req, res) => {
    try {
        const telegramId = Number(req.params.telegramId);
        let user = await User.findOne({ telegramId });
        
        if (!user) {
            user = await User.create({ telegramId });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ۷. ذخیره دائمی تغییرات پروفایل (جنسیت، شهر، بیوگرافی)
app.post('/api/user/update', async (req, res) => {
    try {
        const { telegramId, gender, city, bio } = req.body;
        
        await User.updateOne(
            { telegramId: Number(telegramId) },
            { $set: { gender, city, bio } },
            { upsert: true }
        );

        res.json({ success: true, message: 'اطلاعات با موفقیت ذخیره شد.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ۸. فعال‌سازی اکانت VIP
app.post('/api/user/vip', async (req, res) => {
    try {
        const { telegramId } = req.body;
        await User.updateOne({ telegramId: Number(telegramId) }, { $set: { isVip: true } });
        res.json({ success: true, message: 'اشتراک VIP با موفقیت فعال شد.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ۹. دریافت پیشنهادات کاربران همراه با فیلتر و داده‌های نمونه (Mock Data)
app.get('/likes/suggested/:telegramId', async (req, res) => {
    try {
        const currentId = Number(req.params.telegramId);
        const { gender, city } = req.query;

        let query = { telegramId: { $ne: currentId } };

        if (gender && gender !== 'all') {
            query.gender = gender;
        }
        if (city && city !== 'all') {
            query.city = city;
        }

        let users = await User.find(query).limit(20);

        // اگر دیتابیس خالی بود، کارت‌های نمونه نشان داده می‌شوند
        if (users.length === 0) {
            users = [
                { telegramId: 101, firstName: 'سارا', age: 23, city: 'بندرعباس', gender: 'female', bio: 'علاقه‌مند به موزیک و عکاسی 📸', photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500' },
                { telegramId: 102, firstName: 'مریم', age: 25, city: 'تهران', gender: 'female', bio: 'علاقه‌مند به سفر و کافه‌گردی ☕', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500' },
                { telegramId: 103, firstName: 'علی', age: 27, city: 'بندرعباس', gender: 'male', bio: 'برنامه‌نویس و عاشق تکنولوژی 💻', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500' }
            ];
        }

        const formattedUsers = users.map(u => ({
            telegram_id: u.telegramId,
            name: u.firstName || 'کاربر اسپایسی',
            age: u.age || 22,
            gender: u.gender || 'female',
            city: u.city || 'بندرعباس',
            bio: u.bio || 'چیزی ثبت نشده است.',
            photo: u.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'
        }));

        res.json(formattedUsers);
    } catch (err) {
        res.status(500).json({ error: 'خطا در دریافت کاربران' });
    }
});

// ۱۰. دریافت لیست علاقه‌مندی‌ها
app.get('/likes/favorites/:telegramId', async (req, res) => {
    try {
        const currentId = Number(req.params.telegramId);
        const currentUser = await User.findOne({ telegramId: currentId });

        if (!currentUser || !currentUser.likes || currentUser.likes.length === 0) {
            return res.json([]);
        }

        const favoriteUsers = await User.find({ telegramId: { $in: currentUser.likes } });

        const result = favoriteUsers.map(u => ({
            telegram_id: u.telegramId,
            name: u.firstName || 'کاربر اسپایسی',
            username: u.username || '',
            city: u.city || 'بندرعباس',
            photo: u.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'
        }));

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'خطا در دریافت علاقه‌مندی‌ها' });
    }
});

// ۱۱. ثبت لایک و ارسال نوتیفیکیشن تلگرام
app.post('/likes/add/:fromUser/:toUser', async (req, res) => {
    try {
        const fromUser = Number(req.params.fromUser);
        const toUser = Number(req.params.toUser);

        await User.updateOne(
            { telegramId: fromUser },
            { $addToSet: { likes: toUser } }
        );

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

// ۱۲. حذف لایک
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

// ۱۳. اجرای سرور
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Spicy Date Server running on port ${PORT}`);
});
