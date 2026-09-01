// ==========================================
// ۱. تنظیمات و راه‌اندازی Telegram SDK
// ==========================================
const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand(); // تمام‌صفحه کردن مینی‌اپ
    try {
        tg.enableClosingConfirmation(); // هشدار هنگام بستن برنامه
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
// ۲. داده‌های نمونه (Mock Data)
// ==========================================
const mockUsers = [
    {
        id: 1,
        name: "سارا",
        age: 23,
        city: "تهران",
        isVip: true,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
        interests: ["☕ کافه‌گردی", "🎧 موسیقی", "✈️ سفر"],
        voice: "voice_sara.mp3"
    },
    {
        id: 2,
        name: "علی",
        age: 26,
        city: "شیراز",
        isVip: false,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        interests: ["🎮 گیمینگ", "🍕 آشپزی"],
        voice: "voice_ali.mp3"
    },
    {
        id: 3,
        name: "مریم",
        age: 21,
        city: "اصفهان",
        isVip: true,
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
        interests: ["📸 عکاسی", "☕ کافه‌گردی", "🎧 موسیقی"],
        voice: "voice_maryam.mp3"
    }
];

let currentUserIndex = 0;
let userProfile = {
    name: "کاربر جدید",
    age: 24,
    city: "تهران",
    isVip: false,
    interests: ["🎧 موسیقی"]
};

// ==========================================
// ۳. مدیریت تب‌ها و ناوبری
// ==========================================
function switchTab(tabName) {
    triggerHaptic('light');

    // مخفی کردن تمام تب‌ها
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // غیرفعال کردن دکمه‌های ناوبری
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.classList.remove('text-red-500', 'active');
        btn.classList.add('text-gray-400');
    });

    // فعال‌سازی تب انتخابی
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // فعال‌سازی استایل دکمه انتخاب شده
    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400');
        activeBtn.classList.add('text-red-500', 'active');
    }
}

// ==========================================
// ۴. رندر کارت کاربر و انیمیشن سواپ
// ==========================================
function renderCard() {
    if (currentUserIndex >= mockUsers.length) {
        currentUserIndex = 0; // چرخه مجدد کارت‌ها
    }

    const user = mockUsers[currentUserIndex];
    const cardImg = document.getElementById('card-img');
    const cardName = document.getElementById('card-name');
    const cardLoc = document.getElementById('card-location');
    const cardInterests = document.getElementById('card-interests');
    const vipBadge = document.getElementById('vip-badge');

    if (cardImg) cardImg.src = user.image;
    if (cardName) cardName.innerText = `${user.name}، ${user.age}`;
    if (cardLoc) cardLoc.innerText = `📍 ${user.city}`;
    
    if (vipBadge) {
        if (user.isVip) vipBadge.classList.remove('hidden');
        else vipBadge.classList.add('hidden');
    }

    if (cardInterests) {
        cardInterests.innerHTML = user.interests.map(tag => 
            `<span class="text-[9px] bg-white/10 px-2 py-0.5 rounded-full">${tag}</span>`
        ).join('');
    }
}

function nextCard(action) {
    const card = document.getElementById('user-card');
    if (!card) return;

    if (action === 'like') {
        triggerHaptic('heavy');
        card.classList.add('card-swipe-right');
        showToast('لایک ارسال شد! 🌶️');
    } else if (action === 'pass') {
        triggerHaptic('medium');
        card.classList.add('card-swipe-left');
    } else if (action === 'super') {
        triggerHaptic('success');
        card.classList.add('card-swipe-right');
        showToast('سوپرلایک فرستاده شد! ⭐');
    }

    setTimeout(() => {
        currentUserIndex++;
        renderCard();
        card.classList.remove('card-swipe-right', 'card-swipe-left');
    }, 300);
}

// ==========================================
// ۵. سیستم سیستم اعلانات (Toast)
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
// ۶. مدیریت مینی‌گیم‌ها (دوز، سنگ کاغذ قیچی و...)
// ==========================================
// بازی دوز
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
// ۷. ایونت لیسنرها و مقداردهی اولیه
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // لود اولیه‌ کارت‌ها
    renderCard();

    // اتصالات دکمه‌های ناوبری
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // دکمه‌های اکشن کارت
    document.getElementById('btn-like')?.addEventListener('click', () => nextCard('like'));
    document.getElementById('btn-pass')?.addEventListener('click', () => nextCard('pass'));
    document.getElementById('btn-super')?.addEventListener('click', () => nextCard('super'));

    // ورودی و خروج لاگین
    document.getElementById('btn-telegram-login')?.addEventListener('click', () => {
        triggerHaptic('medium');
        document.getElementById('login-screen').classList.add('hidden');
        showToast('خوش آمدید! ⚡');
    });

    document.getElementById('btn-open-register')?.addEventListener('click', () => {
        triggerHaptic('light');
        document.getElementById('register-modal').classList.remove('hidden');
    });

    document.getElementById('btn-close-register')?.addEventListener('click', () => {
        triggerHaptic('light');
        document.getElementById('register-modal').classList.add('hidden');
    });

    // بازی‌ها - مودال‌ها
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

    // دکمه ویس نمونه
    document.getElementById('btn-play-voice')?.addEventListener('click', () => {
        triggerHaptic('medium');
        showToast('پخش وویس ۱۵ ثانیه‌ای... 🎧');
    });
});
