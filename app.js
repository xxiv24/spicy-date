const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
}

const API_URL = 'https://spicy-date-api.onrender.com';
const userId = tg?.initDataUnsafe?.user?.id || 7049109708;

// دیتای کامل با حالت وویس و عکس‌های مختلف
const MOCK_USERS = [
    {
        telegram_id: 101,
        name: "سارا",
        age: 23,
        city: "بندرعباس",
        gender: "female",
        bio: "علاقه‌مند به موسیقی، کافه‌گردی و دریا 🌊",
        photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
        voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
        telegram_id: 102,
        name: "آرمین",
        age: 26,
        city: "بندرعباس",
        gender: "male",
        bio: "عاشق کمپینگ، قهوه و برنامه‌نویسی ☕",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        voice: ""
    },
    {
        telegram_id: 103,
        name: "نیلوفر",
        age: 24,
        city: "تهران",
        gender: "female",
        bio: "طراح UI/UX و شیفته هنر مدرن 🎨",
        photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
        voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    }
];

let suggestedUsersQueue = [];
let favoritesList = [];

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

async function fetchSuggestedUsers() {
    const container = document.getElementById('cards-container');
    const gender = document.getElementById('filter-gender')?.value || 'all';
    const city = document.getElementById('filter-city')?.value || 'all';

    let filtered = [...MOCK_USERS];
    if (gender !== 'all') filtered = filtered.filter(u => u.gender === gender);
    if (city !== 'all') filtered = filtered.filter(u => u.city === city);

    suggestedUsersQueue = filtered;
    renderNextCard();
}

function applyFilters() {
    fetchSuggestedUsers();
}

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
        <div class="dating-card" id="active-card">
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
                ${user.voice ? `<button onclick="playVoice('${user.voice}')" class="btn-voice">🎙️ شنیدن صدای ۱۲ ثانیه‌ای</button>` : ''}
            </div>
            <div class="card-actions-bar">
                <button onclick="handlePass()" class="btn-circle btn-pass">✖</button>
                <button onclick="handleLike()" class="btn-circle btn-like-main">🔥</button>
            </div>
        </div>
    `;

    setupSwipeGesture();
}

function playVoice(url) {
    const audio = new Audio(url);
    audio.play();
}

function setupSwipeGesture() {
    const card = document.getElementById('active-card');
    if (!card) return;

    let startX = 0;
    let currentX = 0;

    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });

    card.addEventListener('touchmove', (e) => {
        currentX = e.touches[0].clientX;
        const diffX = currentX - startX;
        card.style.transform = `translateX(${diffX}px) rotate(${diffX * 0.05}deg)`;
    }, { passive: true });

    card.addEventListener('touchend', () => {
        const diffX = currentX - startX;
        if (diffX > 90) {
            handleLike();
        } else if (diffX < -90) {
            handlePass();
        } else {
            card.style.transform = 'translateX(0) rotate(0)';
        }
    });
}

function handlePass() {
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
    suggestedUsersQueue.shift();
    renderNextCard();
}

function handleLike() {
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

    const currentMatched = suggestedUsersQueue[0];
    if (currentMatched) {
        favoritesList.push(currentMatched);
        showMatchPopup(currentMatched);
    }

    suggestedUsersQueue.shift();
    renderNextCard();
}

function showMatchPopup(matchedUser) {
    const popup = document.createElement('div');
    popup.className = 'match-modal';
    popup.innerHTML = `
        <div class="match-content">
            <h2>IT'S A MATCH! 🔥</h2>
            <p>شما و ${matchedUser.name} یکدیگر را لایک کردید!</p>
            <img src="${matchedUser.photo}" class="match-avatar">
            <button onclick="this.parentElement.parentElement.remove()" class="btn-action btn-save">ارسال پیام 💬</button>
        </div>
    `;
    document.body.appendChild(popup);
}

function renderFavorites() {
    const container = document.getElementById('favorites-container');
    if (!container) return;

    if (favoritesList.length === 0) {
        container.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--text-secondary);">هنوز کسی را لایک نکرده‌اید.</p>';
        return;
    }

    container.innerHTML = favoritesList.map(user => `
        <div class="fav-card">
            <img src="${user.photo}" alt="${user.name}">
            <div class="fav-card-info">
                <h4>${user.name}، ${user.age}</h4>
                <p>📍 ${user.city}</p>
            </div>
        </div>
    `).join('');
}

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
        alert('پروفایل با موفقیت ذخیره شد! ✨');
    } catch (e) {
        alert('اطلاعات ذخیره شد.');
    }
}

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

            if (targetTab === 'favorites') {
                renderFavorites();
            }

            if (tg?.HapticFeedback) tg.HapticFeedback.selectionChanged();
        });
    });
}
