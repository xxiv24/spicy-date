// ==========================================
// Spicy Date 🌶️ - Complete App Logic
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
            loadUserProfile();
        }
    } catch (err) {
        console.error("خطا در ارتباط با API:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    authenticateUser();
});

// ==========================================
// ۲. تنظیمات Telegram SDK
// ==========================================
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
    try {
        tg.enableClosingConfirmation();
    } catch (e) {
        console.log("Closing confirmation error:", e);
    }
}

// تابع ایجاد بازخورد لمسی (Haptic Feedback)
function triggerHaptic(type = 'light') {
    if (tg?.HapticFeedback) {
        if (type === 'heavy') tg.HapticFeedback.impactOccurred('heavy');
        else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
        else if (type === 'error') tg.HapticFeedback.notificationOccurred('error');
        else if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred('light');
    }
}

// ==========================================
// ۳. داده‌های نمونه (Mock Data) اکسپلور
// ==========================================
const mockUsers = [
    {
        id: "1",
        name: "سارا",
        age: 23,
        city: "تهران",
        isVip: true,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
        interests: ["☕ کافه‌گردی", "🎧 موسیقی", "✈️ سفر"]
    },
    {
        id: "2",
        name: "علی",
        age: 26,
        city: "شیراز",
        isVip: false,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        interests: ["🎮 گیمینگ", "🍕 آشپزی"]
    },
    {
        id: "3",
        name: "مریم",
        age: 21,
        city: "اصفهان",
        isVip: true,
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
        interests: ["📸 عکاسی", "☕ کافه‌گردی"]
    }
];

let profilesList = [];
let currentUserIndex = 0;

// داده‌های پروفایل کاربر متصل (کاربر جاری)
let myProfileData = {
    name: tg?.initDataUnsafe?.user?.first_name || "کاربر اسپایسی",
    age: 24,
    city: "تهران",
    bio: "عاشق چالش‌های گیمینگ و کافه‌گردی ☕🎮",
    isVip: false,
    image: tg?.initDataUnsafe?.user?.photo_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80",
    interests: ["🎧 موسیقی", "🎮 گیمینگ", "☕ کافه‌گردی"],
    likesReceived: 12,
    matches: 4,
    superLikes: 2,
    filters: {
        gender: "all",
        minAge: 18,
        maxAge: 35
    }
};

// دریافت لیست کاربران اکسپلور
async function fetchProfiles() {
    const token = localStorage.getItem('spicy_token');
    if (token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/explore`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.profiles && data.profiles.length > 0) {
                profilesList = data.profiles;
                currentUserIndex = 0;
                renderCard();
                return;
            }
        } catch (err) {
            console.warn("استفاده از داده‌های نمونه به دلیل عدم اتصال API اکسپلور:", err);
        }
    }
    profilesList = mockUsers;
    currentUserIndex = 0;
    renderCard();
}

// ثبت اکشن لایک/رد/سوپرلایک
async function sendActionToAPI(targetUserId, actionType) {
    const token = localStorage.getItem('spicy_token');
    if (!token) return;

    try {
        await fetch(`${API_BASE_URL}/api/users/action`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ targetUserId, action: actionType })
        });
    } catch (err) {
        console.error("خطا در ثبت اکشن:", err);
    }
}

// ==========================================
// ۴. سیستم مدیریت کامل پروفایل کاربر
// ==========================================

// دریافت اطلاعات کامل پروفایل از API
async function loadUserProfile() {
    const token = localStorage.getItem('spicy_token');
    if (token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.user) {
                myProfileData = { ...myProfileData, ...data.user };
            }
        } catch (err) {
            console.warn("خطا در دریافت پروفایل شخصی از API:", err);
        }
    }
    renderProfileUI();
}

// رندر کامل صفحه پروفایل
function renderProfileUI() {
    const profileImg = document.getElementById('profile-img');
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');
    const profileCity = document.getElementById('profile-city');
    const profileVipBadge = document.getElementById('profile-vip-badge');
    const profileInterests = document.getElementById('profile-interests');

    // آمار پروفایل
    const statLikes = document.getElementById('stat-likes');
    const statMatches = document.getElementById('stat-matches');
    const statSuperlikes = document.getElementById('stat-superlikes');

    if (profileImg) profileImg.src = myProfileData.image;
    if (profileName) profileName.innerText = `${myProfileData.name}، ${myProfileData.age}`;
    if (profileBio) profileBio.innerText = myProfileData.bio || "بیوگرافی هنوز ثبت نشده است.";
    if (profileCity) profileCity.innerText = `📍 ${myProfileData.city}`;

    if (statLikes) statLikes.innerText = myProfileData.likesReceived || 0;
    if (statMatches) statMatches.innerText = myProfileData.matches || 0;
    if (statSuperlikes) statSuperlikes.innerText = myProfileData.superLikes || 0;

    if (profileVipBadge) {
        if (myProfileData.isVip) {
            profileVipBadge.innerText = 'اشتراک VIP 👑';
            profileVipBadge.classList.remove('bg-gray-700', 'text-gray-300');
            profileVipBadge.classList.add('bg-gradient-to-r', 'from-amber-500', 'to-yellow-300', 'text-black', 'font-bold');
        } else {
            profileVipBadge.innerText = 'اشتراک معمولی';
        }
    }

    if (profileInterests && myProfileData.interests) {
        profileInterests.innerHTML = myProfileData.interests.map(tag =>
            `<span class="text-[10px] bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20">${tag}</span>`
        ).join('');
    }
}

// ذخیره فرم ویرایش پروفایل
async function saveUserProfile(updatedData) {
    myProfileData = { ...myProfileData, ...updatedData };
    renderProfileUI();
    showToast('پروفایل با موفقیت بروزرسانی شد! ✨', '✅');

    const token = localStorage.getItem('spicy_token');
    if (!token) return;

    try {
        await fetch(`${API_BASE_URL}/api/users/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });
    } catch (err) {
        console.error("خطا در ارسال ویرایش پروفایل به سرور:", err);
    }
}

// ==========================================
// ۵. مدیریت تب‌ها و ناوبری
// ==========================================
function switchTab(tabName) {
    triggerHaptic('light');

    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.classList.remove('text-red-500', 'active');
        btn.classList.add('text-gray-400');
    });

    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400');
        activeBtn.classList.add('text-red-500', 'active');
    }
}

// ==========================================
// ۶. رندر کارت و سواپ (اکسپلور)
// ==========================================
function renderCard() {
    if (!profilesList || profilesList.length === 0) return;

    if (currentUserIndex >= profilesList.length) {
        currentUserIndex = 0;
    }

    const user = profilesList[currentUserIndex];
    const cardImg = document.getElementById('card-img');
    const cardName = document.getElementById('card-name');
    const cardLoc = document.getElementById('card-location');
    const cardInterests = document.getElementById('card-interests');
    const vipBadge = document.getElementById('vip-badge');

    if (cardImg) cardImg.src = user.image || user.avatar || 'https://via.placeholder.com/600';
    if (cardName) cardName.innerText = `${user.name}، ${user.age}`;
    if (cardLoc) cardLoc.innerText = `📍 ${user.city || 'ایران'}`;

    if (vipBadge) {
        if (user.isVip) vipBadge.classList.remove('hidden');
        else vipBadge.classList.add('hidden');
    }

    if (cardInterests && user.interests) {
        cardInterests.innerHTML = user.interests.map(tag =>
            `<span class="text-[9px] bg-white/10 px-2.5 py-1 rounded-full border border-white/5">${tag}</span>`
        ).join('');
    }
}

function nextCard(action) {
    const card = document.getElementById('user-card');
    if (!card || profilesList.length === 0) return;

    const currentProfile = profilesList[currentUserIndex];

    if (action === 'like') {
        triggerHaptic('heavy');
        card.classList.add('card-swipe-right');
        showToast('لایک ارسال شد! 🌶️');
        if (currentProfile?.id) sendActionToAPI(currentProfile.id, 'like');
    } else if (action === 'pass') {
        triggerHaptic('medium');
        card.classList.add('card-swipe-left');
        if (currentProfile?.id) sendActionToAPI(currentProfile.id, 'pass');
    } else if (action === 'super') {
        triggerHaptic('success');
        card.classList.add('card-swipe-right');
        showToast('سوپرلایک فرستاده شد! ⭐');
        if (currentProfile?.id) sendActionToAPI(currentProfile.id, 'superlike');
    }

    setTimeout(() => {
        currentUserIndex++;
        renderCard();
        card.classList.remove('card-swipe-right', 'card-swipe-left');
    }, 300);
}

// ==========================================
// ۷. اعلانات (Toast)
// ==========================================
function showToast(message, icon = '🌶️') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');

    if (toast && toastMsg) {
        toastMsg.innerText = message;
        if (toastIcon) toastIcon.innerText = icon;

        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }
}

// ==========================================
// ۸. مدیریت بازی دوز
// ==========================================
let tttBoard = Array(9).fill(null);
let tttTurn = '❌';

function initTicTacToe() {
    const boardEl = document.getElementById('ttt-board');
    if (!boardEl) return;

    boardEl.innerHTML = '';
    tttBoard = Array(9).fill(null);
    tttTurn = '❌';
    document.getElementById('ttt-status').innerText = `نوبت: ${tttTurn}`;

    for (let i = 0; i < 9; i++) {
        const cell = document.createElement('div');
        cell.className = 'tictactoe-cell spicy-card rounded-xl';
        cell.onclick = () => makeTTTMove(i, cell);
        boardEl.appendChild(cell);
    }
}

function makeTTTMove(index, cellEl) {
    if (tttBoard[index]) return;

    triggerHaptic('light');
    tttBoard[index] = tttTurn;
    cellEl.innerText = tttTurn;
    cellEl.classList.add('disabled');

    if (checkTTTWinner()) {
        triggerHaptic('success');
        document.getElementById('ttt-status').innerText = `برنده: ${tttTurn} 🎉`;
        return;
    }

    tttTurn = tttTurn === '❌' ? '⭕' : '❌';
    document.getElementById('ttt-status').innerText = `نوبت: ${tttTurn}`;
}

function checkTTTWinner() {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    return wins.some(combo => {
        const [a, b, c] = combo;
        return tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c];
    });
}

// ==========================================
// ۹. مقداردهی اولیه برنامه
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    fetchProfiles();

    // کلیک روی دکمه‌های ناوبری پایینی
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
            if (tabName === 'profile') {
                renderProfileUI();
            }
        });
    });

    // دکمه‌های کارت اکسپلور
    document.getElementById('btn-like')?.addEventListener('click', () => nextCard('like'));
    document.getElementById('btn-pass')?.addEventListener('click', () => nextCard('pass'));
    document.getElementById('btn-super')?.addEventListener('click', () => nextCard('super'));

    // دکمه‌های پروفایل
    document.getElementById('btn-buy-vip')?.addEventListener('click', () => {
        triggerHaptic('heavy');
        showToast('انتقال به پرداخت با Telegram Stars... 🌟', '⭐');
    });

    document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
        triggerHaptic('medium');
        document.getElementById('edit-profile-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-edit-profile')?.addEventListener('click', () => {
        triggerHaptic('light');
        document.getElementById('edit-profile-modal')?.classList.add('hidden');
    });

    // ضبط وویس پروفایل
    document.getElementById('btn-record-voice')?.addEventListener('click', () => {
        triggerHaptic('medium');
        showToast('ضبط صدای ۱۵ ثانیه‌ای شروع شد... 🎙️', '🎤');
    });

    // بازی‌ها
    document.getElementById('game-tictactoe')?.addEventListener('click', () => {
        triggerHaptic('medium');
        initTicTacToe();
        document.getElementById('tictactoe-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-tictactoe')?.addEventListener('click', () => {
        triggerHaptic('light');
        document.getElementById('tictactoe-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-reset-ttt')?.addEventListener('click', () => {
        triggerHaptic('light');
        initTicTacToe();
    });

    document.getElementById('game-truth-or-dare')?.addEventListener('click', () => {
        triggerHaptic('medium');
        document.getElementById('tod-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-tod')?.addEventListener('click', () => {
        triggerHaptic('light');
        document.getElementById('tod-modal')?.classList.add('hidden');
    });

    document.getElementById('game-rps')?.addEventListener('click', () => {
        triggerHaptic('medium');
        document.getElementById('rps-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-rps')?.addEventListener('click', () => {
        triggerHaptic('light');
        document.getElementById('rps-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-play-voice')?.addEventListener('click', () => {
        triggerHaptic('medium');
        showToast('پخش وویس ۱۵ ثانیه‌ای... 🎧');
    });
});
