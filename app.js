// ۱. تنظیمات اولیه و متغیرهای عمومی
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand(); // بزرگ‌نمایی کامل مینی‌اپ در تلگرام
}

// آدرس بک‌اند روی رندر
const API_URL = 'https://spicy-date-api.onrender.com';

// دریافت شناسه کاربر از تلگرام (در صورت عدم وجود، شناسه تست ۱۰۰ استفاده می‌شود)
const userId = tg?.initDataUnsafe?.user?.id || 100;
const userInitData = tg?.initData || '';

let currentUserData = null;

// ۲. اجرای اولیه برنامه هنگام لود صفحه
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    setupNavigation();
});

async function initApp() {
    await fetchUserProfile();
    await fetchSuggestedUsers();
}

// ۳. دریافت و نمایش اطلاعات پروفایل کاربر
async function fetchUserProfile() {
    try {
        const response = await fetch(`${API_URL}/api/user/${userId}`);
        if (response.ok) {
            currentUserData = await response.json();
            updateProfileUI(currentUserData);
        }
    } catch (error) {
        console.error("خطا در دریافت پروفایل کاربر:", error);
    }
}

function updateProfileUI(data) {
    const genderSelect = document.getElementById('user-gender');
    const citySelect = document.getElementById('user-city');
    const bioInput = document.getElementById('user-bio');
    const vipBadge = document.getElementById('vip-status-badge');

    if (genderSelect && data.gender) genderSelect.value = data.gender;
    if (citySelect && data.city) citySelect.value = data.city;
    if (bioInput && data.bio) bioInput.value = data.bio;
    if (vipBadge) {
        vipBadge.innerText = data.isVip ? 'کاربر VIP ⭐' : 'کاربر عادی ⭐️';
        vipBadge.className = data.isVip ? 'badge vip' : 'badge normal';
    }
}

// ۴. ذخیره تغییرات پروفایل
async function saveProfile() {
    const gender = document.getElementById('user-gender')?.value || 'female';
    const city = document.getElementById('user-city')?.value || 'بندرعباس';
    const bio = document.getElementById('user-bio')?.value || '';

    try {
        const response = await fetch(`${API_URL}/api/user/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ telegramId: userId, gender, city, bio })
        });

        if (response.ok) {
            if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
            alert('اطلاعات با موفقیت ذخیره شد!');
        }
    } catch (error) {
        alert('خطا در ذخیره اطلاعات!');
    }
}

// ۵. دریافت لیست پیشنهاد کاربران (کارت‌های اکسپلور) همراه با تایم‌اوت
async function fetchSuggestedUsers(gender = 'all', city = 'all') {
    const container = document.getElementById('cards-container');
    if (container) {
        container.innerHTML = '<div class="loading">در حال دریافت اطلاعات...</div>';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
        const response = await fetch(`${API_URL}/likes/suggested/${userId}?gender=${gender}&city=${city}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('مشکل در دریافت داده‌ها');

        const users = await response.json();
        
        if (!users || users.length === 0) {
            if (container) {
                container.innerHTML = '<p class="empty-msg">کاربری با این مشخصات یافت نشد.</p>';
            }
            return;
        }

        renderCards(users);
    } catch (error) {
        console.error("خطا در ارتباط با سرور:", error);
        if (container) {
            container.innerHTML = `
                <div class="error-box" style="text-align: center; padding: 20px;">
                    <p style="color: #ff4d4d; margin-bottom: 10px;">خطا در دریافت اطلاعات از سرور!</p>
                    <button onclick="fetchSuggestedUsers('${gender}', '${city}')" style="padding: 8px 16px; border-radius: 8px; background: #ff2a5f; color: #fff; border: none;">تلاش مجدد 🔄</button>
                </div>
            `;
        }
    }
}

// ۶. رندر کردن کارت‌های کاربران
function renderCards(users) {
    const container = document.getElementById('cards-container');
    if (!container) return;

    container.innerHTML = '';
    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.innerHTML = `
            <img src="${user.photo}" alt="${user.name}" class="card-img" />
            <div class="card-info">
                <h3>${user.name}، ${user.age} <span class="city-tag">📍 ${user.city}</span></h3>
                <p>${user.bio}</p>
                <div class="card-actions">
                    <button onclick="handleLike(${user.telegram_id})" class="btn-like">🔥 لایک</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// ۷. ثبت لایک کاربر
async function handleLike(toUserId) {
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

    try {
        const response = await fetch(`${API_URL}/likes/add/${userId}/${toUserId}`, {
            method: 'POST'
        });
        if (response.ok) {
            alert('لایک ثبت شد! 🔥');
            fetchSuggestedUsers();
        }
    } catch (error) {
        console.error("خطا در ثبت لایک:", error);
    }
}

// ۸. دریافت لیست علاقه‌مندی‌ها
async function fetchFavorites() {
    const container = document.getElementById('favorites-container');
    if (!container) return;

    container.innerHTML = '<div class="loading">در حال دریافت علاقه‌مندی‌ها...</div>';

    try {
        const response = await fetch(`${API_URL}/likes/favorites/${userId}`);
        const favorites = await response.json();

        if (favorites.length === 0) {
            container.innerHTML = '<p class="empty-msg">لیست علاقه‌مندی‌های شما خالی است.</p>';
            return;
        }

        container.innerHTML = '';
        favorites.forEach(user => {
            const item = document.createElement('div');
            item.className = 'fav-item';
            item.innerHTML = `
                <img src="${user.photo}" class="fav-img" />
                <div class="fav-details">
                    <h4>${user.name}</h4>
                    <p>📍 ${user.city}</p>
                </div>
            `;
            container.appendChild(item);
        });
    } catch (error) {
        container.innerHTML = '<p class="error-msg">خطا در دریافت لیست.</p>';
    }
}

// ۹. ناوبری و سوئیچ بین تب‌های مینی‌اپ
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabViews = document.querySelectorAll('.tab-view');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');

            navItems.forEach(n => n.classList.remove('active'));
            tabViews.forEach(v => v.classList.remove('active'));

            item.classList.add('active');
            const targetEl = document.getElementById(`tab-${targetTab}`);
            if (targetEl) targetEl.classList.add('active');

            if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();

            if (targetTab === 'favorites') {
                fetchFavorites();
            }
        });
    });
}
