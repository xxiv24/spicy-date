// ==========================================
// Spicy Date 🌶️ - Original Stable App Engine
// ==========================================

const API_BASE_URL = 'https://spicy-date-api.onrender.com';

// احراز هویت با تلگرام
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

// اجرا پس از لود کامل DOM
document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    authenticateUser();
});
