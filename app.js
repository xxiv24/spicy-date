// تنظیمات اولیه تلگرام
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
}

const API_URL = 'https://spicy-date-api.onrender.com';
const userId = tg?.initDataUnsafe?.user?.id || 100;

// دیتای پشتیبان در صورت قطع یا کندی سرور Render
const MOCK_USERS = [
    {
        telegram_id: 101,
        name: "سارا",
        age: 23,
        city: "بندرعباس",
        gender: "female",
        bio: "علاقه‌مند به موسیقی، کافه‌گردی و عکاسی 📸",
        photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80"
    },
    {
        telegram_id: 102,
        name: "آرمین",
        age: 26,
        city: "بندرعباس",
        gender: "male",
        bio: "برنامه‌نویس و عاشق سفر و کمپینگ 🏕️",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"
    },
    {
        telegram_id: 103,
        name: "مریم",
        age: 22,
        city: "تهران",
        gender: "female",
        bio: "طراح گرافیک و عاشق هنر و نقاشی 🎨",
        photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80"
    }
];

let suggestedUsersQueue = [];

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    initApp();
});

async function initApp() {
    updateProfileDisplay();
    await fetchSuggestedUsers();
}

function updateProfileDisplay() {
    const user = tg?.initDataUnsafe?.user;
    if (user) {
        document.getElementById('profile-name-display').innerText = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'پروفایل من';
        document.getElementById('profile-id-display').innerText = `ID: ${user.id}`;
        if (user.photo_url) {
            document.getElementById('profile-avatar').src = user.photo_url;
        }
    }
}

// دریافت لیست کاربران با Fallback خودمختار
async function fetchSuggestedUsers() {
    const container = document.getElementById('cards-container');
    const gender = document.getElementById('filter-gender')?.value || 'all';
    const city = document.getElementById('filter-city')?.value || 'all';

    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>در حال دریافت جدیدترین پروفایل‌ها...</p>
        </div>
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // ۴ ثانیه زمان انتظار سرور

    try {
        const response = await fetch(`${API_URL}/likes/suggested/${userId}?gender=${gender}&city=${city}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('خطا در سرور');
        const users = await response.json();

        if (!users || users.length === 0) {
            useMockData(gender, city);
        } else {
            suggestedUsersQueue = users;
            renderNextCard();
        }
    } catch (error) {
        console.warn("استفاده از دیتای آفلاین به علت عدم پاسخ سرور:", error);
        useMockData(gender, city);
    }
}

function useMockData(gender, city) {
    let filtered = MOCK_USERS;
    if (gender !== 'all') filtered = filtered.filter(u => u.gender === gender);
    if (city !== 'all') filtered = filtered.filter(u => u.city === city);

    suggestedUsersQueue = filtered;
    renderNextCard();
}

function applyFilters() {
    fetchSuggestedUsers();
}

// رندر کارت با افکت Tinder
function renderNextCard() {
    const container = document.getElementById('cards-container');

    if (!suggestedUsersQueue || suggestedUsersQueue.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h4>پروفایل جدیدی پیدا نشد!</h4>
                <p>فیلتر شهر یا جنسیت را تغییر دهید.</p>
                <button onclick="fetchSuggestedUsers()" class="btn-action btn-save" style="margin-top: 15px;">تلاش مجدد 🔄</button>
            </div>
        `;
        return;
    }

    const user = suggestedUsersQueue[0];

    container.innerHTML = `
        <div class="dating-card">
            <div class="card-media">
                <img src="${user.photo}" alt="${user.name}">
                <div class="card-gradient-overlay"></div>
                <div class="card-info-content">
                    <h2>${user.name} <span class="age">${user.age}</span></h2>
                    <span class="city-badge">📍 ${user.city}</span>
                </div>
            </div>
            <div class="card-bio">
                <p>${user.bio}</p>
            </div>
            <div class="card-actions-bar">
                <button onclick="handlePass()" class="btn-circle btn-pass" title="رد کردن">✖</button>
                <button onclick="handleLike(${user.telegram_id})" class="btn-circle btn-like-main" title="لایک">🔥</button>
            </div>
        </div>
    `;
}

function handlePass() {
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    suggestedUsersQueue.shift();
    renderNextCard();
}

async function handleLike(toUserId) {
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

    try {
        fetch(`${API_URL}/likes/add/${userId}/${toUserId}`, { method: 'POST' });
    } catch (e) {
        console.error(e);
    }

    suggestedUsersQueue.shift();
    renderNextCard();
}

// ذخیره پروفایل
async function saveProfile() {
    const gender = document.getElementById('user-gender').value;
    const city = document.getElementById('user-city').value;
    const bio = document.getElementById('user-bio').value;

    try {
        await fetch(`${API_URL}/api/user/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId: userId, gender, city, bio })
        });
        if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        alert('پروفایل شما با موفقیت به‌روزرسانی شد! ✨');
    } catch (error) {
        alert('پروفایل به صورت محلی ذخیره شد.');
    }
}

// ناوبری تب‌ها
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabViews = document.querySelectorAll('.tab-view');

    navItems.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            navItems.forEach(btn => btn.classList.remove('active'));
            tabViews.forEach(view => view.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(`tab-${targetTab}`)?.classList.add('active');

            if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
        });
    });
}
