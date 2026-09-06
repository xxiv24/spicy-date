const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    
    // فعال‌سازی حالت تمام صفحه رسمی تلگرام (حذف نوار بالای سفید)
    if (tg.requestFullscreen) {
        tg.requestFullscreen();
    }
}

const IRAN_CITIES = [
    "تهران", "بندرعباس", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "قم", "اهواز", 
    "رشت", "کرمانشاه", "زاهدان", "ارومیه", "یزد", "اراک", "همدان", "قزوین", "سنندج", 
    "خرم‌آباد", "گرگان", "ساری", "بجنورد", "بوشهر", "بیرجند", "ایلام", "شهرکرد", 
    "سمنان", "زنجان", "یاسوج", "اردبیل", "کیش", "قشم", "چابهار"
];

let MOCK_USERS = [
    {
        telegram_id: 101,
        name: "سارا",
        age: 23,
        city: "بندرعباس",
        gender: "female",
        intent: "دوستی و چت ☕",
        bio: "علاقه‌مند به موسیقی، کافه‌گردی و دریا 🌊",
        photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
        voice: ""
    },
    {
        telegram_id: 102,
        name: "آرمین",
        age: 27,
        city: "بندرعباس",
        gender: "male",
        intent: "کافه‌گردی و سفر ✈️",
        bio: "عاشق کمپینگ، قهوه و الکترونیک ☕",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        voice: ""
    },
    {
        telegram_id: 103,
        name: "نیلوفر",
        age: 20,
        city: "تهران",
        gender: "female",
        intent: "آشنایی و ازدواج 💍",
        bio: "طراح UI/UX و شیفته هنر 🎨",
        photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
        voice: ""
    }
];

let suggestedUsersQueue = [];
let matchedUsersList = [];
let historyStack = [];
let isVip = false;

document.addEventListener('DOMContentLoaded', () => {
    populateCities();
    setupNavigation();
    loadSavedProfile();
    fetchSuggestedUsers();
});

function showToast(text, icon = "✨") {
    const toast = document.getElementById('custom-toast');
    document.getElementById('toast-text').innerText = text;
    document.getElementById('toast-icon').innerText = icon;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function populateCities() {
    const filterCitySelect = document.getElementById('filter-city');
    const userCitySelect = document.getElementById('user-city');

    IRAN_CITIES.sort().forEach(city => {
        filterCitySelect.add(new Option(city, city));
        userCitySelect.add(new Option(city, city));
    });
}

function loadSavedProfile() {
    const saved = localStorage.getItem('spicy_user_profile');
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('user-display-name').value = data.name || '';
        document.getElementById('user-age').value = data.age || '';
        document.getElementById('profile-name-display').innerText = data.name || 'پروفایل من';
        document.getElementById('user-gender').value = data.gender || 'male';
        document.getElementById('user-city').value = data.city || 'بندرعباس';
        document.getElementById('user-intent').value = data.intent || '';
        document.getElementById('user-bio').value = data.bio || '';
        document.getElementById('user-incognito').checked = !!data.incognito;
        if (data.avatar) {
            document.getElementById('profile-avatar').src = data.avatar;
        }
    }
}

function saveProfile() {
    const profileData = {
        name: document.getElementById('user-display-name').value,
        age: document.getElementById('user-age').value,
        gender: document.getElementById('user-gender').value,
        city: document.getElementById('user-city').value,
        intent: document.getElementById('user-intent').value,
        bio: document.getElementById('user-bio').value,
        incognito: document.getElementById('user-incognito').checked,
        avatar: document.getElementById('profile-avatar').src
    };

    localStorage.setItem('spicy_user_profile', JSON.stringify(profileData));
    document.getElementById('profile-name-display').innerText = profileData.name || 'پروفایل من';
    showToast("تغییرات با موفقیت ذخیره شد!", "💾");
}

function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profile-avatar').src = e.target.result;
            saveProfile();
        };
        reader.readAsDataURL(file);
    }
}

function fetchSuggestedUsers() {
    const gender = document.getElementById('filter-gender').value;
    const city = document.getElementById('filter-city').value;
    const ageRange = document.getElementById('filter-age-range').value;

    let filtered = [...MOCK_USERS];

    if (gender !== 'all') filtered = filtered.filter(u => u.gender === gender);
    if (city !== 'all') filtered = filtered.filter(u => u.city === city);

    if (ageRange !== 'all') {
        if (ageRange === '18-22') filtered = filtered.filter(u => u.age >= 18 && u.age <= 22);
        else if (ageRange === '23-28') filtered = filtered.filter(u => u.age >= 23 && u.age <= 28);
        else if (ageRange === '29-35') filtered = filtered.filter(u => u.age >= 29 && u.age <= 35);
        else if (ageRange === '36+') filtered = filtered.filter(u => u.age >= 36);
    }

    suggestedUsersQueue = filtered;
    renderNextCard();
}

function renderNextCard() {
    const container = document.getElementById('cards-container');

    if (!suggestedUsersQueue || suggestedUsersQueue.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size:36px; margin-bottom:8px;">🔍</div>
                <h4>کاربری با این مشخصات یافت نشد!</h4>
                <p style="font-size:11px; margin-top:4px;">فیلتر سن یا شهر را تغییر دهید.</p>
            </div>
        `;
        return;
    }

    const user = suggestedUsersQueue[0];

    container.innerHTML = `
        <div class="dating-card">
            <button class="btn-report-flag" onclick="reportUser(${user.telegram_id})">🚩 گزارش</button>
            <div class="card-media">
                <img src="${user.photo}" alt="${user.name}">
                <div class="card-gradient-overlay"></div>
                <div class="card-info-content">
                    <h2>${user.name} <span class="age">${user.age} سال</span></h2>
                    <div>
                        <span class="city-badge">📍 ${user.city}</span>
                        <span class="intent-badge">${user.intent || 'آشنایی'}</span>
                    </div>
                </div>
            </div>
            <div class="card-bio">
                <p>${user.bio}</p>
            </div>
            <div class="card-actions-bar">
                <button onclick="handleRewind()" class="btn-circle btn-rewind" title="بازگردانی">🔄</button>
                <button onclick="handlePass()" class="btn-circle btn-pass" title="رد کردن">✖</button>
                <button onclick="handleSuperLike()" class="btn-circle btn-superlike" title="سوپر لایک">⭐</button>
                <button onclick="handleLike()" class="btn-circle btn-like-main" title="لایک">🔥</button>
            </div>
        </div>
    `;
}

function handleLike() {
    const user = suggestedUsersQueue.shift();
    if (user) {
        historyStack.push(user);
        showToast(`شما ${user.name} را لایک کردید!`, "🔥");
    }
    renderNextCard();
}

function handlePass() {
    const user = suggestedUsersQueue.shift();
    if (user) historyStack.push(user);
    renderNextCard();
}

function handleSuperLike() {
    const user = suggestedUsersQueue[0];
    if (user) {
        showToast(`سوپر لایک برای ${user.name} ارسال شد!`, "⭐");
        handleLike();
    }
}

function handleRewind() {
    if (!isVip) {
        showToast("بازگردانی مخصوص کاربران VIP است!", "👑");
        openVipModal();
        return;
    }
    if (historyStack.length === 0) return;
    const lastUser = historyStack.pop();
    suggestedUsersQueue.unshift(lastUser);
    renderNextCard();
}

function reportUser() {
    showToast("کاربر مسدود شد.", "🚩");
    suggestedUsersQueue.shift();
    renderNextCard();
}

function openVipModal() { document.getElementById('vip-modal').classList.add('active'); }
function closeVipModal() { document.getElementById('vip-modal').classList.remove('active'); }

function processPayment(starsCount, days) {
    closeVipModal();
    showToast(`تست پرداخت ${starsCount} استارز`, "⭐️");
}

function joinChannel() {
    if (tg) tg.openTelegramLink("https://t.me/SpicyDateChannel");
}

function shareReferralLink() {
    if (tg) tg.openTelegramLink("https://t.me/share/url?url=https://t.me/SpicyDateBot");
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
        });
    });
}
