/**
 * js/app.js
 * مدیریت منطق و رویدادهای مینی‌اپ تلگرام
 */

// ۱. مقداردهی اولیه تلگرام
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand(); // باز شدن اپلیکیشن به صورت تمام‌صفحه

// اجرای کدها پس از بارگذاری کامل صفحه
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // ۲. مدیریت صفحه ورود (Login)
    // ==========================================
    const btnLogin = document.getElementById('btn-telegram-login');
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('main-content'); // فرض بر این است که محتوای اصلی در این آیدی قرار دارد

    if (btnLogin && loginScreen) {
        btnLogin.addEventListener('click', () => {
            // در اینجا می‌توانید اطلاعات کاربر را با tg.initDataUnsafe دریافت کرده و به بک‌اند (JavaScript/Node.js) ارسال کنید
            loginScreen.style.display = 'none';
            if (mainContent) mainContent.classList.remove('hidden');
        });
    }

    // ==========================================
    // ۳. مدیریت نوار ناوبری پایین (Tabs)
    // ==========================================
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 

            // غیرفعال کردن تمامی تب‌ها و دکمه‌ها
            navBtns.forEach(b => {
                b.classList.remove('active', 'text-red-500');
                b.classList.add('text-gray-400');
            });
            tabContents.forEach(tab => {
                tab.classList.remove('active');
                tab.classList.add('hidden'); // اگر از hidden برای مخفی کردن استفاده کرده‌اید
            });

            // فعال کردن دکمه انتخاب شده
            btn.classList.add('active', 'text-red-500');
            btn.classList.remove('text-gray-400');

            // نمایش محتوای تب انتخاب شده
            const targetTab = btn.getAttribute('data-tab');
            const targetSection = document.getElementById(`tab-${targetTab}`);
            if (targetSection) {
                targetSection.classList.add('active');
                targetSection.classList.remove('hidden');
            }
        });
    });

    // ==========================================
    // ۴. مدیریت مودال‌ها (پاپ‌آپ ثبت‌نام و غیره)
    // ==========================================
    const btnOpenRegister = document.getElementById('btn-open-register');
    const btnCloseRegister = document.getElementById('btn-close-register');
    const registerModal = document.getElementById('register-modal');

    if (btnOpenRegister && registerModal) {
        btnOpenRegister.addEventListener('click', () => {
            registerModal.classList.remove('hidden');
        });
    }

    if (btnCloseRegister && registerModal) {
        btnCloseRegister.addEventListener('click', () => {
            registerModal.classList.add('hidden');
        });
    }

    // ==========================================
    // ۵. مدیریت مینی‌گیم‌ها
    // ==========================================
    // دکمه میان‌بر در صفحه اکسپلور برای رفتن به تب بازی‌ها
    const btnGameExplore = document.getElementById('btn-game');
    if (btnGameExplore) {
        btnGameExplore.addEventListener('click', () => {
            const gamesTabBtn = document.querySelector('.nav-btn[data-tab="games"]');
            if (gamesTabBtn) gamesTabBtn.click();
        });
    }

    // لیست بازی‌ها و مودال‌های مربوطه بر اساس آیدی‌ها
    const games = [
        { btnId: 'game-truth-or-dare', modalId: 'tod-modal', closeBtnId: 'btn-close-tod' },
        { btnId: 'game-personality', modalId: 'personality-modal', closeBtnId: 'btn-close-personality' },
        { btnId: 'game-tictactoe', modalId: 'tictactoe-modal', closeBtnId: 'btn-close-tictactoe' },
        { btnId: 'game-rps', modalId: 'rps-modal', closeBtnId: 'btn-close-rps' }
    ];

    games.forEach(({ btnId, modalId, closeBtnId }) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        const closeBtn = document.getElementById(closeBtnId);

        // باز کردن مودال بازی
        if (btn && modal) {
            btn.addEventListener('click', () => {
                modal.classList.remove('hidden');
            });
        }

        // بستن مودال بازی
        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
            });
        }
    });

});
