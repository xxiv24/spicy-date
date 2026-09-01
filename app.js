// ==========================================
// Spicy Date 🌶️ - Stable Main Engine
// ==========================================

const API_BASE_URL = 'https://spicy-date-api.onrender.com';

// ۱. احراز هویت با تلگرام
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

// ۲. مدیریت تغییر تب‌ها (بدون دستکاری HTML دکمه‌ها و عناصر صفحه)
function setupTabNavigation() {
    const navItems = document.querySelectorAll('.nav-item, footer a, footer button, .nav-link');
    const tabContents = document.querySelectorAll('.tab-content, .page-section, section[id]');

    if (navItems.length === 0) return;

    navItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            if (window.Telegram?.WebApp?.HapticFeedback) {
                window.Telegram.WebApp.HapticFeedback.selectionChanged();
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => {
                tab.style.display = 'none';
                tab.classList.remove('active');
            });

            item.classList.add('active');

            const targetId = item.getAttribute('href')?.replace('#', '') || item.dataset.tab;
            let targetTab = targetId ? document.getElementById(targetId) : tabContents[index];

            if (targetTab) {
                targetTab.style.display = 'block';
                targetTab.classList.add('active');
            }
        });
    });
}

// ۳. اجرا پس از لود کامل DOM
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    authenticateUser();
    setupTabNavigation();
});
