# 🌶️ Spicy Date - Modern Telegram Dating App

برنامه پیشرفته دوست‌یابی با بازی‌های ۲ نفره برای تلگرام

## ✨ ویژگی‌ها

### 🎯 صفحات اصلی
- **🌶️ Explore Feed**: بازدید از پروفایل‌های دیگران
- **💬 Chats**: مدیریت مکالمات فعال
- **🌙 Night Mask**: چت ناشناس شبانه (VIP)
- **🎮 Mini Games**: بازی‌های تعاملی
- **👤 Profile**: مدیریت پروفایل و VIP

### 🎮 بازی‌های موجود
1. **🔥 جرأت یا حقیقت** (Truth or Dare)
   - ۱۰ دقیقه چت فعال
   - سوالات متقابل
   - تبدیل به چت دائمی

2. **🧠 تست شخصیت‌شناسی** (Personality Test)
   - محاسبه درصد تطابق
   - سوالات مختلف
   - نمایش نتیجه

3. **❌⭕ دوز نئونی** (Tic-Tac-Toe)
   - بازی آنلاین
   - هوش مصنوعی (AI Opponent)
   - انیمیشن‌های جذاب

4. **✂️ سنگ، کاغذ، قیچی** (Rock-Paper-Scissors)
   - بازی ۳ امتیازی
   - رقابت تا پایان
   - محاسبه امتیاز

### ⭐ سیستم VIP
- دیده شدن ۳ برابر بیشتر
- دسترسی کامل به Night Mask Chat
- دسترسی به بازی‌های VIP
- نشان تایید شده

## 🚀 نحوه نصب و اجرا

### پیش‌نیازها
- Node.js v14+
- npm یا yarn
- Telegram Bot Token (برای پیاده‌سازی کامل)

### گام‌های نصب

#### 1. Clone یا Download پروژه
```bash
git clone https://github.com/yourusername/spicy-date.git
cd spicy-date
```

#### 2. نصب Dependencies
```bash
npm install
```

#### 3. ایجاد فایل `.env`
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/spicy-date
TELEGRAM_BOT_TOKEN=your_token_here
```

#### 4. اجرای Backend
```bash
# حالت development (with nodemon)
npm run dev

# یا حالت production
npm start
```

#### 5. باز کردن HTML
- فایل `spicy-date-improved.html` را در مرورگر باز کنید
- یا از سرور ایستا (Static Server) استفاده کنید

```bash
# استفاده از Python
python -m http.server 8000

# یا استفاده از Live Server (VS Code)
```

## 📁 ساختار پروژه

```
spicy-date/
├── server.js                      # Backend Express
├── app.js                        # Frontend JavaScript
├── spicy-date-improved.html      # صفحه اصلی
├── package.json                  # Dependencies
├── uploads/
│   └── voices/                   # فایل‌های صوتی
└── README.md                     # این فایل
```

## 🔌 API Endpoints

### مدیریت پروفایل
- `POST /api/profile/create` - ایجاد/بروزرسانی پروفایل
- `POST /api/profile/upload-voice` - آپلود صدا

### Discover
- `GET /api/users/discover` - بارگذاری کاربران

### Interactions
- `POST /api/interactions/action` - ثبت action (like/pass/etc)

### Night Chat
- `POST /api/night-chat/match` - یافتن پارتنر

### Chats
- `GET /api/chats/:userId` - دریافت لیست چت‌ها

### VIP
- `POST /api/vip/purchase` - خریدVIP

## 💡 نکات مهم

### LocalStorage
برنامه از LocalStorage برای ذخیره اطلاعات کاربر استفاده می‌کند:
- `spicyProfile` - اطلاعات پروفایل
- `userVip` - وضعیت VIP

### Authentication
- هویت کاربر از Telegram Web App API گرفته می‌شود
- هر کاربر دارای `userId` منحصر است

### Error Handling
- تمام API calls در try-catch قرار دارند
- Toast messages برای بازخورد کاربر
- Error logging به console

## 🎨 تنظیمات طراحی

### رنگ‌ها
- **Primary**: Red/Orange (#ff3b5c, #ff6b00)
- **Secondary**: Purple (#a855f7)
- **Dark Background**: #0f0c20
- **VIP**: Amber (#fbbf24)

### فونت
- System UI
- -apple-system
- San-serif

## 🔐 امنیت

### توصیه‌های ایمنی
1. Validate تمام ورودی‌ها در backend
2. استفاده از HTTPS در production
3. Rate limiting برای API calls
4. Sanitize user input
5. استفاده از environment variables برای secrets

## 🧪 تست

### سناریوهای تست

```javascript
// Test 1: ورود و ایجاد پروفایل
1. باز کردن صفحه
2. کلیک بر دکمه "ورود به تلگرام"
3. تکمیل فرم پروفایل
4. انتخاب ۳ علاقه‌مندی
5. ضبط صدا
6. ذخیره

// Test 2: بازی دوز
1. رفتن به تب بازی‌ها
2. انتخاب "دوز نئونی"
3. انجام ۳ حرکت
4. بررسی برنده

// Test 3: Night Chat (VIP)
1. خریدVIP
2. رفتن به Night Chat
3. انتخاب جنسیت
4. جستجو و اتصال
```

## 📱 Responsive Design

- ✅ Mobile (۳۸۰px)
- ✅ Tablet (۷۶۸px)
- ✅ Desktop (۱۰۲۴px+)
- ✅ Touch-optimized
- ✅ RTL Support (فارسی)

## 🐛 مشکلات شناخته شده

### معمول
- Local API calls نیاز به CORS دارند
- صدا فقط روی localhost کار می‌کند
- localStorage محدود به ۵-۱۰ MB است

### راه‌حل
- استفاده از HTTPS برای production
- میکروفون permission مورد نیاز است
- IndexedDB برای داده‌های بیشتر

## 🔮 ویژگی‌های آینده

- [ ] WebSocket برای Real-time Chat
- [ ] Photo Upload
- [ ] Video Call
- [ ] Group Chats
- [ ] Advanced Matching Algorithm
- [ ] Push Notifications
- [ ] Analytics Dashboard
- [ ] Admin Panel

## 📞 تماس و پشتیبانی

- 📧 Email: support@spicydate.com
- 🐛 Bug Report: issues@spicydate.com
- 💬 Telegram: @SpicyDateBot

## 📄 لایسنس

MIT License - برای استفاده آزاد

## 🙏 تشکر

تشکر از تمام contributors و کاربران که به بهبود این پروژه کمک می‌کنند!

---

**نسخه**: 1.0.0  
**آخرین آپدیت**: آگوست 2024  
**وضعیت**: ✅ فعال و در حال توسعه

🌶️ **Enjoy Spicy Dates!** 🌶️
