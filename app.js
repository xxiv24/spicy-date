// ==========================================
// Spicy Date 🌶️ - Complete Application Engine
// ==========================================

const API_BASE_URL = 'https://spicy-date-api.onrender.com'; // آدرس سرور API شما

let currentUser = null;
let currentProfiles = [];
let currentProfileIndex = 0;

// ۱. احراز هویت با تلگرام و دریافت توکن
async function authenticateUser() {
    if (!window.Telegram?.WebApp?.initData) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initData: window.Telegram.WebApp.initData })
        });

        const data = await response.json();
        if (data.success) {
            localStorage.setItem('spicy_token', data.token);
            currentUser = data.user;
            console.log("ورود موفقیت‌آمیز کاربر:", currentUser);
            loadProfiles();
        }
    } catch (err) {
        console.error("خطا در ارتباط با API:", err);
        // لود کردن دمو در صورت قطعی شبکه
        loadProfiles();
    }
}

// ۲. دریافت لیست پروفایل‌ها
async function loadProfiles() {
    // داده‌های نمونه برای تست کامل UI
    currentProfiles = [
        {
            id: "1",
            name: "سارا",
            age: 23,
            city: "تهران",
            isVip: true,
            tags: ["کافه‌گردی", "موسیقی", "سفر"],
            image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop"
        },
        {
            id: "2",
            name: "آنا",
            age: 21,
            city: "شیراز",
            isVip: false,
            tags: ["عکاسی", "هنر", "سینما"],
            image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop"
        },
        {
            id: "3",
            name: "مریم",
            age: 25,
            city: "اصفهان",
            isVip: true,
            tags: ["ورزش", "کتاب", "طبیعت"],
            image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop"
        }
    ];
    
    currentProfileIndex = 0;
    renderCurrentProfile();
}

// ۳. رندر کردن کارت فعلی
function renderCurrentProfile() {
    if (currentProfileIndex >= currentProfiles.length) {
        showNoMoreProfiles();
        return;
    }

    const profile = currentProfiles[currentProfileIndex];
    
    // پیدا کردن یا ساخت عناصر متنی و تصویری
    const nameAgeElem = document.querySelector('.profile-info h2, .user-name-age');
    const cityElem = document.querySelector('.profile-location, .user-city');
    const cardElem = document.querySelector('.card, .explore-card, main > div:first-child');

    if (nameAgeElem) nameAgeElem.textContent = `${profile.name}، ${profile.age}`;
    if (cityElem) cityElem.textContent = `📍 ${profile.city}`;
    
    if (cardElem && profile.image) {
        const imgElem = cardElem.querySelector('img');
        if (imgElem) {
            imgElem.src = profile.image;
        } else {
            cardElem.style.backgroundImage = `url('${profile.image}')`;
            cardElem.style.backgroundSize = 'cover';
            cardElem.style.backgroundPosition = 'center';
        }
    }
}

// ۴. مدیریت اکشن‌های لایک / رد با انیمیشن و هپتیک
async function handleAction(actionType) {
    if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(actionType === 'like' ? 'heavy' : 'medium');
    }

    if (currentProfileIndex >= currentProfiles.length) return;

    const targetUser = currentProfiles[currentProfileIndex];
    console.log(`اکشن ${actionType} برای:`, targetUser.name);

    // انیمیشن سواپ
    const cardElem = document.querySelector('.card, .explore-card, main > div:first-child');
    if (cardElem) {
        cardElem.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        const moveX = (actionType === 'like' || actionType === 'superlike') ? 120 : -120;
        const rotate = (actionType === 'like' || actionType === 'superlike') ? 15 : -15;
        
        cardElem.style.transform = `translateX(${moveX}px) rotate(${rotate}deg)`;
        cardElem.style.opacity = '0';

        setTimeout(() => {
            cardElem.style.transition = 'none';
            cardElem.style.transform = 'none';
            cardElem.style.opacity = '1';
            
            currentProfileIndex++;
            renderCurrentProfile();
        }, 300);
    } else {
        currentProfileIndex++;
        renderCurrentProfile();
    }
}

// ۵. نمایش پیام تمام شدن پروفایل‌ها
function showNoMoreProfiles() {
    const cardElem = document.querySelector('.card, .explore-card, main > div:first-child');
    if (cardElem) {
        cardElem.innerHTML = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:350px; color:#fff; text-align:center; padding:20px;">
                <h2 style="font-size:22px; margin-bottom:10px;">🌶️ تمام شد!</h2>
                <p style="color:#aaa; font-size:14px;">پروفایل دیگری در محدوده شما یافت نشد.</p>
            </div>
        `;
    }
}

// ۶. تنظیم دکمه‌های ناوبری پایین صفحه (Navigation Tabs)
function setupNavigation() {
    const navItems = document.querySelectorAll('nav a, footer button, .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.selectionChanged();
            }
        });
    });
}

// اجرای اولیه
document.addEventListener('DOMContentLoaded', () => {
    // آماده‌سازی تلگرام مینی‌اپ
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    authenticateUser();
    setupNavigation();

    // اتصال ایونت کلیک دکمه‌های اکشن اصلی
    document.addEventListener('click', (e) => {
        const target = e.target.closest('button, .action-btn');
        if (!target) return;

        if (target.classList.contains('btn-dislike') || target.innerText.includes('❌')) {
            handleAction('dislike');
        } else if (target.classList.contains('btn-like') || target.innerText.includes('🌶️')) {
            handleAction('like');
        } else if (target.classList.contains('btn-star') || target.innerText.includes('⭐')) {
            handleAction('superlike');
        }
    });
});
