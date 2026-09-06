const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
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
        photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80"
    },
    {
        telegram_id: 102,
        name: "آرمین",
        age: 27,
        city: "بندرعباس",
        gender: "male",
        intent: "کافه‌گردی و سفر ✈️",
        bio: "عاشق کمپینگ، قهوه و الکترونیک ☕",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"
    },
    {
        telegram_id: 103,
        name: "نیلوفر",
        age: 20,
        city: "تهران",
        gender: "female",
        intent: "آشنایی و ازدواج 💍",
        bio: "طراح UI/UX و شیفته هنر 🎨",
        photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80"
    }
];

// سیستم پاداش دقیق دیلی چک (مقادیر عددی برای اضافه شدن به کیف پول)
const DAILY_REWARDS = [
    { day: 1, icon: "⚡", amount: 10, type: "energy", text: "+10" },
    { day: 2, icon: "⭐", amount: 1, type: "stars", text: "+1" },
    { day: 3, icon: "⭐", amount: 2, type: "stars", text: "+2" },
    { day: 4, icon: "⚡", amount: 100, type: "energy", text: "+100" },
    { day: 5, icon: "⚡", amount: 200, type: "energy", text: "+200" },
    { day: 6, icon: "⭐", amount: 3, type: "stars", text: "+3" },
    { day: 7, icon: "🔥", amount: 500, type: "energy", text: "+500" },
    { day: 8, icon: "⚡", amount: 300, type: "energy", text: "+300" },
    { day: 9, icon: "⭐", amount: 2, type: "stars", text: "+2" },
    { day: 10, icon: "⚡", amount: 200, type: "energy", text: "+200" },
    { day: 11, icon: "👑", amount: 5, type: "stars", text: "+5" },
    { day: 12, icon: "⭐", amount: 3, type: "stars", text: "+3" },
    { day: 13, icon: "⚡", amount: 500, type: "energy", text: "+500" },
    { day: 14, icon: "🔥", amount: 1000, type: "energy", text: "+1000" },
    { day: 15, icon: "⭐", amount: 5, type: "stars", text: "+5" },
    { day: 16, icon: "⚡", amount: 300, type: "energy", text: "+300" }
];

let suggestedUsersQueue = [];
let likedUsersList = [];
let historyStack = [];
let isVip = false;

// متغیرهای وضعیت کاربر
let userStars = 0;
let userEnergy = 50;
let dailyStreak = 0;
let lastClaimTimestamp = 0;
let timerInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initMotionBackground();
    populateCities();
    setupNavigation();
    loadProfileCloud();
    fetchSuggestedUsers();

    // مخفی کردن صفحه لودینگ بعد از ۱.۲ ثانیه
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            splash.style.visibility = 'hidden';
        }
    }, 1200);
});

// ۱. انیمیشن موشن ذرات بک‌گراند
function initMotionBackground() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 45 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        speedY: -(Math.random() * 0.4 + 0.1),
        speedX: (Math.random() - 0.5) * 0.2
    }));

    function animate() {
        ctx.clearRect(0, 0, width, height);
        particles.forEach(p => {
            p.y += p.speedY;
            p.x += p.speedX;

            if (p.y < 0) p.y = height;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.fill();
        });
        requestAnimationFrame(animate);
    }
    animate();
}

function showToast(text, icon = "✨") {
    const toast = document.getElementById('custom-toast');
    document.getElementById('toast-text').innerText = text;
    document.getElementById('toast-icon').innerText = icon;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function updateHeaderStats() {
    document.getElementById('user-stars-count').innerText = userStars;
    document.getElementById('user-energy-count').innerText = userEnergy;
}

// ۲. ذخیره‌سازی ابری در Telegram CloudStorage
function saveProfileCloud() {
    const profileData = {
        name: document.getElementById('user-display-name').value,
        age: document.getElementById('user-age').value,
        gender: document.getElementById('user-gender').value,
        city: document.getElementById('user-city').value,
        intent: document.getElementById('user-intent').value,
        bio: document.getElementById('user-bio').value,
        incognito: document.getElementById('user-incognito').checked,
        avatar: document.getElementById('profile-avatar').src,
        userStars: userStars,
        userEnergy: userEnergy,
        dailyStreak: dailyStreak,
        lastClaimTimestamp: lastClaimTimestamp
    };

    const dataStr = JSON.stringify(profileData);

    if (tg && tg.CloudStorage) {
        tg.CloudStorage.setItem('spicy_user_cloud_data', dataStr, (err, success) => {
            if (success) {
                showToast("اطلاعات در سرور ابری تلگرام ذخیره شد!", "☁️");
            } else {
                localStorage.setItem('spicy_user_profile', dataStr);
                showToast("اطلاعات ذخیره شد.", "💾");
            }
        });
    } else {
        localStorage.setItem('spicy_user_profile', dataStr);
        showToast("اطلاعات ذخیره شد.", "💾");
    }
}

function loadProfileCloud() {
    const applyData = (dataStr) => {
        if (!dataStr) return;
        const data = JSON.parse(dataStr);
        if (data.name) {
            document.getElementById('user-display-name').value = data.name;
            document.getElementById('profile-name-display').innerText = data.name;
        }
        if (data.age) document.getElementById('user-age').value = data.age;
        if (data.gender) document.getElementById('user-gender').value = data.gender;
        if (data.city) document.getElementById('user-city').value = data.city;
        if (data.intent) document.getElementById('user-intent').value = data.intent;
        if (data.bio) document.getElementById('user-bio').value = data.bio;
        document.getElementById('user-incognito').checked = !!data.incognito;
        if (data.avatar) document.getElementById('profile-avatar').src = data.avatar;

        if (data.userStars !== undefined) userStars = data.userStars;
        if (data.userEnergy !== undefined) userEnergy = data.userEnergy;
        if (data.dailyStreak !== undefined) dailyStreak = data.dailyStreak;
        if (data.lastClaimTimestamp !== undefined) lastClaimTimestamp = data.lastClaimTimestamp;

        updateHeaderStats();
    };

    if (tg && tg.CloudStorage) {
        tg.CloudStorage.getItem('spicy_user_cloud_data', (err, value) => {
            if (value) {
                applyData(value);
            } else {
                applyData(localStorage.getItem('spicy_user_profile'));
            }
        });
    } else {
        applyData(localStorage.getItem('spicy_user_profile'));
    }
}

function saveProfileDirect() {
    saveProfileCloud();
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// ۳. سیستم Daily Check-in کامل با منطق دریافت جوایز
function openDailyModal() {
    document.getElementById('daily-modal').classList.add('active');
    renderDailyGrid();
    updateDailyTimer();
}

function closeDailyModal() {
    document.getElementById('daily-modal').classList.remove('active');
    if (timerInterval) clearInterval(timerInterval);
}

function renderDailyGrid() {
    const grid = document.getElementById('daily-grid');
    grid.innerHTML = DAILY_REWARDS.map((item, idx) => {
        const isClaimed = idx < dailyStreak;
        const isCurrent = idx === dailyStreak;
        return `
            <div class="daily-item ${isClaimed ? 'claimed' : ''} ${isCurrent ? 'current' : ''}">
                <span class="day-num">Day ${item.day}</span>
                <span class="reward-icon">${isClaimed ? '✓' : item.icon}</span>
                <span class="reward-text">${item.text}</span>
            </div>
        `;
    }).join('');
}

function updateDailyTimer() {
    const btn = document.getElementById('daily-claim-btn');
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const diff = now - lastClaimTimestamp;

    if (diff >= cooldown || lastClaimTimestamp === 0) {
        btn.innerText = "دریافت پاداش امروز 🎉";
        btn.classList.add('active');
        btn.disabled = false;
    } else {
        btn.classList.remove('active');
        btn.disabled = true;
        
        if (timerInterval) clearInterval(timerInterval);
        
        timerInterval = setInterval(() => {
            const currentDiff = Date.now() - lastClaimTimestamp;
            const remaining = cooldown - currentDiff;

            if (remaining <= 0) {
                clearInterval(timerInterval);
                btn.innerText = "دریافت پاداش امروز 🎉";
                btn.classList.add('active');
                btn.disabled = false;
            } else {
                const h = Math.floor(remaining / (1000 * 60 * 60));
                const m = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((remaining % (1000 * 60)) / 1000);
                btn.innerText = `پاداش بعدی در ${h}H ${m}M ${s}S`;
            }
        }, 1000);
    }
}

function claimDailyReward() {
    const reward = DAILY_REWARDS[dailyStreak % DAILY_REWARDS.length];

    if (reward.type === "stars") {
        userStars += reward.amount;
        showToast(`پاداش امروز: +${reward.amount} ستاره ⭐️`, "⭐");
    } else {
        userEnergy += reward.amount;
        showToast(`پاداش امروز: +${reward.amount} انرژی ⚡`, "⚡");
    }

    lastClaimTimestamp = Date.now();
    dailyStreak = (dailyStreak + 1) % 17;
    
    updateHeaderStats();
    saveProfileCloud();
    renderDailyGrid();
    updateDailyTimer();
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

// ۴. مدیریت تب‌ها و بخش‌های کاربردی
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabViews = document.querySelectorAll('.tab-view');

    navItems.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            navItems.forEach(btn => btn.classList.remove('active'));
            tabViews.forEach(view => view.classList.remove('active'));

            button.classList.add('active');
            const activeView = document.getElementById(`tab-${targetTab}`);
            if (activeView) activeView.classList.add('active');
        });
    });
}

function populateCities() {
    const filterCitySelect = document.getElementById('filter-city');
    const userCitySelect = document.getElementById('user-city');

    const sortedCities = IRAN_CITIES.sort();

    if (filterCitySelect) {
        filterCitySelect.innerHTML = '<option value="all">همه شهرها 📍</option>';
        sortedCities.forEach(city => filterCitySelect.add(new Option(city, city)));
    }

    if (userCitySelect) {
        userCitySelect.innerHTML = '';
        sortedCities.forEach(city => userCitySelect.add(new Option(city, city)));
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
            <button class="btn-report-flag" onclick="reportUser()">🚩 گزارش</button>
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
        likedUsersList.push(user);
        renderFavorites();
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
        return;
    }
    if (historyStack.length === 0) return;
    const lastUser = historyStack.pop();
    suggestedUsersQueue.unshift(lastUser);
    renderNextCard();
}

function renderFavorites() {
    const favContainer = document.getElementById('favorites-container');
    if (!favContainer) return;

    if (likedUsersList.length === 0) {
        favContainer.innerHTML = '<p style="color:var(--text-secondary); font-size:12px; grid-column: 1/-1;">هنوز کسی را لایک نکرده‌اید.</p>';
        return;
    }

    favContainer.innerHTML = likedUsersList.map(u => `
        <div style="background:var(--bg-card); border-radius:12px; overflow:hidden; border:1px solid var(--border-color);">
            <img src="${u.photo}" style="width:100%; height:120px; object-fit:cover;">
            <div style="padding:8px;">
                <b style="font-size:13px;">${u.name}، ${u.age}</b>
                <p style="font-size:10px; color:var(--text-secondary); margin-top:2px;">📍 ${u.city}</p>
            </div>
        </div>
    `).join('');
}

function reportUser() {
    showToast("کاربر گزارش و مسدود شد.", "🚩");
    suggestedUsersQueue.shift();
    renderNextCard();
}

function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profile-avatar').src = e.target.result;
            saveProfileDirect();
        };
        reader.readAsDataURL(file);
    }
}

function shareReferralLink() {
    if (tg) tg.openTelegramLink("https://t.me/share/url?url=https://t.me/SpicyDateBot");
}

function joinChannel() {
    if (tg) tg.openTelegramLink("https://t.me/SpicyDateChannel");
}
