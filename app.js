// ==========================================
// Spicy Date 🌶️ - Complete App Logic
// ==========================================

const API_BASE_URL = 'https://spicy-date-api.onrender.com';
const STORAGE_KEY = 'spicy_user_profile_data_v1';

// لیست شهرهای ایران
const IRAN_CITIES = [
    "تهران", "مشهد", "اصفهان", "کرج", "شیراز", "تبریز", "قم", "اهواز", 
    "کرمانشاه", "ارومیه", "رشت", "زاهدان", "همدان", "کرمان", "یزد", 
    "اردبیل", "بندرعباس", "اراک", "زنجان", "سنندج", "قزوین", "خرم‌آباد", 
    "گرگان", "ساری", "بجنورد", "بوشهر", "بیرجند", "ایلام", "شهرکرد", "سمنان", "یاسوج"
];

// لیست ۱۰ تایی علاقه‌مندی‌ها
const ALL_INTERESTS = [
    "☕ کافه‌گردی", "🎮 گیمینگ", "🎧 موسیقی", "✈️ سفر", 
    "🏋️ ورزش", "📸 عکاسی", "🍕 آشپزی", "🎬 فیلم و سریال", 
    "📚 کتابخوانی", "🎨 هنر و طراحی"
];

const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

function triggerHaptic(type = 'light') {
    if (tg?.HapticFeedback) {
        if (type === 'heavy') tg.HapticFeedback.impactOccurred('heavy');
        else if (type === 'medium') tg.HapticFeedback.impactOccurred('medium');
        else if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        else if (type === 'error') tg.HapticFeedback.notificationOccurred('error');
        else tg.HapticFeedback.impactOccurred('light');
    }
}

// بارگذاری پروفایل از Storage جهت ماندگاری داده‌ها
function loadStoredProfile() {
    const defaultData = {
        name: tg?.initDataUnsafe?.user?.first_name || "کاربر اسپایسی",
        age: 24,
        gender: "زن",
        city: "تهران",
        bio: "عاشق چالش‌های گیمینگ و کافه‌گردی ☕🎮",
        isVip: false,
        image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=600&q=80",
        interests: ["🎧 موسیقی", "🎮 گیمینگ", "☕ کافه‌گردی"],
        likesReceived: 12,
        matches: 4,
        superLikes: 2
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            return { ...defaultData, ...JSON.parse(saved) };
        } catch (e) {
            return defaultData;
        }
    }
    return defaultData;
}

let myProfileData = loadStoredProfile();
let tempSelectedInterests = [...myProfileData.interests];

function saveProfileToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(myProfileData));
}

// نمایش اطلاعات پروفایل روی صفحه
function renderProfileUI() {
    const profileImg = document.getElementById('profile-img');
    const profileNameAge = document.getElementById('profile-name-age');
    const profileBio = document.getElementById('profile-bio');
    const profileCity = document.getElementById('profile-city');
    const profileGender = document.getElementById('profile-gender');
    const profileVipBadge = document.getElementById('profile-vip-badge');
    const profileInterests = document.getElementById('profile-interests');

    if (profileImg) profileImg.src = myProfileData.image;
    if (profileNameAge) profileNameAge.innerText = `${myProfileData.name}، ${myProfileData.age}`;
    if (profileBio) profileBio.innerText = myProfileData.bio || "بیوگرافی هنوز ثبت نشده است.";
    if (profileCity) profileCity.innerText = `📍 ${myProfileData.city}`;
    if (profileGender) profileGender.innerText = `| ${myProfileData.gender === 'مرد' ? '♂️ مرد' : '♀️ زن'}`;

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

// پر کردن لیست‌های کشویی فرم ویرایش
function populateDropdowns() {
    const ageSelect = document.getElementById('input-edit-age');
    const citySelect = document.getElementById('input-edit-city');

    if (ageSelect && ageSelect.options.length === 0) {
        for (let i = 18; i <= 60; i++) {
            const opt = document.createElement('option');
            opt.value = i;
            opt.innerText = i;
            ageSelect.appendChild(opt);
        }
    }

    if (citySelect && citySelect.options.length === 0) {
        IRAN_CITIES.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city;
            opt.innerText = city;
            citySelect.appendChild(opt);
        });
    }
}

function setupEditProfileModal() {
    populateDropdowns();

    const nameInput = document.getElementById('input-edit-name');
    const ageSelect = document.getElementById('input-edit-age');
    const genderSelect = document.getElementById('input-edit-gender');
    const citySelect = document.getElementById('input-edit-city');
    const bioInput = document.getElementById('input-edit-bio');
    const charCountEl = document.getElementById('bio-char-count');

    if (nameInput) nameInput.value = myProfileData.name;
    if (ageSelect) ageSelect.value = myProfileData.age;
    if (genderSelect) genderSelect.value = myProfileData.gender || 'زن';
    if (citySelect) citySelect.value = myProfileData.city;
    
    if (bioInput) {
        bioInput.value = myProfileData.bio || '';
        if (charCountEl) charCountEl.innerText = `${bioInput.value.length}/100`;
    }

    tempSelectedInterests = [...myProfileData.interests];
    renderInterestsSelector();
}

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

function saveUserProfile() {
    const nameInput = document.getElementById('input-edit-name')?.value;
    const ageSelect = document.getElementById('input-edit-age')?.value;
    const genderSelect = document.getElementById('input-edit-gender')?.value;
    const citySelect = document.getElementById('input-edit-city')?.value;
    const bioInput = document.getElementById('input-edit-bio')?.value;

    if (!nameInput || nameInput.trim() === '') {
        showToast('لطفاً نام خود را وارد کنید.', '⚠️');
        return;
    }

    myProfileData.name = nameInput.trim();
    myProfileData.age = parseInt(ageSelect) || 24;
    myProfileData.gender = genderSelect || 'زن';
    myProfileData.city = citySelect || 'تهران';
    myProfileData.bio = bioInput ? bioInput.trim() : '';
    myProfileData.interests = [...tempSelectedInterests];

    saveProfileToStorage();
    renderProfileUI();

    document.getElementById('edit-profile-modal')?.classList.add('hidden');
    showToast('اطلاعات با موفقیت ذخیره شد! ✨', '✅');
}

// ناوبری و مدیریت تب‌ها
function switchTab(tabName) {
    triggerHaptic('light');

    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.classList.add('active');

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

    renderProfileUI();

    // کلیک روی تب‌های پایین
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // دکمه بازگشت در هدر
    document.getElementById('btn-back-header')?.addEventListener('click', () => {
        switchTab('explore');
    });

    // باز کردن مودال ویرایش
    document.getElementById('btn-open-edit-modal')?.addEventListener('click', () => {
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

    // آپلود مستقیم عکس با کلیک روی مداد عکس
    document.getElementById('direct-avatar-upload')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                myProfileData.image = event.target.result;
                saveProfileToStorage();
                renderProfileUI();
                showToast('عکس پروفایل به‌روزرسانی شد! 📸', '✅');
            };
            reader.readAsDataURL(file);
        }
    });

    // شمارنده حروف بیوگرافی
    document.getElementById('input-edit-bio')?.addEventListener('input', (e) => {
        const charCountEl = document.getElementById('bio-char-count');
        if (charCountEl) charCountEl.innerText = `${e.target.value.length}/100`;
    });
});
