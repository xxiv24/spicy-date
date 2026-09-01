// ==========================================
// Spicy Date 🌶️ - Complete Main Application Logic
// ==========================================

const API_BASE_URL = 'https://spicy-date-api.onrender.com';

// 1. احراز هویت کاربر و ارسال initData به بک‌اند
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
            console.log("ورود موفقیت‌آمیز کاربر:", data.user);
        }
    } catch (err) {
        console.error("خطا در ارتباط با API:", err);
    }
}

// 2. مدیریت تغییر تب‌های ۴ گانه (اکسپلور، بازی‌ها، چت‌ها، پروفایل)
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item, footer a, footer button, .nav-link');
    const tabContents = document.querySelectorAll('.tab-content, .page-section, section[id]');

    if (navItems.length === 0) return;

    navItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // بازخورد لمسی تلگرام (Haptic)
            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.selectionChanged();
            }

            // غیرفعال کردن همه تب‌ها
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // مخفی کردن تمام صفحات
            tabContents.forEach(tab => {
                tab.style.display = 'none';
                tab.classList.remove('active');
            });

            // فعال کردن تب انتخاب‌شده
            item.classList.add('active');

            // نمایش صفحه مربوطه
            const targetId = item.getAttribute('href')?.replace('#', '') || item.dataset.tab;
            let targetTab = targetId ? document.getElementById(targetId) : tabContents[index];

            if (targetTab) {
                targetTab.style.display = 'block';
                targetTab.classList.add('active');
            }
        });
    });
}

// 3. اجرا هنگام ساختار کامل DOM
document.addEventListener('DOMContentLoaded', () => {
    // تنظیمات مینی‌اپ تلگرام
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    // فراخوانی وظایف اصلی
    authenticateUser();
    setupNavigation();
});
