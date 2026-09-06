const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    if (tg.requestFullscreen) tg.requestFullscreen();
}

// لیست کامل شهرهای ایران
const CITIES = [
    "بندرعباس", "تهران", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "قم", "اهواز", 
    "رشت", "کرمانشاه", "زاهدان", "ارومیه", "یزد", "اراک", "همدان", "قزوین", "سنندج",
    "خرم‌آباد", "گرگان", "ساری", "بجنورد", "بوشهر", "بیرجند", "ایلام", "شهرکرد",
    "سمنان", "زنجان", "یاسوج", "اردبیل", "کیش", "قشم", "چابهار"
].sort();

let MOCK_USERS = [
    { name: "سارا", age: 23, city: "بندرعباس", gender: "female", intent: "دوستی ☕", bio: "علاقه‌مند به دریا و عکاسی 📸", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80" },
    { name: "آرمین", age: 27, city: "بندرعباس", gender: "male", intent: "سفر ✈️", bio: "عاشق کمپینگ و الکترونیک ☕", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" },
    { name: "نیلوفر", age: 20, city: "تهران", gender: "female", intent: "ازدواج 💍", bio: "طراح UI/UX 🎨", photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80" }
];

const REWARDS = [
    { day: 1, type: 'energy', val: 10 },
    { day: 2, type: 'stars', val: 1 },
    { day: 3, type: 'energy', val: 25 },
    { day: 4, type: 'stars', val: 2 },
    { day: 5, type: 'energy', val: 50 },
    { day: 6, type: 'stars', val: 5 },
    { day: 7, type: 'energy', val: 100 },
    { day: 8, type: 'stars', val: 10 }
];

let userData = {
    energy: 30,
    stars: 0,
    lastClaimDate: null,
    streak: 0,
    favorites: []
};

let userIndex = 0;

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    populateCities();
    loadUserData();
    renderCurrentCard();

    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 400);
    }, 800);
});

function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const stars = Array.from({ length: 25 }, () => ({
        x: Math.random() * w, y: Math.random() * h, size: Math.random() * 1.5, alpha: Math.random()
    }));

    function draw() {
        ctx.clearRect(0, 0, w, h);
        stars.forEach(s => {
            ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
        requestAnimationFrame(draw);
    }
    draw();
}

function populateCities() {
    const filterSelect = document.getElementById('filter-city');
    const profileSelect = document.getElementById('p-city');

    if (filterSelect) {
        filterSelect.innerHTML = '<option value="all">همه شهرها 📍</option>';
        CITIES.forEach(c => filterSelect.add(new Option(c, c)));
    }
    if (profileSelect) {
        profileSelect.innerHTML = '';
        CITIES.forEach(c => profileSelect.add(new Option(c, c)));
    }
}

// مدیریت کلیک روی منوی پایین و سوییچ دقیق صفحات
function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

    const activeTab = document.getElementById(`tab-${tabId}`);
    if (activeTab) activeTab.classList.add('active');

    const btnMap = { cards: 'btn-tab-cards', games: 'btn-tab-games', tasks: 'btn-tab-tasks', profile: 'btn-tab-profile' };
    if (btnMap[tabId]) {
        document.getElementById(btnMap[tabId])?.classList.add('active');
    }
}

function renderCurrentCard() {
    if (userIndex >= MOCK_USERS.length) userIndex = 0;
    const u = MOCK_USERS[userIndex];

    document.getElementById('c-photo').src = u.photo;
    document.getElementById('c-name').innerText = `${u.name}، ${u.age}`;
    document.getElementById('c-city-intent').innerText = `📍 ${u.city} • ${u.intent}`;
    document.getElementById('c-bio').innerText = u.bio;
}

function nextCard() {
    userIndex++;
    renderCurrentCard();
}

function likeCard() {
    const u = MOCK_USERS[userIndex];
    if (!userData.favorites.some(f => f.name === u.name)) {
        userData.favorites.push(u);
        renderFavorites();
        saveUserData();
    }
    showToast(`شما ${u.name} را لایک کردید 🔥`);
    nextCard();
}

function renderFavorites() {
    const box = document.getElementById('fav-list');
    if (!box) return;

    if (userData.favorites.length === 0) {
        box.innerHTML = '<p style="font-size:11px; color:var(--text-secondary); grid-column:1/-1;">هنوز لایکی انجام نشده.</p>';
        return;
    }

    box.innerHTML = userData.favorites.map(f => `
        <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:12px; overflow:hidden;">
            <img src="${f.photo}" style="width:100%; height:110px; object-fit:cover;">
            <div style="padding:6px 8px;">
                <b style="font-size:12px;">${f.name}، ${f.age}</b>
                <p style="font-size:10px; color:var(--text-secondary);">📍 ${f.city}</p>
            </div>
        </div>
    `).join('');
}

/* سیستم کامل دیلی چک مرتب‌شده */
function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function openDailyModal() {
    document.getElementById('daily-modal').classList.add('active');
    renderDailySlots();
}

function closeDailyModal() {
    document.getElementById('daily-modal').classList.remove('active');
}

function renderDailySlots() {
    const grid = document.getElementById('daily-grid');
    const today = getTodayString();
    const canClaim = userData.lastClaimDate !== today;

    grid.innerHTML = REWARDS.map((r, i) => {
        const isDone = i < userData.streak;
        const isCurrent = i === userData.streak;

        return `
            <div class="daily-slot ${isDone ? 'claimed' : ''} ${isCurrent && canClaim ? 'active' : ''}">
                <span class="day-title">روز ${r.day}</span>
                <span class="reward-val">
                    ${r.type === 'energy' ? '⚡' : '⭐'} +${r.val}
                </span>
            </div>
        `;
    }).join('');

    const claimBtn = document.getElementById('btn-claim-reward');
    if (canClaim) {
        claimBtn.disabled = false;
        claimBtn.innerText = "دریافت جایزه امروز 🎉";
    } else {
        claimBtn.disabled = true;
        claimBtn.innerText = "فردا مراجعه کنید ⏳";
    }
}

function claimDaily() {
    const today = getTodayString();
    if (userData.lastClaimDate === today) return;

    const reward = REWARDS[userData.streak % REWARDS.length];
    if (reward.type === 'energy') userData.energy += reward.val;
    else userData.stars += reward.val;

    userData.streak += 1;
    userData.lastClaimDate = today;

    saveUserData();
    updateHeaderUI();
    renderDailySlots();
    showToast(`پاداش دریافت شد!`);

    if (tg?.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
}

function updateHeaderUI() {
    document.getElementById('txt-energy').innerText = userData.energy;
    document.getElementById('txt-stars').innerText = userData.stars;
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
}

function saveUserData() {
    localStorage.setItem('spicy_data_v2', JSON.stringify(userData));
}

function loadUserData() {
    const local = localStorage.getItem('spicy_data_v2');
    if (local) {
        userData = { ...userData, ...JSON.parse(local) };
        updateHeaderUI();
        renderFavorites();
    }
}

function uploadAvatar(e) {
    const file = e.target.files[0];
    if (file) {
        const r = new FileReader();
        r.onload = (ev) => document.getElementById('p-avatar').src = ev.target.result;
        r.readAsDataURL(file);
    }
}

function saveProfile() {
    showToast('تنظیمات با موفقیت ذخیره شد 💾');
}

function shareRef() {
    if (tg) tg.openTelegramLink("https://t.me/share/url?url=https://t.me/SpicyDateBot");
}
