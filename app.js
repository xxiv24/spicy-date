// ==========================================
// اتصال فرانت‌اند به API سرور
// ==========================================
const API_BASE_URL = 'https://spicy-date-api.onrender.com';

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

document.addEventListener('DOMContentLoaded', () => {
    authenticateUser();
});

// ==========================================
// ۱. تنظیمات Telegram SDK
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
// ۲. داده‌های نمونه (Mock Data) + سیستم مدیریت پروفایل‌ها
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

// دریافت لیست پروفایل‌ها از API (با پشتیبانی از Mock Data)
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
            console.warn("خطا در دریافت پروفایل‌ها از سرور، استفاده از داده‌های نمونه:", err);
        }
    }
    // در صورت عدم اتصال به API یا خالی بودن پاسخ
    profilesList = mockUsers;
    currentUserIndex = 0;
    renderCard();
}

// ارسال اکشن (لایک/رد/سوپرلایک) به API
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
// ۳. مدیریت تب‌ها و ناوبری
// ==========================================
function switchTab(tabName) {
    triggerHaptic('light');

    // مخفی کردن تمام تب‌ها
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // فعال‌سازی تب موردنظر
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // استایل دکمه‌های ناوبری
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
// ۴. رندر کارت و سواپ
// ==========================================
function renderCard() {
    if (!profilesList || profilesList.length === 0) return;

    if (currentUserIndex >= profilesList.length) {
        currentUserIndex = 0; // چرخش یا لود مجدد
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
// ۵. اعلانات (Toast)
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
// ۶. مدیریت بازی دوز
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
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    return wins.some(combo => {
        const [a, b, c] = combo;
        return tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c];
    });
}

// ==========================================
// ۷. مقداردهی اولیه برنامه
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    fetchProfiles();

    // کلیک روی دکمه‌های ناوبری پایینی
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // دکمه‌های کارت
    document.getElementById('btn-like')?.addEventListener('click', () => nextCard('like'));
    document.getElementById('btn-pass')?.addEventListener('click', () => nextCard('pass'));
    document.getElementById('btn-super')?.addEventListener('click', () => nextCard('super'));

    // بازی‌ها
    document.getElementById('game-tictactoe')?.addEventListener('click', () => {
        triggerHaptic('medium');
        initTicTacToe();
        document.getElementById('tictactoe-modal').classList.remove('hidden');
    });

    document.getElementById('btn-close-tictactoe')?.addEventListener('click', () => {
        triggerHaptic('light');
        document.getElementById('tictactoe-modal').classList.add('hidden');
    });

    document.getElementById('btn-reset-ttt')?.addEventListener('click', () => {
        triggerHaptic('light');
        initTicTacToe();
    });

    document.getElementById('game-truth-or-dare')?.addEventListener('click', () => {
        triggerHaptic('medium');
        document.getElementById('tod-modal').classList.remove('hidden');
    });

    document.getElementById('btn-close-tod')?.addEventListener('click', () => {
        triggerHaptic('light');
        document.getElementById('tod-modal').classList.add('hidden');
    });

    document.getElementById('game-rps')?.addEventListener('click', () => {
        triggerHaptic('medium');
        document.getElementById('rps-modal').classList.remove('hidden');
    });

    document.getElementById('btn-close-rps')?.addEventListener('click', () => {
        triggerHaptic('light');
        document.getElementById('rps-modal').classList.add('hidden');
    });

    document.getElementById('btn-play-voice')?.addEventListener('click', () => {
        triggerHaptic('medium');
        showToast('پخش وویس ۱۵ ثانیه‌ای... 🎧');
    });
});
