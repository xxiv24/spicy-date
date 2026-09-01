// ==========================================
// Spicy Date 🌶️ - Complete App Logic
// ==========================================

const STORAGE_KEY = 'spicy_user_profile_data_v2';
const TELEGRAM_CHANNEL_URL = 'https://t.me/YOUR_CHANNEL_USERNAME'; // لینک کانال تلگرام شما

const IRAN_CITIES = [
    "تهران", "مشهد", "اصفهان", "کرج", "شیراز", "تبریز", "قم", "اهواز", 
    "کرمانشاه", "ارومیه", "رشت", "زاهدان", "همدان", "کرمان", "یزد", 
    "اردبیل", "بندرعباس", "اراک", "زنجان", "سنندج", "قزوین", "خرم‌آباد", 
    "گرگان", "ساری", "بجنورد", "بوشهر", "بیرجند", "ایلام", "شهرکرد", "سمنان", "یاسوج"
];

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

// بارگذاری پروفایل از Storage
function loadStoredProfile() {
    const defaultData = {
        name: tg?.initDataUnsafe?.user?.first_name || "کاربر اسپایسی",
        age: 24,
        gender: "زن",
        city: "تهران",
        bio: "عاشق چالش‌های گیمینگ و کافه‌گردی ☕🎮",
        isVip: true,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
        interests: ["🎧 موسیقی", "🎮 گیمینگ", "☕ کافه‌گردی"],
        audioBase64: null
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

// متغیرهای ضبط صدا MediaRecorder
let mediaRecorder = null;
let audioChunks = [];
let audioInstance = null;
let recordTimerInterval = null;
let recordSecondsLeft = 15;

function saveProfileToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(myProfileData));
}

// نمایش اطلاعات هم روی پروفایل هم روی کارت اکسپلور (مخاطبان)
function renderProfileUI() {
    // ۱. به‌روزرسانی بخش پروفایل
    const profileImg = document.getElementById('profile-img');
    const profileNameAge = document.getElementById('profile-name-age');
    const profileBio = document.getElementById('profile-bio');
    const profileCity = document.getElementById('profile-city');
    const profileGender = document.getElementById('profile-gender');
    const profileVipBadge = document.getElementById('profile-vip-badge');
    const profileInterests = document.getElementById('profile-interests');

    if (profileImg) profileImg.src = myProfileData.image;
    if (profileNameAge) profileNameAge.innerText = `${myProfileData.name}، ${myProfileData.age}`;
    if (profileBio) profileBio.innerText = myProfileData.bio || "بیوگرافی ثبت نشده است.";
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

    // ۲. سینک با کارت اکسپلور (مخاطب مقابل)
    const cardImg = document.getElementById('card-img');
    const cardNameAge = document.getElementById('card-name-age');
    const cardLocation = document.getElementById('card-location');
    const cardInterests = document.getElementById('card-interests');
    const cardVipBadge = document.getElementById('card-vip-badge');

    if (cardImg) cardImg.src = myProfileData.image;
    if (cardNameAge) cardNameAge.innerText = `${myProfileData.name}، ${myProfileData.age}`;
    if (cardLocation) cardLocation.innerText = `📍 ${myProfileData.city} | ${myProfileData.gender === 'مرد' ? '♂️ مرد' : '♀️ زن'}`;
    if (cardVipBadge) cardVipBadge.style.display = myProfileData.isVip ? 'block' : 'none';

    if (cardInterests && myProfileData.interests) {
        cardInterests.innerHTML = myProfileData.interests.map(tag =>
            `<span class="text-[9px] bg-white/10 px-2.5 py-1 rounded-full border border-white/5">${tag}</span>`
        ).join('');
    }
}

// ==========================================
// منطق ضبط و پخش صدا (MediaRecorder)
// ==========================================
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                myProfileData.audioBase64 = reader.result;
                saveProfileToStorage();
                showToast('ویس با موفقیت ثبت شد! 🎙️', '✅');
            };
        };

        mediaRecorder.start();
        recordSecondsLeft = 15;
        
        const btnRecord = document.getElementById('btn-record-voice');
        const recordLabel = document.getElementById('record-voice-label');
        const timerEl = document.getElementById('voice-timer');
        
        btnRecord.classList.add('recording-pulse');
        recordLabel.innerText = 'توقف ضبط';

        recordTimerInterval = setInterval(() => {
            recordSecondsLeft--;
            if (timerEl) timerEl.innerText = `00:${recordSecondsLeft < 10 ? '0' : ''}${recordSecondsLeft}`;
            if (recordSecondsLeft <= 0) {
                stopRecording();
            }
        }, 1000);

    } catch (err) {
        showToast('دسترسی به میکروفون داده نشد!', '⚠️');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }

    clearInterval(recordTimerInterval);
    const btnRecord = document.getElementById('btn-record-voice');
    const recordLabel = document.getElementById('record-voice-label');
    const timerEl = document.getElementById('voice-timer');

    if (btnRecord) btnRecord.classList.remove('recording-pulse');
    if (recordLabel) recordLabel.innerText = 'شروع ضبط';
    if (timerEl) timerEl.innerText = '00:15';
}

function togglePlayAudio() {
    if (!myProfileData.audioBase64) {
        showToast('ابتدا صدا ضبط کنید!', '🎙️');
        return;
    }

    if (audioInstance && !audioInstance.paused) {
        audioInstance.pause();
        updatePlayBtnState(false);
    } else {
        audioInstance = new Audio(myProfileData.audioBase64);
        audioInstance.play();
        updatePlayBtnState(true);

        audioInstance.onended = () => {
            updatePlayBtnState(false);
        };
    }
}

function updatePlayBtnState(isPlaying) {
    const playIcon = document.getElementById('play-voice-icon');
    const playLabel = document.getElementById('play-voice-label');
    const cardPlayBtn = document.getElementById('btn-card-play-voice');

    if (isPlaying) {
        if (playIcon) playIcon.innerText = '⏸️';
        if (playLabel) playLabel.innerText = 'توقف پخش';
        if (cardPlayBtn) cardPlayBtn.innerText = '⏸';
    } else {
        if (playIcon) playIcon.innerText = '▶️';
        if (playLabel) playLabel.innerText = 'شنیدن ویس';
        if (cardPlayBtn) cardPlayBtn.innerText = '▶';
    }
}

// فرم‌ها و Dropdownها
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
// Event Listeners
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    renderProfileUI();

    // تنظیم لینک کانال تلگرام
    const chanLink = document.getElementById('btn-telegram-channel');
    if (chanLink) chanLink.href = TELEGRAM_CHANNEL_URL;

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    document.getElementById('btn-back-header')?.addEventListener('click', () => switchTab('explore'));

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

    // کلیک روی دکمه‌های ضبط و پخش ویس
    document.getElementById('btn-record-voice')?.addEventListener('click', () => {
        triggerHaptic('heavy');
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    });

    document.getElementById('btn-play-voice')?.addEventListener('click', () => {
        triggerHaptic('medium');
        togglePlayAudio();
    });

    document.getElementById('btn-card-play-voice')?.addEventListener('click', () => {
        triggerHaptic('medium');
        togglePlayAudio();
    });
});
