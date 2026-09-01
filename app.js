// ==========================================
// Spicy Date 🌶️ - Complete App Logic
// ==========================================

const API_BASE_URL = 'https://spicy-date-api.onrender.com';

// لیست ۱۰ تایی علاقه مندی های استاندارد
const ALL_INTERESTS = [
    "☕ کافه‌گردی",
    "🎮 گیمینگ",
    "🎧 موسیقی",
    "✈️ سفر",
    "🏋️ ورزش",
    "📸 عکاسی",
    "🍕 آشپزی",
    "🎬 فیلم و سریال",
    "📚 کتابخوانی",
    "🎨 هنر و طراحی"
];

// احراز هویت با تلگرام
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
// Telegram SDK
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
// داده‌های نمونه اکسپلور
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

// داده‌های پروفایل کاربر متصل
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
    superLikes: 2
};

let tempSelectedInterests = [...myProfileData.interests];
let tempAvatarBase64 = null;

// دریافت پروفایل‌های اکسپلور
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
// مدیریت پروفایل کاربر
// ==========================================
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

function renderProfileUI() {
    const profileImg = document.getElementById('profile-img');
    const profileName = document.getElementById('profile-name');
    const profileBio = document.getElementById('profile-bio');
    const profileCity = document.getElementById('profile-city');
    const profileVipBadge = document.getElementById('profile-vip-badge');
    const profileInterests = document.getElementById('profile-interests');

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
            profileVipBadge.className = 'inline-block text-[10px] bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-bold px-3 py-1 rounded-full';
        } else {
            profileVipBadge.innerText = 'اشتراک معمولی';
            profileVipBadge.className = 'inline-block text-[10px] bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-white/10';
        }
    }

    if (profileInterests && myProfileData.interests) {
        profileInterests.innerHTML = myProfileData.interests.map(tag =>
            `<span class="text-[10px] bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20">${tag}</span>`
        ).join('');
    }
}

// آماده‌سازی مودال ویرایش پروفایل
function setupEditProfileModal() {
    const editNameInput = document.getElementById('input-edit-name');
    const editBioInput = document.getElementById('input-edit-bio');
    const editPreviewImg = document.getElementById('edit-preview-img');
    const charCountEl = document.getElementById('bio-char-count');

    if (editNameInput) editNameInput.value = myProfileData.name;
    if (editBioInput) {
        editBioInput.value = myProfileData.bio || '';
        if (charCountEl) charCountEl.innerText = `${editBioInput.value.length}/100`;
    }
    if (editPreviewImg) editPreviewImg.src = myProfileData.image;

    tempSelectedInterests = [...myProfileData.interests];
    renderInterestsSelector();
}

// رندر انتخابی تگ‌های علاقه مندی (حداکثر ۳ تایی)
function renderInterestsSelector() {
    const container = document.getElementById('interests-selector');
    if (!container) return;

    container.innerHTML = ALL_INTERESTS.map(tag => {
        const isSelected = tempSelectedInterests.includes(tag);
        return `
            <span data-tag="${tag}" class="interest-chip text-[10px] px-2.5 py-1 rounded-full border border-white/10 ${isSelected ? 'selected' : 'bg-white/5 text-gray-300'}">
                ${tag}
            </span>
        `;
    }).join('');

    // رویداد کلیک روی تگ‌ها
    container.querySelectorAll('.interest-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.getAttribute('data-tag');
            if (tempSelectedInterests.includes(tag)) {
                tempSelectedInterests = tempSelectedInterests.filter(t => t !== tag);
            } else {
                if (tempSelectedInterests.length >= 3) {
                    triggerHaptic('error');
                    showToast('حداکثر ۳ علاقه‌مندی قابل انتخاب است!', '⚠️');
                    return;
                }
                tempSelectedInterests.push(tag);
            }
            triggerHaptic('light');
            renderInterestsSelector();
        });
    });
}

// ذخیره‌سازی فرم ویرایش پروفایل
async function saveUserProfile() {
    const nameInput = document.getElementById('input-edit-name')?.value;
    const bioInput = document.getElementById('input-edit-bio')?.value;

    if (!nameInput || nameInput.trim() === '') {
        showToast('لطفاً نام خود را وارد کنید.', '⚠️');
        return;
    }

    myProfileData.name = nameInput.trim();
    myProfileData.bio = bioInput ? bioInput.trim() : '';
    myProfileData.interests = [...tempSelectedInterests];

    if (tempAvatarBase64) {
        myProfileData.image = tempAvatarBase64;
    }

    renderProfileUI();
    document.getElementById('edit-profile-modal')?.classList.add('hidden');
    showToast('پروفایل با موفقیت ذخیره شد! ✨', '✅');

    // ارسال به API در صورت اتصال
    const token = localStorage.getItem('spicy_token');
    if (!token) return;

    try {
        await fetch(`${API_BASE_URL}/api/users/me`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                name: myProfileData.name,
                bio: myProfileData.bio,
                interests: myProfileData.interests,
                image: myProfileData.image
            })
        });
    } catch (err) {
        console.error("خطا در به‌روزرسانی پروفایل در سرور:", err);
    }
}

// ==========================================
// ناوبری و تب‌ها
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
// کارت‌های اکسپلور
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

// Toast
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
// مقداردهی اولیه برنامه
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    fetchProfiles();

    // کلیک روی تب‌ها
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
            if (tabName === 'profile') {
                renderProfileUI();
            }
        });
    });

    // اکسپلور
    document.getElementById('btn-like')?.addEventListener('click', () => nextCard('like'));
    document.getElementById('btn-pass')?.addEventListener('click', () => nextCard('pass'));
    document.getElementById('btn-super')?.addEventListener('click', () => nextCard('super'));
    document.getElementById('btn-card-play-voice')?.addEventListener('click', () => {
        triggerHaptic('medium');
        showToast('پخش صدای ۱۵ ثانیه‌ای... 🎙️');
    });

    // پروفایل و مودال ویرایش
    document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
        triggerHaptic('medium');
        setupEditProfileModal();
        document.getElementById('edit-profile-modal')?.classList.remove('hidden');
    });

    document.getElementById('btn-close-edit-profile')?.addEventListener('click', () => {
        triggerHaptic('light');
        document.getElementById('edit-profile-modal')?.classList.add('hidden');
    });

    document.getElementById('btn-save-edit-profile')?.addEventListener('click', () => {
        triggerHaptic('success');
        saveUserProfile();
    });

    // شمارنده حروف بیوگرافی
    document.getElementById('input-edit-bio')?.addEventListener('input', (e) => {
        const charCountEl = document.getElementById('bio-char-count');
        if (charCountEl) {
            charCountEl.innerText = `${e.target.value.length}/100`;
        }
    });

    // پیش‌نمایش آپلود عکس
    document.getElementById('input-avatar-file')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                tempAvatarBase64 = event.target.result;
                const previewImg = document.getElementById('edit-preview-img');
                if (previewImg) previewImg.src = tempAvatarBase64;
                showToast('پیش‌نمایش عکس بارگذاری شد!', '📸');
            };
            reader.readAsDataURL(file);
        }
    });

    // ضبط و شنیدن ویس در پروفایل
    let isRecording = false;
    document.getElementById('btn-record-voice')?.addEventListener('click', () => {
        triggerHaptic('heavy');
        const btn = document.getElementById('btn-record-voice');
        const timer = document.getElementById('voice-timer');
        
        if (!isRecording) {
            isRecording = true;
            btn.classList.add('recording-pulse');
            btn.innerHTML = '<span>⏹️</span> توقف ضبط';
            showToast('در حال ضبط صدای ۱۵ ثانیه‌ای... 🎙️', '🔴');
            
            let sec = 15;
            const interval = setInterval(() => {
                sec--;
                if (timer) timer.innerText = `00:${sec < 10 ? '0' + sec : sec}`;
                if (sec <= 0 || !isRecording) {
                    clearInterval(interval);
                    isRecording = false;
                    btn.classList.remove('recording-pulse');
                    btn.innerHTML = '<span>🎙️</span> شروع ضبط';
                    if (timer) timer.innerText = '00:15';
                    showToast('ضبط صدا انجام شد! 🎧', '✅');
                }
            }, 1000);
        } else {
            isRecording = false;
        }
    });

    document.getElementById('btn-play-voice')?.addEventListener('click', () => {
        triggerHaptic('medium');
        showToast('پخش صدای ثبت شده... 🎧');
    });

    document.getElementById('btn-stars-subscribe')?.addEventListener('click', () => {
        triggerHaptic('heavy');
        showToast('انتقال به درگاه Telegram Stars... 🌟', '⭐');
    });
});
