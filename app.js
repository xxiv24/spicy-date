const tg = window.Telegram?.WebApp;

// تنظیمات کامل جهت فیت شدن مینی اپ روی تلگرام
if (tg) {
    tg.ready();
    tg.expand();
    if (tg.requestFullscreen) {
        tg.requestFullscreen(); // متد اختصاصی جدید تلگرام برای فول‌اسکرین شدن
    }
}

// دیتای پاداش روزانه
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
    lastClaimDate: null, // تاریخ آخرین دریافت فرمت YYYY-MM-DD
    streak: 0
};

document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    loadUserData();
    
    // هماهنگی با لودینگ
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) splash.style.opacity = '0';
        setTimeout(() => splash.style.display = 'none', 400);
    }, 1000);
});

// ذره‌های ریز ستاره‌ای مثل پس‌زمینه عکس نمونه
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

    const stars = Array.from({ length: 30 }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.5,
        alpha: Math.random()
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

function updateUI() {
    document.getElementById('txt-energy').innerText = userData.energy;
    document.getElementById('txt-stars').innerText = userData.stars;
}

// منطق دقیق Daily Check-in بر اساس روز تقویمی
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
                <span>روز ${r.day}</span>
                <span style="font-size:16px; margin:4px 0;">${r.type === 'energy' ? '⚡' : '⭐'}</span>
                <b>+${r.val}</b>
            </div>
        `;
    }).join('');

    const claimBtn = document.getElementById('btn-claim-reward');
    if (canClaim) {
        claimBtn.disabled = false;
        claimBtn.innerText = "دریافت پاداش امروز 🎉";
    } else {
        claimBtn.disabled = true;
        claimBtn.innerText = "فردا مراجعه کنید ⏳";
    }
}

function claimDaily() {
    const today = getTodayString();
    if (userData.lastClaimDate === today) return;

    const currentReward = REWARDS[userData.streak % REWARDS.length];
    
    if (currentReward.type === 'energy') {
        userData.energy += currentReward.val;
    } else {
        userData.stars += currentReward.val;
    }

    userData.streak += 1;
    userData.lastClaimDate = today;

    saveUserData();
    updateUI();
    renderDailySlots();

    if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabId}`)?.classList.add('active');
}

function saveUserData() {
    localStorage.setItem('spicy_user_data', JSON.stringify(userData));
    if (tg?.CloudStorage) {
        tg.CloudStorage.setItem('spicy_user_data', JSON.stringify(userData));
    }
}

function loadUserData() {
    const local = localStorage.getItem('spicy_user_data');
    if (local) {
        userData = { ...userData, ...JSON.parse(local) };
        updateUI();
    }
}
