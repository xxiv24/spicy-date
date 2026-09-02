// ==========================================
// Spicy Date 🌶️ - Complete App Logic
// ==========================================

const STORAGE_KEY = 'spicy_user_profile_permanent_v1';

const IRAN_CITIES = [
    "تهران", "مشهد", "اصفهان", "کرج", "شیراز", "تبریز", "قم", "اهواز", 
    "کرمانشاه", "ارومیه", "رشت", "زاهدان", "همدان", "کرمان", "یزد", "بندرعباس"
];

const ALL_INTERESTS = [
    "☕ کافه‌گردی", "🎮 گیمینگ", "🎧 موسیقی", "✈️ سفر", 
    "🏋️ ورزش", "📸 عکاسی", "🍕 آشپزی", "🎬 فیلم و سریال",
    "📚 کتابخوانی", "🎨 هنر و طراحی"
];

// لیست کاربران نمونه برای سیستم سوایپ
const EXPLORE_USERS = [
    {
        name: "سارا",
        age: 23,
        city: "تهران",
        gender: "زن",
        isVip: true,
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
        interests: ["☕ کافه‌گردی", "🎧 موسیقی", "📸 عکاسی"]
    },
    {
        name: "آرش",
        age: 26,
        city: "شیراز",
        gender: "مرد",
        isVip: false,
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        interests: ["🎮 گیمینگ", "✈️ سفر", "🍕 آشپزی"]
    },
    {
        name: "مریم",
        age: 22,
        city: "اصفهان",
        gender: "زن",
        isVip: true,
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
        interests: ["📚 کتابخوانی", "🎨 هنر و طراحی", "☕ کافه‌گردی"]
    },
    {
        name: "نیما",
        age: 25,
        city: "کرج",
        gender: "مرد",
        isVip: false,
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
        interests: ["🏋️ ورزش", "🎬 فیلم و سریال", "🎧 موسیقی"]
    }
];

let currentCardIndex = 0;

const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

function loadProfile() {
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

let profile = loadProfile();
let tempInterests = [...profile.interests];

let mediaRecorder = null;
let audioChunks = [];
let audioInstance = null;
let recordTimerInterval = null;
let recordSecondsLeft = 15;

function saveProfile() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function renderUI() {
    document.getElementById('profile-img').src = profile.image;
    document.getElementById('profile-name-age').innerText = `${profile.name}، ${profile.age}`;
    document.getElementById('profile-city').innerText = `📍 ${profile.city}`;
    document.getElementById('profile-gender').innerText = `| ${profile.gender === 'مرد' ? '♂️ مرد' : '♀️ زن'}`;
    document.getElementById('profile-bio').innerText = profile.bio || "بدون بیوگرافی";
    
    document.getElementById('profile-interests').innerHTML = profile.interests.map(t => 
        `<span class="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">${t}</span>`
    ).join('');

    renderCurrentExploreCard();
}

function renderCurrentExploreCard() {
    const currentUser = EXPLORE_USERS[currentCardIndex % EXPLORE_USERS.length];
    
    document.getElementById('card-img').src = currentUser.image;
    document.getElementById('card-name-age').innerText = `${currentUser.name}، ${currentUser.age}`;
    document.getElementById('card-location').innerText = `📍 ${currentUser.city} | ${currentUser.gender === 'مرد' ? '♂️ مرد' : '♀️ زن'}`;
    document.getElementById('card-interests').innerHTML = currentUser.interests.map(t => 
        `<span class="text-[9px] bg-white/10 px-2 py-0.5 rounded-full">${t}</span>`
    ).join('');

    const cardVip = document.getElementById('card-vip-badge');
    if (cardVip) {
        cardVip.style.display = currentUser.isVip ? 'block' : 'none';
    }
}

// سیستم ضبط و پخش صدا
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        mediaRecorder = new MediaRecorder(stream, { mimeType });

        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                profile.audioBase64 = reader.result;
                saveProfile();
                showToast('ویس با موفقیت ثبت و ذخیره شد! 🎙️');
            };
        };

        mediaRecorder.start();
        recordSecondsLeft = 15;
        document.getElementById('record-voice-label').innerText = 'توقف ضبط';
        document.getElementById('btn-record-voice').classList.add('recording-pulse');

        recordTimerInterval = setInterval(() => {
            recordSecondsLeft--;
            document.getElementById('voice-timer').innerText = `00:${recordSecondsLeft < 10 ? '0' : ''}${recordSecondsLeft}`;
            if (recordSecondsLeft <= 0) stopRecording();
        }, 1000);

    } catch (err) {
        showToast('دسترسی به میکروفون داده نشد!');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    clearInterval(recordTimerInterval);
    document.getElementById('record-voice-label').innerText = '🎙️ شروع ضبط';
    document.getElementById('btn-record-voice').classList.remove('recording-pulse');
    document.getElementById('voice-timer').innerText = '00:15';
}

function togglePlayAudio() {
    if (!profile.audioBase64) {
        showToast('هنوز ویسی ضبط نکرده‌اید!');
        return;
    }

    if (audioInstance && !audioInstance.paused) {
        audioInstance.pause();
        document.getElementById('play-voice-label').innerText = '▶️ شنیدن ویس';
    } else {
        audioInstance = new Audio(profile.audioBase64);
        audioInstance.play().catch(() => showToast('خطا در پخش ویس'));
        document.getElementById('play-voice-label').innerText = '⏸️ توقف پخش';
        audioInstance.onended = () => {
            document.getElementById('play-voice-label').innerText = '▶️ شنیدن ویس';
        };
    }
}

function renderInterestsSelector() {
    const container = document.getElementById('interests-selector');
    if (!container) return;

    container.innerHTML = ALL_INTERESTS.map(tag => {
        const isSelected = tempInterests.includes(tag);
        return `
            <span data-tag="${tag}" class="interest-chip text-[10px] px-2 py-1 rounded-full border border-white/10 ${isSelected ? 'selected' : 'bg-white/5 text-gray-300'}">
                ${tag}
            </span>
        `;
    }).join('');

    container.querySelectorAll('.interest-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const tag = chip.getAttribute('data-tag');
            if (tempInterests.includes(tag)) {
                tempInterests = tempInterests.filter(t => t !== tag);
            } else {
                if (tempInterests.length >= 3) {
                    showToast('حداکثر ۳ مورد قابل انتخاب است!');
                    return;
                }
                tempInterests.push(tag);
            }
            renderInterestsSelector();
        });
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
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

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// ==========================================
// موتور سوایپ تعاملی کارت اکسپلور (Swipe Controller)
// ==========================================

let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

function initSwipeController() {
    const card = document.getElementById('user-card');
    const badgeLike = document.getElementById('badge-like');
    const badgePass = document.getElementById('badge-pass');
    const badgeSuper = document.getElementById('badge-super');

    if (!card) return;

    const onStart = (e) => {
        if (e.target.closest('button')) return; // جلوگیری از تداخل کلیک دکمه‌ها
        isDragging = true;
        card.classList.remove('reset-card', 'swiping-left', 'swiping-right', 'swiping-up');
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        startX = clientX;
        startY = clientY;
    };

    const onMove = (e) => {
        if (!isDragging) return;
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        currentX = clientX - startX;
        currentY = clientY - startY;

        const rotate = currentX * 0.08;
        card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;

        // اپاسیتی نشانگرها
        if (currentX > 30) {
            badgeLike.style.opacity = Math.min(currentX / 120, 1);
            badgePass.style.opacity = 0;
            badgeSuper.style.opacity = 0;
        } else if (currentX < -30) {
            badgePass.style.opacity = Math.min(Math.abs(currentX) / 120, 1);
            badgeLike.style.opacity = 0;
            badgeSuper.style.opacity = 0;
        } else if (currentY < -40) {
            badgeSuper.style.opacity = Math.min(Math.abs(currentY) / 120, 1);
            badgeLike.style.opacity = 0;
            badgePass.style.opacity = 0;
        } else {
            badgeLike.style.opacity = 0;
            badgePass.style.opacity = 0;
            badgeSuper.style.opacity = 0;
        }
    };

    const onEnd = () => {
        if (!isDragging) return;
        isDragging = false;

        const threshold = 100;
        const upThreshold = -120;

        if (currentX > threshold) {
            triggerSwipe('right');
        } else if (currentX < -threshold) {
            triggerSwipe('left');
        } else if (currentY < upThreshold) {
            triggerSwipe('up');
        } else {
            // ریست به موقعیت اولیه
            card.style.transform = '';
            card.classList.add('reset-card');
            resetBadges();
        }

        currentX = 0;
        currentY = 0;
    };

    // Touch Events
    card.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);

    // Mouse Events
    card.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    // دکمه‌های پایینی
    document.getElementById('btn-like')?.addEventListener('click', () => triggerSwipe('right'));
    document.getElementById('btn-pass')?.addEventListener('click', () => triggerSwipe('left'));
    document.getElementById('btn-super')?.addEventListener('click', () => triggerSwipe('up'));
}

function triggerSwipe(direction) {
    const card = document.getElementById('user-card');
    if (!card) return;

    resetBadges();

    if (direction === 'right') {
        card.classList.add('swiping-right');
        showToast('لایک شد! ❤️');
    } else if (direction === 'left') {
        card.classList.add('swiping-left');
        showToast('رد شد ✖');
    } else if (direction === 'up') {
        card.classList.add('swiping-up');
        showToast('سوپر لایک ارسال شد! ⭐');
    }

    setTimeout(() => {
        currentCardIndex++;
        renderCurrentExploreCard();
        card.classList.remove('swiping-left', 'swiping-right', 'swiping-up');
        card.style.transform = '';
    }, 350);
}

function resetBadges() {
    const badgeLike = document.getElementById('badge-like');
    const badgePass = document.getElementById('badge-pass');
    const badgeSuper = document.getElementById('badge-super');

    if (badgeLike) badgeLike.style.opacity = 0;
    if (badgePass) badgePass.style.opacity = 0;
    if (badgeSuper) badgeSuper.style.opacity = 0;
}

// ==========================================
// بازی ۱: دوز نئونی (Tic-Tac-Toe)
// ==========================================

let tttBoard = Array(9).fill(null);
let tttCurrentPlayer = '❌'; 
let tttIsGameActive = true;

const tttWinningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

function initTicTacToe() {
    const gameCard = document.getElementById('game-tictactoe-card');
    const boardContainer = document.getElementById('tictactoe-board-container');
    const cells = document.querySelectorAll('.ttt-cell');
    const btnReset = document.getElementById('btn-reset-ttt');

    gameCard?.addEventListener('click', () => {
        if (boardContainer) {
            boardContainer.classList.toggle('hidden');
        }
    });

    cells.forEach(cell => {
        cell.addEventListener('click', (e) => {
            const index = parseInt(e.target.getAttribute('data-index'));
            
            if (tttBoard[index] !== null || !tttIsGameActive || tttCurrentPlayer !== '❌') return;

            makeMove(index, cell);

            if (tttIsGameActive && tttCurrentPlayer === '⭕') {
                setTimeout(makeAIMove, 500);
            }
        });
    });

    btnReset?.addEventListener('click', resetTTTGame);
}

function makeMove(index, cellElement) {
    tttBoard[index] = tttCurrentPlayer;
    cellElement.innerText = tttCurrentPlayer;
    cellElement.classList.add('pop-in');
    
    if (tttCurrentPlayer === '❌') {
        cellElement.classList.add('text-red-500', 'drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]');
    } else {
        cellElement.classList.add('text-amber-400', 'drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]');
    }

    const winningLine = checkTTTWinner();
    if (winningLine) {
        highlightWinningCells(winningLine);
        updateTTTStatus(`بازیکن ${tttCurrentPlayer} پیروز شد! 🎉`);
        tttIsGameActive = false;
        showToast(`بازیکن ${tttCurrentPlayer} برنده بازی شد! 🏆`);
        return;
    }

    if (tttBoard.every(cell => cell !== null)) {
        updateTTTStatus('بازی مساوی شد! 🤝');
        tttIsGameActive = false;
        showToast('رقابت بدون برنده تمام شد!');
        return;
    }

    tttCurrentPlayer = tttCurrentPlayer === '❌' ? '⭕' : '❌';
    updateTTTStatus(tttCurrentPlayer === '❌' ? 'نوبت شماست (❌)' : 'نوبت حریف/ربات (⭕)...');
}

function makeAIMove() {
    if (!tttIsGameActive) return;

    const emptyIndices = tttBoard.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
    if (emptyIndices.length === 0) return;

    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const cellElement = document.querySelector(`.ttt-cell[data-index="${randomIndex}"]`);
    
    if (cellElement) {
        makeMove(randomIndex, cellElement);
    }
}

function checkTTTWinner() {
    for (let condition of tttWinningConditions) {
        const [a, b, c] = condition;
        if (tttBoard[a] && tttBoard[a] === tttBoard[b] && tttBoard[a] === tttBoard[c]) {
            return condition;
        }
    }
    return null;
}

function highlightWinningCells(winningIndices) {
    winningIndices.forEach(idx => {
        const cell = document.querySelector(`.ttt-cell[data-index="${idx}"]`);
        if (cell) {
            cell.classList.add('winning-glow');
        }
    });
}

function updateTTTStatus(msg) {
    const statusEl = document.getElementById('ttt-status');
    if (statusEl) statusEl.innerText = msg;
}

function resetTTTGame() {
    tttBoard = Array(9).fill(null);
    tttCurrentPlayer = '❌';
    tttIsGameActive = true;
    
    document.querySelectorAll('.ttt-cell').forEach(cell => {
        cell.innerText = '';
        cell.className = 'ttt-cell w-full h-full bg-black/50 hover:bg-white/10 rounded-xl text-2xl font-black border border-white/10 flex items-center justify-center shadow-inner';
    });

    updateTTTStatus('نوبت شماست (❌)');
    showToast('بازی دوز مجدداً شروع شد 🔄');
}

// ==========================================
// بازی ۲: جرأت یا حقیقت اسپایسی (Spicy Truth or Dare)
// ==========================================

const TRUTH_QUESTIONS = [
    "اولین چیزی که در اولین نگاه توجهت رو جلب می‌کنه چیست؟ 🤔",
    "عجیب‌ترین یا خنده‌دارترین قولی که به کسی دادی چی بوده؟ 😂",
    "اگر فقط یک روز فرصت زندگی داشتی، اون روز رو چطور می‌گذروندی؟ ⏳",
    "بزرگ‌ترین بی‌حوصلگی یا دیوانه‌بازی که تا حالا کردی چی بوده؟ 🤪",
    "آهنگی که قایمکی گوش میدی و جلوی بقیه نمیگی چیه؟ 🎧",
    "از نظر تو یک رقرار کامل و عالی چه ویژگی‌هایی داره؟ ☕❤️"
];

const DARE_CHALLENGES = [
    "یک ایموجی خنده‌دار یا اسپایسی انتخاب کن و توی چت بفرست! 🌶️",
    "یک لطیفه یا خاطره خنده‌دار ۲ خطی بنویس و توی چت ارسال کن! 🤣",
    "به طرف مقابل یک لقب اختصاصی و بامزه هدیه بده! 🏷️",
    "یک بیوگرافی یا جمله‌ای باحال درباره خودت بساز و توی چت بفرست! ✍️",
    "به مدت ۱ دقیقه فقط با ایموجی در چت صحبت کن! 🤐"
];

function initTruthOrDare() {
    const todCard = document.getElementById('game-tod-card');
    const boardContainer = document.getElementById('tod-board-container');
    const btnTruth = document.getElementById('btn-tod-truth');
    const btnDare = document.getElementById('btn-tod-dare');

    todCard?.addEventListener('click', () => {
        if (boardContainer) {
            boardContainer.classList.toggle('hidden');
        }
    });

    btnTruth?.addEventListener('click', () => getNextTOD('truth'));
    btnDare?.addEventListener('click', () => getNextTOD('dare'));
}

function getNextTOD(type) {
    const displayCard = document.getElementById('tod-display-card');
    const badgeEl = document.getElementById('tod-badge');
    const textEl = document.getElementById('tod-text');

    if (!displayCard || !badgeEl || !textEl) return;

    displayCard.classList.remove('tod-card-flip');
    void displayCard.offsetWidth;

    if (type === 'truth') {
        const randomTruth = TRUTH_QUESTIONS[Math.floor(Math.random() * TRUTH_QUESTIONS.length)];
        badgeEl.innerText = '🤔 حقیقت (Truth)';
        badgeEl.className = 'text-[9px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-0.5 rounded-full mb-1.5 font-bold';
        textEl.innerText = randomTruth;
    } else {
        const randomDare = DARE_CHALLENGES[Math.floor(Math.random() * DARE_CHALLENGES.length)];
        badgeEl.innerText = '🔥 جرأت (Dare)';
        badgeEl.className = 'text-[9px] bg-pink-500/20 text-pink-400 border border-pink-500/30 px-2.5 py-0.5 rounded-full mb-1.5 font-bold';
        textEl.innerText = randomDare;
    }

    displayCard.classList.add('tod-card-flip');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    renderUI();
    initSwipeController();
    initTicTacToe();
    initTruthOrDare();

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    document.getElementById('btn-back-header')?.addEventListener('click', () => switchTab('explore'));

    document.getElementById('direct-avatar-upload')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                profile.image = event.target.result;
                saveProfile();
                renderUI();
                showToast('تصویر پروفایل به‌روز شد 📸');
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('btn-record-voice')?.addEventListener('click', () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') stopRecording();
        else startRecording();
    });

    document.getElementById('btn-play-voice')?.addEventListener('click', togglePlayAudio);
    document.getElementById('btn-card-play-voice')?.addEventListener('click', togglePlayAudio);

    const bioInput = document.getElementById('input-edit-bio');
    bioInput?.addEventListener('input', (e) => {
        document.getElementById('bio-char-count').innerText = `${e.target.value.length}/100`;
    });

    document.getElementById('btn-open-edit-modal')?.addEventListener('click', () => {
        const ageSelect = document.getElementById('input-edit-age');
        const citySelect = document.getElementById('input-edit-city');

        if (ageSelect.options.length === 0) {
            for (let i = 18; i <= 60; i++) ageSelect.innerHTML += `<option value="${i}">${i}</option>`;
        }
        if (citySelect.options.length === 0) {
            IRAN_CITIES.forEach(c => citySelect.innerHTML += `<option value="${c}">${c}</option>`);
        }

        document.getElementById('input-edit-name').value = profile.name;
        document.getElementById('input-edit-age').value = profile.age;
        document.getElementById('input-edit-gender').value = profile.gender || 'زن';
        document.getElementById('input-edit-city').value = profile.city;
        document.getElementById('input-edit-bio').value = profile.bio || '';
        document.getElementById('bio-char-count').innerText = `${(profile.bio || '').length}/100`;

        tempInterests = [...profile.interests];
        renderInterestsSelector();

        document.getElementById('edit-profile-modal').classList.remove('hidden');
    });

    document.getElementById('btn-close-edit-profile')?.addEventListener('click', () => {
        document.getElementById('edit-profile-modal').classList.add('hidden');
    });

    document.getElementById('btn-save-edit-profile')?.addEventListener('click', () => {
        profile.name = document.getElementById('input-edit-name').value;
        profile.age = document.getElementById('input-edit-age').value;
        profile.gender = document.getElementById('input-edit-gender').value;
        profile.city = document.getElementById('input-edit-city').value;
        profile.bio = document.getElementById('input-edit-bio').value;
        profile.interests = [...tempInterests];

        saveProfile();
        renderUI();
        document.getElementById('edit-profile-modal').classList.add('hidden');
        showToast('تغییرات به شکل دائمی ذخیره شدند ✨');
    });
});
