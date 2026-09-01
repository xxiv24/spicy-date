# ⚡ Quick Start - شروع سریع

## 🚀 شروع در ۵ دقیقه

### گام 1️⃣: نصب
```bash
npm install
```

### گام 2️⃣: Backend را شروع کنید
```bash
npm start
# یا برای development:
npm run dev
```

**Output:**
```
╔════════════════════════════════════════╗
║  🌶️  SPICY DATE BACKEND RUNNING 🌶️    ║
║  Server: http://localhost:5000         ║
║  Status: ✅ Ready                       ║
╚════════════════════════════════════════╝
```

### گام 3️⃣: Frontend را باز کنید
```bash
# Option 1: Direct
open spicy-date-improved.html

# Option 2: Live Server
python -m http.server 8000
# سپس به http://localhost:8000 برید
```

### گام 4️⃣: تست کنید ✅
- صفحه بارگذاری شده؟ ✅
- دکمه "ورود تلگرام" نمایش داده می‌شود؟ ✅
- می‌توانید پروفایل ایجاد کنید؟ ✅

---

## 📱 استفاده از Telegram Web App

### روش 1: Telegram Bot
```bash
# Bot Token دریافت کنید (@BotFather)
# در .env تنظیم کنید:
TELEGRAM_BOT_TOKEN=your_token_here
```

### روش 2: Inline Mode
```
https://t.me/YourBot/app?startapp=test
```

### روش 3: Local Testing
```bash
# Direct file
file:///path/to/spicy-date-improved.html

# HTTP Server
http://localhost:8000/spicy-date-improved.html
```

---

## 🎮 تست سریع بازی‌ها

```javascript
// Console میں اجرا کنید:

// ۱. Tic-Tac-Toe
openTicTacToe()

// ۲. Rock-Paper-Scissors
openRpsGame()

// ۳. Personality Test
openPersonalityTest()

// ۴. Truth or Dare
openTruthOrDare()
```

---

## 🔧 تنظیمات دیتابیس

### Option 1: In-Memory (Default)
صرفاً اجرا کنید - بدون نصب اضافی!

### Option 2: MongoDB

#### با Docker:
```bash
docker run -d -p 27017:27017 --name mongo mongo:latest
```

#### بدون Docker:
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu
sudo apt-get install -y mongodb
sudo systemctl start mongodb

# Windows
choco install mongodb
```

---

## 🌐 API Endpoints (برای تست)

```bash
# Health Check
curl http://localhost:5000/api/health

# Create Profile
curl -X POST http://localhost:5000/api/profile/create \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 123,
    "name": "علی",
    "age": 25,
    "city": "تهران",
    "interests": ["🎮 گیمینگ", "☕ کافه‌گردی", "🎧 موسیقی"]
  }'

# Discover Users
curl http://localhost:5000/api/users/discover?userId=123
```

---

## 📁 ساختار مجدد

```
✅ spicy-date-improved.html    ← صفحه اصلی
✅ app.js                      ← Frontend Logic
✅ server.js                   ← Backend API
✅ package.json                ← Dependencies
✅ README.md                   ← Documentation
✅ DEPLOYMENT.md              ← Production Guide
✅ QUICKSTART.md             ← این فایل!
```

---

## 🎨 سفارشی کردن

### تغییر رنگ‌ها
`spicy-date-improved.html` میں:
```css
/* Primary Color */
--primary: #ff3b5c;  /* Red/Pink */

/* Secondary Color */
--secondary: #a855f7;  /* Purple */

/* Background */
--bg: #0f0c20;  /* Dark */
```

### تغییر نام برنامه
```html
<h1>نام جدید 🌶️</h1>
```

### افزودن بازی جدید
```javascript
// app.js میں:
function openNewGame() {
    document.getElementById('new-game-modal').classList.remove('hidden');
    // ... logic
}
```

---

## 🐛 مشکلات رایج

### ❌ "Cannot POST /api/profile/create"
**حل**: 
- Backend فعال است؟ (npm start)
- Port ۵۰۰۰ صحیح است؟

### ❌ "CORS Error"
**حل**:
```javascript
// server.js میں
app.use(cors({
  origin: '*',
  credentials: true
}));
```

### ❌ "Microphone permission denied"
**حل**:
- استفاده از HTTPS (localhost نیست)
- Browser permission دهید

### ❌ "localStorage is undefined"
**حل**:
- Private mode خاموش کنید
- Local server استفاده کنید

---

## ⚙️ Environment Variables

```bash
# .env ایجاد کنید
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/spicy-date
TELEGRAM_BOT_TOKEN=your_token
```

---

## 📊 Monitoring

```bash
# Real-time logs
npm run dev

# Process status
pm2 list

# Memory usage
ps aux | grep node

# Port usage
lsof -i :5000
```

---

## 🎯 Next Steps

- [ ] Telegram Bot Integration
- [ ] Database Setup (MongoDB)
- [ ] User Authentication
- [ ] WebSocket Chat
- [ ] Payment Integration
- [ ] Production Deployment

---

## 💡 Tips & Tricks

### Debug Mode
```javascript
// Console میں
window.DEBUG = true;

// Detailed logs
console.log('🐛 Debug:', state);
```

### Test Users
```javascript
// Fake login
state.userId = 123;
state.userProfile = {
  name: 'Test User',
  age: 25,
  city: 'Tehran',
  interests: ['🎮', '☕', '🎧']
};
```

### Database Inspection
```bash
# MongoDB
mongo
> use spicy-date
> db.users.find()
```

---

## 📞 صورت شماره (Issues)

**API نتائج نمی‌دهد؟**
```bash
# Check server
curl http://localhost:5000/api/health
```

**Frontend load نمی‌شود؟**
```bash
# Check browser console
F12 → Console → Check errors
```

**LocalStorage نکار کار نمی‌کند؟**
```bash
# Check privacy settings
localStorage.setItem('test', '1');
localStorage.getItem('test');
```

---

## ✨ احتفالات!

🎉 اگر همه چیز کام کرد:
- [ ] صفحه بارگذاری شده ✅
- [ ] پروفایل ایجاد شد ✅
- [ ] بازی‌ها کار می‌کنند ✅
- [ ] API پاسخ می‌دهد ✅

**آماده برای Production? 🚀**

```bash
npm install -g pm2
pm2 start server.js
pm2 save
```

---

**نسخه**: 1.0.0  
**حالت**: Ready to use ✅

سوالات? 💬 GitHub Issues یا Email!
