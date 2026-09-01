// ==========================================
// Spicy Date 🌶️ - Complete App Logic
// ==========================================

const API_BASE_URL = 'https://spicy-date-api.onrender.com';
const STORAGE_KEY = 'spicy_user_profile_data_v3';
const TELEGRAM_CHANNEL_URL = 'https://t.me/SpicyDateApp';

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

// بارگذاری پروفایل
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

// متغیرهای ضبط صدا
let mediaRecorder = null;
let audioChunks = [];
let audioInstance = null;
let recordTimerInterval = null;
let recordSecondsLeft = 15;

function saveProfileToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(myProfileData));
    syncWithServer();
}

// ارسال داده به سرور Render
async function syncWithServer() {
    try {
        await fetch(`${API_BASE_URL}/api/users/profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                telegramId: tg?.initDataUnsafe?.user?.id || 'demo_user',
                ...myProfileData
            })
        });
    } catch (e) {
        console.log("Server sync fallback to local storage");
    }
}

// نمایش داده‌ها رو پروفایل و کارت اکسپلور
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
    if (profileBio) profileBio.innerText = myProfileData.bio || "بیوگرافی ثبت نشده است.";
    if (profileCity) profileCity.innerText = `📍 ${myProfileData.city}`;
    if (profileGender) profileGender.innerText = `| ${myProfileData.gender === 'مرد' ? '♂️ مرد' : '♀️ زن'}`;

    if (profileVipBadge) {
        profileVipBadge.innerText = myProfileData.isVip ? 'اشتراک VIP 👑' : 'اشتراک معمولی';
        profileVipBadge.className = myProfileData.isVip 
            ? 'inline-block text-[10px] bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-bold px-3 py-1 rounded-full'
            : 'inline-block text-[10px] bg-gray-800 text-gray-300 px-3 py-1 rounded-full border border-white/10';
    }

    if (profileInterests && myProfileData.interests) {
        profileInterests.innerHTML = myProfileData.interests.map(tag =>
            `<span class="text-[10px] bg-red-500/10 text-red-400 px-3 py-1 rounded-full border border-red-500/20">${tag}</span>`
        ).join('');
    }

    // کارت اکسپلور
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
// ضبط و پخش صدا (تضمین کارکرد روی آیفون و اندروید)
// ==========================================
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        mediaRecorder = new MediaRecorder(stream, { mimeType });

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                myProfileData.audioBase64 = reader.result;
                saveProfileToStorage();
                showToast('ویس با موفقیت ضبط شد! 🎙️', '✅');
            };
        };

        mediaRecorder.start();
        recordSecondsLeft = 15;
        
        const btnRecord = document.getElementById('btn-record-voice');
        const recordLabel = document.getElementById('record-voice-label');
        const timerEl = document.getElementById('voice-timer');
        
        if (btnRecord) btnRecord.classList.add('recording-pulse');
        if (recordLabel) recordLabel.innerText = 'توقف ضبط';

        recordTimerInterval = setInterval(() => {
            recordSecondsLeft--;
            if (timerEl) timerEl.innerText = `00:${recordSecondsLeft < 10 ? '0' : ''}${recordSecondsLeft}`;
            if (recordSecondsLeft <= 0) stopRecording();
        }, 1000);

    } catch (err) {
        showToast('دسترسی به میکروفون باز نیست!', '⚠️');
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
        showToast('هنوز ویسی ضبط نشده است!', '🎙️');
        return;
    }

    if (audioInstance && !audioInstance.paused) {
        audioInstance.pause();
        updatePlayBtnState(false);
    } else {
        audioInstance = new Audio(myProfileData.audioBase64);
        audioInstance.play().catch(() => showToast('خطا در پخش ویس', '⚠️'));
        updatePlayBtnState(true);

        audioInstance.onended = () => updatePlayBtnState(false);
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

// ==========================================
// Swipe لمسی روی کارت اکسپلور
// ==========================================
function setupSwipeGesture() {
    const card = document.getElementById('user-card');
    if (!card) return;

    let startX = 0, currentX = 0, isDragging = false;

    card.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
    });

    card.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentX = e.touches[0].clientX - startX;
        card.style.transform = `translateX(${currentX}px) rotate(${currentX * 0.05}deg)`;
    });

    card.addEventListener('touchend', () => {
        if (!isDragging) return;
        isDragging = false;

        if (currentX > 100) {
            triggerHaptic('success');
            showToast('لایک شد! ❤️');
            resetCardPos();
        } else if (currentX < -100) {
            triggerHaptic('medium');
            showToast('رد شد ✖️');
            resetCardPos();
        } else {
            resetCardPos();
        }
    });

    function resetCardPos() {
        card.style.transform = 'translateX(0px) rotate(0deg)';
    }
}

// ==========================================
// مینی‌گیم آنلاین دوز (Tic-Tac-Toe)
// ==========================================
let tttBoard = Array(9).fill(null);
let tttTurn = '❌';

function setupTicTacToe() {
    const gameCard = document.getElementById('game-tictactoe-card');
    const boardContainer = document.getElementById('tictactoe-board-container');
    const cells = document.querySelectorAll('.ttt-cell');

    if (gameCard) {
        gameCard.addEventListener('click', () => {
            boardContainer.classList.toggle('hidden');
            resetTTTBoard();
        });
    }

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const index = cell.getAttribute('data-index');
            if (!tttBoard[index]) {
                tttBoard[index] = tttTurn;
                cell.innerText = tttTurn;
                triggerHaptic('light');

                if (checkTTTWinner()) {
                    showToast(`بازیکن ${tttTurn} برنده شد! 🎉`, '🏆');
                    setTimeout(resetTTTBoard, 1500);
                } else {
                    tttTurn = tttTurn === '❌' ? '⭕' : '❌';
                    document.getElementById('ttt-status').innerText = `نوبت بازیکن (${tttTurn})`;
                }
            }
        });
    });

    document.getElementById('btn-reset-ttt')?.addEventListener('click', resetTTTBoard);
}

function checkTTTWinner() {
    const winPatterns = [
        [0,1,2], [3,4,5], [6,7,8],
        [0,3,6], [1,4,7], [2,5,8],
        [0,4,8], [2,4,6]
    ];
    return winPatterns.some(p => tttBoard[p[0]] && tttBoard[p[0]] === tttBoard[p[1]] && tttBoard[p[0]] === tttBoard[p[2]]);
}

function resetTTTBoard() {
    tttBoard = Array(9).fill(null);
    tttTurn = '❌';
    document.querySelectorAll('.ttt-cell').forEach(cell => cell.innerText = '');
    document.getElementById('ttt-status').innerText = 'نوبت شماست (❌)';
}

// ==========================================
// سیستم چت آنلاین
// ==========================================
function setupChatSystem() {
    const sendBtn = document.getElementById('btn-send-chat');
    const inputMsg = document.getElementById('input-chat-msg');
    const list = document.getElementById('chat-messages-list');

    if (sendBtn && inputMsg && list) {
        sendBtn.addEventListener('click', () => {
            const txt = inputMsg.value.trim();
            if (txt) {
                const msgElem = document.createElement('div');
                msgElem.className = 'spicy-card p-2.5 rounded-2xl border border-red-500/30 bg-red-950/20 text-left mr-auto max-w-[80%]';
                msgElem.innerHTML = `<p class="text-xs text-white">${txt}</p>`;
                list.appendChild(msgElem);
                inputMsg.value = '';
                triggerHaptic('light');
            }
        });
    }
}

// ==========================================
// سایر فرم‌ها
// ==========================================
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

    if (nameInput) nameInput.value = myProfileData.name;
    if (ageSelect) ageSelect.value = myProfileData.age;
    if (genderSelect) genderSelect.value = myProfileData.gender || 'زن';
    if (citySelect) citySelect.value = myProfileData.city;
    if (bioInput) bioInput.value = myProfileData.bio || '';

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

    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => {
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
        setTimeout(() => toast.classList.remove('show'), 2500);
    }
}

// ==========================================
// Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    renderProfileUI();
    setupSwipeGesture();
    setupTicTacToe();
    setupChatSystem();

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

    document.getElementById('btn-record-voice')?.addEventListener('click', () => {
        triggerHaptic('heavy');
        if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording();
        else startRecording();
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
