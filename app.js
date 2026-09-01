document.addEventListener('DOMContentLoaded', () => {
    // ۱. مقداردهی اولیه Telegram WebApp SDK
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#0f0c20');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0f0c20');
    }

    let currentUser = null;
    let currentFeedIndex = 0;
    let selectedTags = [];
    let mediaRecorder = null;
    let audioChunks = [];
    let activeAudio = null;

    const mockUsers = [
        {
            id: 1,
            name: "سارا",
            age: 23,
            city: "تهران",
            isVip: true,
            img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600",
            interests: ["☕ کافه‌گردی", "🎧 موسیقی", "🎬 فیلم و سریال"],
            voiceUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        },
        {
            id: 2,
            name: "آرش",
            age: 26,
            city: "شیراز",
            isVip: false,
            img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600",
            interests: ["🎮 گیمینگ", "⚽ ورزش", "💻 تکنولوژی"],
            voiceUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
        }
    ];

    // سیستم نمایش توست
    function showToast(message, icon = '🌶️') {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        if (!toast || !toastMsg || !toastIcon) return;

        toastMsg.textContent = message;
        toastIcon.textContent = icon;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function toggleLoader(show) {
        const loader = document.getElementById('page-loader');
        if (!loader) return;
        if (show) {
            loader.classList.remove('hidden');
            loader.classList.add('flex');
        } else {
            loader.classList.add('hidden');
            loader.classList.remove('flex');
        }
    }

    // تغییر تب‌ها
    function switchTab(targetTab) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
            if (tab.id === `tab-${targetTab}`) tab.classList.add('active');
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.tab === targetTab) {
                btn.classList.add('active', 'text-red-500');
                btn.classList.remove('text-gray-400');
            } else {
                btn.classList.remove('active', 'text-red-500');
                btn.classList.add('text-gray-400');
            }
        });
    }

    // بررسی ورود قبلی
    const savedProfile = localStorage.getItem('spicy_user_profile');
    if (savedProfile) {
        try {
            currentUser = JSON.parse(savedProfile);
            document.getElementById('login-screen')?.classList.add('hidden');
            updateProfileUI();
            renderFeedCard();
        } catch (e) {
            localStorage.removeItem('spicy_user_profile');
        }
    }

    // مدیریت جهانی کلیک‌ها (Global Click Handler)
    document.addEventListener('click', (e) => {
        const target = e.target;
        const btn = target.closest('button, .nav-btn, .spicy-card, .tag-chip, .rps-btn');
        if (!btn) return;

        // دکمه‌های ناوبری
        if (btn.classList.contains('nav-btn') || btn.dataset.tab) {
            const tab = btn.dataset.tab || btn.closest('.nav-btn')?.dataset.tab;
            if (tab) switchTab(tab);
            return;
        }

        // ورود با تلگرام
        if (btn.id === 'btn-telegram-login') {
            toggleLoader(true);
            setTimeout(() => {
                toggleLoader(false);
                const tgUser = tg?.initDataUnsafe?.user;
                currentUser = {
                    name: tgUser?.first_name || 'کاربر تلگرام',
                    age: 24,
                    city: 'تهران',
                    interests: ['☕ کافه‌گردی', '🎧 موسیقی'],
                    isVip: false
                };
                saveAndInitUser();
                showToast(`خوش آمدی ${currentUser.name}! ⚡`);
            }, 500);
            return;
        }

        // مودال ثبت‌نام
        if (btn.id === 'btn-open-register') {
            document.getElementById('register-modal')?.classList.remove('hidden');
            return;
        }
        if (btn.id === 'btn-close-register') {
            document.getElementById('register-modal')?.classList.add('hidden');
            return;
        }

        // انتخاب تگ علاقه‌مندی
        if (btn.classList.contains('tag-chip')) {
            const tagText = btn.textContent.trim();
            if (btn.classList.contains('selected')) {
                btn.classList.remove('selected');
                selectedTags = selectedTags.filter(t => t !== tagText);
            } else {
                if (selectedTags.length >= 3) {
                    showToast('حداکثر ۳ علاقه‌مندی می‌توانید انتخاب کنید!', '⚠️');
                    return;
                }
                btn.classList.add('selected');
                selectedTags.push(tagText);
            }
            return;
        }

        // ذخیره اطلاعات
        if (btn.id === 'btn-save-profile') {
            const name = document.getElementById('reg-name')?.value.trim();
            const age = document.getElementById('reg-age')?.value.trim();
            const city = document.getElementById('reg-city')?.value.trim();

            if (!name || !age || !city) {
                showToast('لطفاً همه فیلدها را پر کنید.', '⚠️');
                return;
            }

            currentUser = { name, age, city, interests: selectedTags, isVip: currentUser?.isVip || false };
            saveAndInitUser();
            document.getElementById('register-modal')?.classList.add('hidden');
            showToast('پروفایل ذخیره شد! 🔥');
            return;
        }

        // اکشن‌های کارت اکسپلور
        if (btn.id === 'btn-pass') { nextCard(); return; }
        if (btn.id === 'btn-like') {
            const user = mockUsers[currentFeedIndex];
            if (user) showToast(`شما به ${user.name} اسپایسی دادید! 🌶️`);
            nextCard();
            return;
        }
        if (btn.id === 'btn-super') {
            const user = mockUsers[currentFeedIndex];
            if (user) showToast(`سوپر اسپایسی ارسال شد! ⭐`);
            nextCard();
            return;
        }
        if (btn.id === 'btn-game') { switchTab('games'); return; }

        // باز کردن مینی‌گیم‌ها
        if (btn.id === 'game-truth-or-dare') { document.getElementById('tod-modal')?.classList.remove('hidden'); return; }
        if (btn.id === 'btn-close-tod') { document.getElementById('tod-modal')?.classList.add('hidden'); return; }
        
        if (btn.id === 'game-tictactoe') { document.getElementById('tictactoe-modal')?.classList.remove('hidden'); resetTTT(); return; }
        if (btn.id === 'btn-close-tictactoe') { document.getElementById('tictactoe-modal')?.classList.add('hidden'); return; }
        if (btn.id === 'btn-reset-ttt') { resetTTT(); return; }

        if (btn.id === 'game-rps') { document.getElementById('rps-modal')?.classList.remove('hidden'); return; }
        if (btn.id === 'btn-close-rps') { document.getElementById('rps-modal')?.classList.add('hidden'); return; }

        // خروج و VIP
        if (btn.id === 'btn-logout') {
            localStorage.removeItem('spicy_user_profile');
            location.reload();
            return;
        }
        if (btn.id === 'btn-buy-vip' || btn.id === 'btn-upgrade-vip') {
            if (currentUser) currentUser.isVip = true;
            saveAndInitUser();
            showToast('اشتراک VIP فعال شد! ⭐');
            return;
        }
    });

    function saveAndInitUser() {
        localStorage.setItem('spicy_user_profile', JSON.stringify(currentUser));
        document.getElementById('login-screen')?.classList.add('hidden');
        updateProfileUI();
        renderFeedCard();
    }

    function updateProfileUI() {
        if (!currentUser) return;
        const profName = document.getElementById('prof-name');
        const profInfo = document.getElementById('prof-info');
        const vipStatus = document.getElementById('vip-status');

        if (profName) profName.textContent = `${currentUser.name}، ${currentUser.age}`;
        if (profInfo) profInfo.textContent = `📍 ${currentUser.city}`;
        if (vipStatus && currentUser.isVip) vipStatus.textContent = 'VIP فعال ⭐';
    }

    function renderFeedCard() {
        const userCard = document.getElementById('user-card');
        if (!userCard) return;

        if (currentFeedIndex >= mockUsers.length) {
            userCard.innerHTML = `<div class="text-center my-auto p-4"><p class="text-xs text-gray-400">کاربر دیگری یافت نشد!</p></div>`;
            return;
        }

        const user = mockUsers[currentFeedIndex];
        const cardImg = document.getElementById('card-img');
        const cardName = document.getElementById('card-name');
        const cardLoc = document.getElementById('card-location');

        if (cardImg) cardImg.src = user.img;
        if (cardName) cardName.textContent = `${user.name}، ${user.age}`;
        if (cardLoc) cardLoc.textContent = `📍 ${user.city}`;
    }

    function nextCard() {
        currentFeedIndex++;
        renderFeedCard();
    }

    // منطق بازی دوز
    let board = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "❌";
    let gameActive = true;

    function resetTTT() {
        board = ["", "", "", "", "", "", "", "", ""];
        currentPlayer = "❌";
        gameActive = true;
        const status = document.getElementById('ttt-status');
        if (status) status.textContent = `نوبت: ${currentPlayer}`;
        renderTTTBoard();
    }

    function renderTTTBoard() {
        const boardElem = document.getElementById('ttt-board');
        if (!boardElem) return;
        boardElem.innerHTML = '';
        board.forEach((cell, idx) => {
            const div = document.createElement('div');
            div.className = `tictactoe-cell spicy-card rounded-xl border border-white/10 ${cell ? 'disabled' : ''}`;
            div.textContent = cell;
            div.onclick = () => {
                if (board[idx] !== "" || !gameActive) return;
                board[idx] = currentPlayer;
                checkTTTWinner();
                if (gameActive) {
                    currentPlayer = currentPlayer === "❌" ? "⭕" : "❌";
                    const status = document.getElementById('ttt-status');
                    if (status) status.textContent = `نوبت: ${currentPlayer}`;
                }
                renderTTTBoard();
            };
            boardElem.appendChild(div);
        });
    }

    function checkTTTWinner() {
        const winConditions = [
            [0,1,2], [3,4,5], [6,7,8],
            [0,3,6], [1,4,7], [2,5,8],
            [0,4,8], [2,4,6]
        ];
        for (let condition of winConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                gameActive = false;
                document.getElementById('ttt-status').textContent = `برنده: ${board[a]} 🎉`;
                return;
            }
        }
    }
});
