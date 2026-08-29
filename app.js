// ==================== تنظیمات اولیه ====================
const tg = window.Telegram.WebApp;
const API_URL = 'http://localhost:5000/api';

// حالت برنامه
const state = {
    userId: null,
    userProfile: null,
    currentUserIndex: 0,
    allUsers: [],
    isVip: false,
    selectedInterests: [],
    mediaRecorder: null,
    audioBlob: null,
    currentGameState: null,
    todTimeLeft: 600,
    quizCurrentQuestion: 0,
    quizUserScore: 0,
    quizPartnerScore: 0,
    tttBoard: Array(9).fill(null),
    tttPlayerSymbol: 'X',
    tttAISymbol: 'O',
    tttIsPlayerTurn: true,
    rpsScore: { player: 0, bot: 0 },
};

// ==================== Event Listeners ====================

document.addEventListener('DOMContentLoaded', () => {
    tg.expand();
    initializeApp();
    setupEventListeners();
    loadStoredProfile();
});

function setupEventListeners() {
    // کنترل‌های ورود
    document.getElementById('btn-telegram-login').addEventListener('click', handleTelegramLogin);
    document.getElementById('btn-open-register').addEventListener('click', () => {
        document.getElementById('register-modal').classList.remove('hidden');
    });
    document.getElementById('btn-close-register').addEventListener('click', () => {
        document.getElementById('register-modal').classList.add('hidden');
    });

    // کنترل‌های پروفایل
    document.getElementById('btn-save-profile').addEventListener('click', handleSaveProfile);
    document.getElementById('record-btn').addEventListener('click', handleVoiceRecord);

    // انتخاب علاقه‌مندی‌ها
    document.querySelectorAll('.tag-chip').forEach(chip => {
        chip.addEventListener('click', (e) => handleInterestSelection(e.target));
    });

    // کنترل‌های Feed
    document.getElementById('btn-like').addEventListener('click', () => cardAction('like'));
    document.getElementById('btn-super').addEventListener('click', () => cardAction('super'));
    document.getElementById('btn-game').addEventListener('click', () => cardAction('game'));
    document.getElementById('btn-pass').addEventListener('click', () => cardAction('pass'));
    document.getElementById('btn-play-voice').addEventListener('click', () => playVoiceMessage());

    // کنترل‌های Night Chat
    document.getElementById('filter-girl').addEventListener('click', () => setGenderFilter('girl'));
    document.getElementById('filter-boy').addEventListener('click', () => setGenderFilter('boy'));
    document.getElementById('btn-night-chat').addEventListener('click', handleNightChat);

    // کنترل‌های بازی‌ها
    document.getElementById('game-truth-or-dare').addEventListener('click', openTruthOrDare);
    document.getElementById('game-personality').addEventListener('click', openPersonalityTest);
    document.getElementById('game-tictactoe').addEventListener('click', openTicTacToe);
    document.getElementById('game-rps').addEventListener('click', openRpsGame);

    // کنترل‌های VIP
    document.getElementById('btn-upgrade-vip').addEventListener('click', handleBuyVip);
    document.getElementById('btn-buy-vip').addEventListener('click', handleBuyVip);
    document.getElementById('btn-logout').addEventListener('click', handleLogout);

    // Tab Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // مودال‌های بازی‌ها
    document.getElementById('btn-close-tod').addEventListener('click', () => closeModal('tod-modal'));
    document.getElementById('btn-send-tod').addEventListener('click', sendTodQuestion);
    document.getElementById('btn-accept-tod').addEventListener('click', acceptTodMatch);

    document.getElementById('btn-close-personality').addEventListener('click', () => closeModal('personality-modal'));

    document.getElementById('btn-close-tictactoe').addEventListener('click', () => closeModal('tictactoe-modal'));
    document.getElementById('btn-reset-ttt').addEventListener('click', resetTicTacToe);

    document.getElementById('btn-close-rps').addEventListener('click', () => closeModal('rps-modal'));
    document.querySelectorAll('.rps-btn').forEach(btn => {
        btn.addEventListener('click', () => playRps(btn.dataset.choice));
    });
}

// ==================== توابع اساسی ====================

function initializeApp() {
    console.log('🚀 Initializing Spicy Date App');
    const user = tg.initDataUnsafe?.user;
    if (user) {
        state.userId = user.id;
        console.log(`User logged in: ${user.first_name}`);
    }
}

function showToast(message, icon = '🌶️', duration = 2500) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').innerText = message;
    document.getElementById('toast-icon').innerText = icon;
    toast.classList.add('show');
    
    if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }
    
    setTimeout(() => toast.classList.remove('show'), duration);
}

function showError(message) {
    showToast(message, '❌', 3000);
}

function showLoader(show = true) {
    const loader = document.getElementById('page-loader');
    loader.style.display = show ? 'flex' : 'none';
}

function switchTab(tabId) {
    showLoader(true);
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');

    setTimeout(() => {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.getElementById('tab-' + tabId).classList.add('active');

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });

        // اگر Feed است، کاربران را بارگذاری کنید
        if (tabId === 'feed') {
            loadUsers();
        }

        showLoader(false);
    }, 250);
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// ==================== مدیریت پروفایل ====================

function loadStoredProfile() {
    const stored = localStorage.getItem('spicyProfile');
    if (stored) {
        state.userProfile = JSON.parse(stored);
        document.getElementById('prof-name').innerText = state.userProfile.name;
        document.getElementById('prof-info').innerText = `📍 ${state.userProfile.city}`;
    }
}

function handleTelegramLogin() {
    const user = tg.initDataUnsafe?.user;
    if (!user) {
        showError('خطای ورود تلگرام');
        return;
    }

    state.userId = user.id;
    showToast(`خوش آمدید ${user.first_name}! 🔥`);
    document.getElementById('login-screen').classList.add('hidden');
    
    // بارگذاری پروفایل موجود
    if (!state.userProfile) {
        document.getElementById('register-modal').classList.remove('hidden');
    }
}

function handleInterestSelection(button) {
    const isSelected = button.classList.contains('selected');
    
    if (isSelected) {
        button.classList.remove('selected');
        state.selectedInterests = state.selectedInterests.filter(
            interest => interest !== button.innerText
        );
    } else {
        if (state.selectedInterests.length >= 3) {
            showError('حداکثر ۳ علاقه‌مندی می‌توانید انتخاب کنید');
            return;
        }
        button.classList.add('selected');
        state.selectedInterests.push(button.innerText);
    }

    document.getElementById('interest-error').innerText = '';
}

async function handleVoiceRecord() {
    const btn = document.getElementById('record-btn');
    const icon = document.getElementById('rec-icon');
    const text = document.getElementById('rec-text');

    if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
        // توقف ضبط
        state.mediaRecorder.stop();
        icon.innerText = '🔴';
        text.innerText = 'شروع ضبط';
        document.getElementById('voice-status').innerText = 'ضبط شده ✅';
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        state.mediaRecorder = new MediaRecorder(stream);
        
        state.mediaRecorder.ondataavailable = (e) => {
            state.audioBlob = e.data;
        };

        state.mediaRecorder.start();
        icon.innerText = '🔴';
        text.innerText = 'توقف ضبط';
        document.getElementById('voice-status').innerText = 'در حال ضبط...';

        // متوقف کردن خودکار بعد از ۱۵ ثانیه
        setTimeout(() => {
            if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
                state.mediaRecorder.stop();
                icon.innerText = '🔴';
                text.innerText = 'شروع ضبط';
                document.getElementById('voice-status').innerText = 'ضبط شده ✅';
            }
        }, 15000);

    } catch (err) {
        showError('دسترسی به میکروفون مورد نیاز است');
        console.error('Microphone error:', err);
    }
}

async function handleSaveProfile() {
    // تایید ورودی‌ها
    const name = document.getElementById('reg-name').value.trim();
    const age = parseInt(document.getElementById('reg-age').value);
    const city = document.getElementById('reg-city').value.trim();

    let hasError = false;

    if (!name || name.length < 2) {
        document.getElementById('name-error').innerText = 'نام باید حداقل ۲ کاراکتر باشد';
        hasError = true;
    }

    if (!age || age < 18 || age > 100) {
        document.getElementById('age-error').innerText = 'سن باید بین ۱۸ تا ۱۰۰ باشد';
        hasError = true;
    }

    if (!city || city.length < 2) {
        document.getElementById('city-error').innerText = 'شهر الزامی است';
        hasError = true;
    }

    if (state.selectedInterests.length !== 3) {
        document.getElementById('interest-error').innerText = 'باید دقیقاً ۳ علاقه‌مندی انتخاب کنید';
        hasError = true;
    }

    if (hasError) return;

    showLoader(true);

    try {
        const profileData = {
            userId: state.userId,
            name,
            age,
            city,
            interests: state.selectedInterests,
            hasVoice: !!state.audioBlob
        };

        // ذخیره در LocalStorage
        localStorage.setItem('spicyProfile', JSON.stringify(profileData));
        state.userProfile = profileData;

        // اگر صدا دارد، به backend ارسال کنید
        if (state.audioBlob) {
            const formData = new FormData();
            formData.append('userId', state.userId);
            formData.append('audio', state.audioBlob, 'voice.wav');

            await fetch(`${API_URL}/profile/upload-voice`, {
                method: 'POST',
                body: formData
            });
        }

        showToast('پروفایل با موفقیت ذخیره شد! ✨');
        document.getElementById('register-modal').classList.add('hidden');
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('prof-name').innerText = name;
        document.getElementById('prof-info').innerText = `📍 ${city}`;

    } catch (err) {
        showError('خطا در ذخیره پروفایل');
        console.error('Save profile error:', err);
    } finally {
        showLoader(false);
    }
}

// ==================== منطق Feed ====================

async function loadUsers() {
    try {
        showLoader(true);
        const response = await fetch(`${API_URL}/users/discover`);
        
        if (!response.ok) throw new Error('Failed to load users');
        
        const data = await response.json();
        state.allUsers = data.users || [];
        state.currentUserIndex = 0;

        if (state.allUsers.length > 0) {
            displayCurrentUser();
        } else {
            document.getElementById('feed-error').innerText = 'کاربری برای نمایش وجود ندارد';
        }
    } catch (err) {
        console.error('Load users error:', err);
        displayDemoUser();
    } finally {
        showLoader(false);
    }
}

function displayCurrentUser() {
    const user = state.allUsers[state.currentUserIndex];
    if (!user) return;

    const interests = user.interests?.map(i => `<span class="text-[9px] bg-white/10 px-2 py-0.5 rounded-md">${i}</span>`).join('') || '';

    document.getElementById('card-name').innerText = `${user.name}, ${user.age}`;
    document.getElementById('card-location').innerText = `📍 ${user.city}`;
    document.getElementById('card-img').src = user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
    document.getElementById('card-interests').innerHTML = interests;

    if (user.isVip) {
        document.getElementById('vip-badge').classList.remove('hidden');
    } else {
        document.getElementById('vip-badge').classList.add('hidden');
    }

    // Reset card position
    document.getElementById('user-card').style.transform = 'none';
}

function displayDemoUser() {
    document.getElementById('card-name').innerText = 'مینا، ۲۴';
    document.getElementById('card-location').innerText = '📍 تهران • ۲.۵ km';
    document.getElementById('card-img').src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600';
    document.getElementById('card-interests').innerHTML = `
        <span class="text-[9px] bg-white/10 px-2 py-0.5 rounded-md">🎮 گیمینگ</span>
        <span class="text-[9px] bg-white/10 px-2 py-0.5 rounded-md">☕ کافه‌گردی</span>
    `;
}

async function cardAction(type) {
    const card = document.getElementById('user-card');
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

    let message = '';
    let emoji = '';

    if (type === 'like') {
        card.style.transform = 'translateX(-150%) rotate(-20deg)';
        message = 'درخواست اسپایسی فرستاده شد! 🌶️';
        emoji = '🌶️';
    } else if (type === 'super') {
        card.style.transform = 'translateY(-150%) scale(1.1)';
        message = 'سوپر اسپایسی فرستاده شد! ⭐';
        emoji = '⭐';
    } else if (type === 'game') {
        message = 'دعوت به مینی‌گیم ارسال شد! 🎮';
        emoji = '🎮';
    } else {
        card.style.transform = 'translateX(150%) rotate(20deg)';
        message = 'کاربر رد شد ❌';
        emoji = '❌';
    }

    try {
        const targetUserId = state.allUsers[state.currentUserIndex]?.id;
        if (targetUserId) {
            await fetch(`${API_URL}/interactions/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: state.userId,
                    targetUserId,
                    action: type
                })
            });
        }
    } catch (err) {
        console.error('Action error:', err);
    }

    showToast(message, emoji);

    setTimeout(() => {
        state.currentUserIndex++;
        if (state.currentUserIndex < state.allUsers.length) {
            displayCurrentUser();
        } else {
            document.getElementById('feed-error').innerText = 'نیازی برای بارگذاری بیشتر کاربران';
            loadUsers();
        }
    }, 400);
}

function playVoiceMessage() {
    showToast('پخش Spicy Voice... 🎙️', '🎙️');
    // در عمل، از URLای صوتی استفاده می‌شود
}

// ==================== منطق Night Chat ====================

function setGenderFilter(gender) {
    const girlBtn = document.getElementById('filter-girl');
    const boyBtn = document.getElementById('filter-boy');

    if (gender === 'girl') {
        girlBtn.classList.add('active');
        girlBtn.style.background = 'rgba(239, 68, 68, 0.3)';
        girlBtn.style.borderColor = '#ef4444';
        boyBtn.classList.remove('active');
        boyBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        boyBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    } else {
        boyBtn.classList.add('active');
        boyBtn.style.background = 'rgba(239, 68, 68, 0.3)';
        boyBtn.style.borderColor = '#ef4444';
        girlBtn.classList.remove('active');
        girlBtn.style.background = 'rgba(255, 255, 255, 0.05)';
        girlBtn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
    }
}

async function handleNightChat() {
    if (!state.isVip) {
        showError('بخش چت شبانه فقط مخصوص کاربران VIP است!');
        switchTab('profile');
        return;
    }

    showToast('در حال جستجوی پارتنر... 🌙', '🌙');

    try {
        const response = await fetch(`${API_URL}/night-chat/match`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: state.userId,
                preferredGender: document.getElementById('filter-girl').classList.contains('active') ? 'girl' : 'boy'
            })
        });

        if (response.ok) {
            showToast('پارتنر یافت شد! 💬', '💬', 2000);
            switchTab('chats');
        }
    } catch (err) {
        showError('خطا در جستجوی پارتنر');
        console.error('Night chat error:', err);
    }
}

// ==================== منطق بازی: جرأت یا حقیقت ====================

let todTimerInterval;
let todMessages = [];

async function openTruthOrDare() {
    if (!state.isVip) {
        showError('بازی جرأت یا حقیقت مخصوص کاربران VIP است!');
        switchTab('profile');
        return;
    }

    document.getElementById('tod-modal').classList.remove('hidden');
    startTodTimer();
    state.currentGameState = 'truth-or-dare';
    todMessages = [];
    document.getElementById('tod-chat-box').innerHTML = `
        <div class="bg-red-500/20 border border-red-500/30 p-2 rounded-xl text-[11px] text-gray-200">
            سیستم: ۱۰ دقیقه زمان دارید! 🔥
        </div>
    `;
}

function startTodTimer() {
    state.todTimeLeft = 600;
    clearInterval(todTimerInterval);
    
    todTimerInterval = setInterval(() => {
        const minutes = Math.floor(state.todTimeLeft / 60);
        const seconds = state.todTimeLeft % 60;
        document.getElementById('tod-timer').innerText = 
            `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        
        if (--state.todTimeLeft < 0) {
            clearInterval(todTimerInterval);
            autoCloseTodGame();
        }
    }, 1000);
}

function sendTodQuestion() {
    const input = document.getElementById('tod-input');
    const message = input.value.trim();
    
    if (!message) return;

    const box = document.getElementById('tod-chat-box');
    const messageEl = document.createElement('div');
    messageEl.className = 'bg-red-500/30 border border-red-500/40 p-2 rounded-xl text-right text-xs text-gray-200';
    messageEl.innerText = message;
    
    box.appendChild(messageEl);
    todMessages.push(message);
    input.value = '';
    box.scrollTop = box.scrollHeight;
}

function acceptTodMatch() {
    clearInterval(todTimerInterval);
    closeModal('tod-modal');
    showToast('کاربر به چت‌های دائمی اضافه شد! 💬');
    switchTab('chats');
}

function autoCloseTodGame() {
    closeModal('tod-modal');
    showToast('زمان بازی پایان یافت!', '⏰');
}

// ==================== منطق بازی: شخصیت‌شناسی ====================

const quizQuestions = [
    {
        question: 'در آخر هفته ترجیح می‌دهید:',
        options: [
            { text: '☕ رفتن به کافه و شلوغی', score: 85 },
            { text: '🎬 تماشای فیلم در خانه', score: 92 }
        ]
    },
    {
        question: 'برای تاریخ ایده‌آل شما چیست:',
        options: [
            { text: '🍽️ شام در رستوران لوکس', score: 78 },
            { text: '🎮 بازی‌کردن بازی‌های ویدیویی', score: 88 }
        ]
    },
    {
        question: 'هنگام استرس بیشتر دوست دارید:',
        options: [
            { text: '🏃 ورزش و حرکت', score: 80 },
            { text: '🎵 گوش دادن به موسیقی', score: 90 }
        ]
    }
];

function openPersonalityTest() {
    document.getElementById('personality-modal').classList.remove('hidden');
    state.quizCurrentQuestion = 0;
    state.quizUserScore = 0;
    state.quizPartnerScore = 0;
    displayQuizQuestion();
}

function displayQuizQuestion() {
    if (state.quizCurrentQuestion >= quizQuestions.length) {
        showQuizResult();
        return;
    }

    const question = quizQuestions[state.quizCurrentQuestion];
    document.getElementById('quiz-question').innerText = question.question;
    
    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';

    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'w-full py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-right px-3 hover:bg-white/10 transition';
        btn.innerText = option.text;
        btn.addEventListener('click', () => answerQuiz(option.score));
        optionsContainer.appendChild(btn);
    });
}

function answerQuiz(score) {
    state.quizUserScore += score;
    state.quizCurrentQuestion++;
    displayQuizQuestion();
}

function showQuizResult() {
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('quiz-result').classList.remove('hidden');
    const matchPercent = Math.floor((state.quizUserScore / (quizQuestions.length * 100)) * 100);
    document.getElementById('match-percent').innerText = matchPercent + '%';
}

// ==================== منطق بازی: دوز نئونی ====================

function openTicTacToe() {
    document.getElementById('tictactoe-modal').classList.remove('hidden');
    resetTicTacToe();
    renderTttBoard();
}

function renderTttBoard() {
    const board = document.getElementById('ttt-board');
    board.innerHTML = '';

    state.tttBoard.forEach((cell, index) => {
        const btn = document.createElement('button');
        btn.className = 'tictactoe-cell spicy-card rounded-xl';
        btn.innerText = cell || '';
        
        if (cell === 'X') btn.style.color = '#ff3b5c';
        if (cell === 'O') btn.style.color = '#3b82f6';

        btn.addEventListener('click', () => makeTttMove(index));
        board.appendChild(btn);
    });

    updateTttStatus();
}

function makeTttMove(index) {
    if (state.tttBoard[index] || !state.tttIsPlayerTurn) return;

    state.tttBoard[index] = state.tttPlayerSymbol;
    state.tttIsPlayerTurn = false;

    if (!checkTttWin() && !isTttBoardFull()) {
        makeAIMove();
    }

    renderTttBoard();
}

function makeAIMove() {
    const availableMoves = state.tttBoard
        .map((cell, i) => cell === null ? i : null)
        .filter(i => i !== null);

    if (availableMoves.length === 0) {
        state.tttIsPlayerTurn = false;
        return;
    }

    const move = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    state.tttBoard[move] = state.tttAISymbol;
    state.tttIsPlayerTurn = true;

    if (!checkTttWin()) {
        renderTttBoard();
    }
}

function checkTttWin() {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (let line of lines) {
        const [a, b, c] = line;
        if (state.tttBoard[a] && 
            state.tttBoard[a] === state.tttBoard[b] && 
            state.tttBoard[a] === state.tttBoard[c]) {
            return state.tttBoard[a];
        }
    }
    return null;
}

function isTttBoardFull() {
    return state.tttBoard.every(cell => cell !== null);
}

function updateTttStatus() {
    const winner = checkTttWin();
    let statusText = '';

    if (winner === 'X') {
        statusText = 'شما برنده شدید! 🎉';
    } else if (winner === 'O') {
        statusText = 'بات برنده شد! 🤖';
    } else if (isTttBoardFull()) {
        statusText = 'مساوی شد! 🤝';
    } else {
        statusText = state.tttIsPlayerTurn ? 'نوبت شما' : 'نوبت بات...';
    }

    document.getElementById('ttt-status').innerText = statusText;
}

function resetTicTacToe() {
    state.tttBoard = Array(9).fill(null);
    state.tttIsPlayerTurn = true;
    renderTttBoard();
}

// ==================== منطق بازی: سنگ کاغذ قیچی ====================

function openRpsGame() {
    document.getElementById('rps-modal').classList.remove('hidden');
    state.rpsScore = { player: 0, bot: 0 };
    updateRpsScore();
}

function playRps(playerChoice) {
    const choices = ['👊', '✋', '✂️'];
    const botChoice = choices[Math.floor(Math.random() * 3)];

    let result = '';
    if (playerChoice === botChoice) {
        result = 'مساوی شد!';
    } else if (
        (playerChoice === '👊' && botChoice === '✂️') ||
        (playerChoice === '✋' && botChoice === '👊') ||
        (playerChoice === '✂️' && botChoice === '✋')
    ) {
        result = 'شما برنده شدید! 🎉';
        state.rpsScore.player++;
    } else {
        result = 'بات برنده شد! 🤖';
        state.rpsScore.bot++;
    }

    document.getElementById('rps-result').innerText = `شما: ${playerChoice} | بات: ${botChoice} -> ${result}`;
    updateRpsScore();

    // بررسی پایان بازی
    if (state.rpsScore.player === 3 || state.rpsScore.bot === 3) {
        setTimeout(() => {
            const winner = state.rpsScore.player === 3 ? 'شما' : 'بات';
            showToast(`${winner} این بازی را برد!`, '🏆');
            closeModal('rps-modal');
        }, 1000);
    }
}

function updateRpsScore() {
    const total = state.rpsScore.player + state.rpsScore.bot;
    document.getElementById('rps-score').innerText = 
        `امتیاز: ${state.rpsScore.player}/${total}`;
}

// ==================== مدیریت VIP ====================

async function handleBuyVip() {
    if (state.isVip) {
        showToast('شما قبلاً VIP هستید! ⭐');
        return;
    }

    try {
        // در اینجا از Telegram Stars استفاده می‌شود
        if (tg.sendData) {
            tg.sendData(JSON.stringify({ action: 'buy_vip', userId: state.userId }));
        }

        state.isVip = true;
        document.getElementById('vip-status').innerText = 'VIP ✅';
        showToast('ارتقا به VIP موفقیت‌آمیز بود! ⭐', '⭐');
        localStorage.setItem('userVip', 'true');

    } catch (err) {
        showError('خطا در خرید VIP');
        console.error('VIP purchase error:', err);
    }
}

function handleLogout() {
    if (confirm('آیا می‌خواهید از حساب خود خارج شوید؟')) {
        localStorage.removeItem('spicyProfile');
        localStorage.removeItem('userVip');
        state.userProfile = null;
        state.isVip = false;
        state.userId = null;
        
        document.getElementById('login-screen').classList.remove('hidden');
        showToast('خارج شدید! 👋');
    }
}

// ==================== شروع برنامه ====================

console.log('🌶️ Spicy Date App Loaded Successfully');
