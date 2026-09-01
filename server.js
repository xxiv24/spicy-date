const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// توکن ربات تلگرام و کلید محرمانه
const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_TELEGRAM_BOT_TOKEN";
const JWT_SECRET = process.env.JWT_SECRET || "YOUR_SECRET_KEY";

// ۱. اعتبارسنجی داده‌های تلگرام
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

// ۲. اندپوینت ورود
app.post('/api/auth/telegram', (req, res) => {
    const { initData } = req.body;

    const isValid = verifyTelegramData(initData);
    if (!isValid) {
        return res.status(401).json({ error: 'اعتبارسنجی تلگرام ناموفق بود!' });
    }

    const urlParams = new URLSearchParams(initData);
    const userData = JSON.parse(urlParams.get('user'));

    const token = jwt.sign(
        { telegramId: userData.id, username: userData.username },
        JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.json({
        success: true,
        token,
        user: {
            telegramId: userData.id,
            firstName: userData.first_name,
            lastName: userData.last_name,
            username: userData.username
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Spicy Date Server running on port ${PORT}`);
});
