document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. مقداردهی اولیه Telegram WebApp SDK
    // ----------------------------------------------------
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        // تنظیم رنگ نوار بالای تلگرام متناسب با تم برنامه
        if (tg.setHeaderColor) tg.setHeaderColor('#0f0c20');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0f0c20');
    }

    let currentUser = null;
    let currentFeedIndex = 0;
    let selectedTags = [];
    let mediaRecorder = null;
    let audioChunks = [];
    let activeAudio = null;

    // داده‌های نمونه برای کارت‌های اکسپلور
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
        },
        {
            id: 3,
            name: "مریم",
            age: 21,
            city: "اصفهان",
            isVip: true,
            img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=600",
            interests: ["✈️ سفر", "🎨 هنر و طراحی", "🍕 آشپزی"],
            voiceUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
        }
    ];

    // ----------------------------------------------------
    // 2. مدیریت اعلانات (Toast) و لودینگ (Loader)
    // ----------------------------------------------------
    function showToast(message, icon = '🌶️') {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        if (!toast || !toastMsg || !toastIcon) return;

        toastMsg.textContent = message;
        toastIcon.textContent = icon;

        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
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

    // ----------------------------------------------------
    // 3. مدیریت تب‌ها و ناوبری (Navigation)
    // ----------------------------------------------------
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(targetTab) {
        tabContents.forEach(tab => {
            tab.classList.remove('active');
            if (tab.id === `tab-${targetTab}`) {
                tab.classList.add('active');
            }
        });

        navButtons.forEach(btn => {
            if (btn.dataset.tab === targetTab) {
                btn.classList.add('active', 'text-red-500');
                btn.classList.remove('text-gray-400');
            } else {
                btn.classList.remove('active', 'text-red-500');
                btn.classList.add('text-gray-400');
            }
        });
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // ----------------------------------------------------
    // 4. احراز هویت و پروفایل کاربری
    // ----------------------------------------------------
    const loginScreen = document.getElementById('login-screen');
    const registerModal = document.getElementById('register-modal');

    // چک کردن پروفایل ذخیره‌شده
    const savedProfile = localStorage.getItem('spicy_user_profile');
    if (savedProfile) {
        try {
            currentUser = JSON.parse(savedProfile);
            if (loginScreen) loginScreen.classList.add('hidden');
            updateProfileUI();
            renderFeedCard();
        } catch (e) {
            localStorage.removeItem('spicy_user_profile');
        }
    }

    // ورود با اکانت تلگرام
    const btnTgLogin = document.getElementById('btn-telegram-login');
    if (btnTgLogin) {
        btnTgLogin.addEventListener('click', () => {
            toggleLoader(true);
            setTimeout(() => {
                toggleLoader(false);
                const tgUser = tg?.initDataUnsafe?.user;

                if (tgUser) {
                    currentUser = {
                        name: tgUser.first_name || 'کاربر تلگرام',
                        age: 24,
                        city: 'تهران',
                        interests: ['☕ کافه‌گردی', '🎧 موسیقی', '🎮 گیمینگ'],
                        isVip: false
                    };
                } else {
                    currentUser = {
                        name: 'کاربر مهمان',
                        age: 22,
                        city: 'تهران',
                        interests: ['✈️ سفر', '🎧 موسیقی', '🍕 آشپزی'],
                        isVip: false
                    };
                }
                saveAndInitUser();
                showToast(`خوش آمدی ${currentUser.name}! ⚡`);
            }, 600);
        });
    }

    // باز/بسته‌کردن مودال ثبت نام
    document.getElementById('btn-open-register')?.addEventListener('click', () => {
        registerModal?.classList.remove('hidden');
    });

    document.getElementById('btn-close-register')?.addEventListener('click', () => {
        registerModal?.classList.add('hidden');
    });

    // انتخاب تگ‌های علاقه‌مندی
    const tagChips = document.querySelectorAll('.tag-chip');
    tagChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const tagText = chip.textContent.trim();
            if (chip.classList.contains('selected')) {
                chip.classList.remove('selected');
                selectedTags = selectedTags.filter(t => t !== tagText);
            } else {
                if (selectedTags.length >= 3) {
                    showToast('شما حداکثر ۳ علاقه‌مندی می‌توانید انتخاب کنید!', '⚠️');
                    return;
                }
                chip.classList.add('selected');
                selectedTags.push(tagText);
            }
        });
    });

    // ضبط ویس (Spicy Voice) با مدیریت ایمن خطای مرورگر
    const recordBtn = document.getElementById('record-btn');
    const voiceStatus = document.getElementById('voice-status');

    if (recordBtn) {
        recordBtn.addEventListener('click', async () => {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showToast('مرورگر شما از ضبط صدا پشتیبانی نمی‌کند!', '❌');
                return;
            }

            if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    mediaRecorder = new MediaRecorder(stream);
                    audioChunks = [];

                    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
                    mediaRecorder.onstop = () => {
                        if (voiceStatus) {
                            voiceStatus.textContent = "ضبط شد (آماده ارسال)";
                            voiceStatus.classList.add('text-green-400');
                        }
                        document.getElementById('rec-icon').textContent = '🔴';
                        document.getElementById('rec-text').textContent = 'ضبط مجدد';
                    };

                    mediaRecorder.start();
                    document.getElementById('rec-icon').textContent = '⏹️';
                    document.getElementById('rec-text').textContent = 'پایان ضبط';
                    if (voiceStatus) voiceStatus.textContent = "در حال ضبط...";

                    setTimeout(() => {
                        if (mediaRecorder && mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                    }, 15000);
                } catch (err) {
                    showToast('دسترسی به میکروفون مسدود است!', '❌');
                }
            } else if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        });
    }

    // ذخیره‌سازی پروفایل
    document.getElementById('btn-save-profile')?.addEventListener('click', () => {
        const name = document.getElementById('reg-name')?.value.trim();
        const age = document.getElementById('reg-age')?.value.trim();
        const city = document.getElementById('reg-city')?.value.trim();

        if (!name || !age || !city) {
            showToast('لطفا تمامی فیلدها را پر کنید.', '⚠️');
            return;
        }

        if (selectedTags.length < 3) {
            const errElem = document.getElementById('interest-error');
            if (errElem) errElem.textContent = 'لطفاً ۳ علاقه‌مندی انتخاب کنید.';
            return;
        }

        currentUser = {
            name,
            age,
            city,
            interests: selectedTags,
            isVip: currentUser ? currentUser.isVip : false
        };

        saveAndInitUser();
        registerModal?.classList.add('hidden');
        showToast('پروفایل ذخیره شد! 🔥');
    });

    function saveAndInitUser() {
        localStorage.setItem('spicy_user_profile', JSON.stringify(currentUser));
        if (loginScreen) loginScreen.classList.add('hidden');
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
        if (vipStatus && currentUser.isVip) vipStatus.textContent = 'VIP فعال';
    }

    document.getElementById('btn-logout')?.addEventListener('click', () => {
        localStorage.removeItem('spicy_user_profile');
        location.reload();
    });

    // ----------------------------------------------------
    // 5. کارت‌های اکسپلور (Feed & Match)
    // ----------------------------------------------------
    function renderFeedCard() {
        const userCard = document.getElementById('user-card');
        if (!userCard) return;

        if (currentFeedIndex >= mockUsers.length) {
            userCard.innerHTML = `
                <div class="text-center my-auto p-4 space-y-2">
                    <span class="text-4xl">🏜️</span>
                    <h3 class="text-sm font-bold text-gray-300">کاربر دیگری یافت نشد!</h3>
                    <p class="text-[10px] text-gray-500">بعداً دوباره سر بزنید.</p>
                </div>
            `;
            return;
        }

        const user = mockUsers[currentFeedIndex];
        document.getElementById('card-img').src = user.img;
        document.getElementById('card-name').textContent = `${user.name}، ${user.age}`;
        document.getElementById('card-location').textContent = `📍 ${user.city}`;

        const vipBadge = document.getElementById('vip-badge');
        if (vipBadge) {
            if (user.isVip) vipBadge.classList.remove('hidden');
            else vipBadge.classList.add('hidden');
        }

        const interestsContainer = document.getElementById('card-interests');
        if (interestsContainer) {
            interestsContainer.innerHTML = '';
            user.interests.forEach(tag => {
                const span = document.createElement('span');
                span.className = 'text-[9px] bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 text-gray-200';
                span.textContent = tag;
                interestsContainer.appendChild(span);
            });
        }

        const playBtn = document.getElementById('btn-play-voice');
        if (playBtn) {
            playBtn.onclick = () => {
                if (activeAudio) {
                    activeAudio.pause();
                    if (activeAudio.src === user.voiceUrl) {
                        activeAudio = null;
                        playBtn.textContent = '▶';
                        return;
                    }
                }
                activeAudio = new Audio(user.voiceUrl);
                activeAudio.play().catch(() => showToast('خطا در پخش فایل صوتی', '⚠️'));
                playBtn.textContent = '⏸';
                activeAudio.onended = () => {
                    playBtn.textContent = '▶';
                    activeAudio = null;
                };
            };
        }
    }

    document.getElementById('btn-pass')?.addEventListener('click', () => nextCard());

    document.getElementById('btn-like')?.addEventListener('click', () => {
        const user = mockUsers[currentFeedIndex];
        if (user) {
            showToast(`شما به ${user.name} اسپایسی دادید! 🌶️`);
            addChat(user);
        }
        nextCard();
    });

    document.getElementById('btn-super')?.addEventListener('click', () => {
        const user = mockUsers[currentFeedIndex];
        if (user) {
            showToast(`سوپر اسپایسی برای ${user.name} ارسال شد! ⭐`);
            addChat(user);
        }
        nextCard();
    });

    document.getElementById('btn-game')?.addEventListener('click', () => switchTab('games'));

    function nextCard() {
        if (activeAudio) {
            activeAudio.pause();
            activeAudio = null;
        }
        currentFeedIndex++;
        const card = document.getElementById('user-card');
        if (card) {
            card.classList.remove('fade-in');
            void card.offsetWidth;
            card.classList.add('fade-in');
        }
        renderFeedCard();
    }

    // ----------------------------------------------------
    // 6. سیستم گفت‌وگوها (Chats)
    // ----------------------------------------------------
    const activeChats = [];

    function addChat(user) {
        if (activeChats.find(c => c.id === user.id)) return;
        activeChats.push(user);
        renderChatsList();
    }

    function renderChatsList() {
        const chatsList = document.getElementById('chats-list');
        if (!chatsList) return;

        if (activeChats.length === 0) {
            chatsList.innerHTML = '<p class="text-gray-400 text-xs text-center mt-8">هنوز چتی باز نشده است</p>';
            return;
        }

        chatsList.innerHTML = '';
        activeChats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'spicy-card p-3 rounded-2xl flex justify-between items-center cursor-pointer hover:bg-white/10 transition';
            item.innerHTML = `
                <div class="flex items-center gap-3">
                    <img src="${chat.img}" class="w-10 h-10 rounded-full object-cover border border-red-500/30">
                    <div>
                        <h3 class="font-bold text-xs text-white">${chat.name}</h3>
                        <p class="text-[10px] text-green-400">یک مسابقه جدید!</p>
                    </div>
                </div>
                <span class="text-xs bg-red-500/20 text-red-400 px-2.5 py-1 rounded-xl border border-red-500/30">چت 💬</span>
            `;
            item.onclick = () => showToast(`گفتگو با ${chat.name}`);
            chatsList.appendChild(item);
        });
    }

    // ----------------------------------------------------
    // 7. چت شبانه (Night Mask Chat)
    // ----------------------------------------------------
    document.getElementById('btn-night-chat')?.addEventListener('click', () => {
        if (!currentUser?.isVip) {
            showToast('این بخش مخصوص کاربران VIP است!', '⭐');
            return;
        }
        toggleLoader(true);
        setTimeout(() => {
            toggleLoader(false);
            showToast('پارتنر ناشناس پیدا شد! 🎭');
        }, 1500);
    });

    // ----------------------------------------------------
    // 8. مینی‌گیم ۱: جرأت یا حقیقت
    // ----------------------------------------------------
    const todModal = document.getElementById('tod-modal');
    document.getElementById('game-truth-or-dare')?.addEventListener('click', () => {
        todModal?.classList.remove('hidden');
        startTodTimer(600);
    });

    document.getElementById('btn-close-tod')?.addEventListener('click', () => {
        todModal?.classList.add('hidden');
    });

    let todTimerInterval;
    function startTodTimer(duration) {
        let timer = duration, minutes, seconds;
        clearInterval(todTimerInterval);
        todTimerInterval = setInterval(() => {
            minutes = parseInt(timer / 60, 10);
            seconds = parseInt(timer % 60, 10);
            minutes = minutes < 10 ? "0" + minutes : minutes;
            seconds = seconds < 10 ? "0" + seconds : seconds;

            const timerElem = document.getElementById('tod-timer');
            if (timerElem) timerElem.textContent = minutes + ":" + seconds;

            if (--timer < 0) {
                clearInterval(todTimerInterval);
                showToast('زمان به پایان رسید!');
                todModal?.classList.add('hidden');
            }
        }, 1000);
    }

    document.getElementById('btn-send-tod')?.addEventListener('click', () => {
        const input = document.getElementById('tod-input');
        if (!input || !input.value.trim()) return;

        const chatBox = document.getElementById('tod-chat-box');
        if (chatBox) {
            const msg = document.createElement('div');
            msg.className = 'bg-red-500/20 p-2 rounded-xl text-right ml-auto max-w-[80%] border border-red-500/30';
            msg.textContent = input.value;
            chatBox.appendChild(msg);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
        input.value = '';
    });

    // ----------------------------------------------------
    // 9. مینی‌گیم ۲: تست شخصیت
    // ----------------------------------------------------
    const personalityModal = document.getElementById('personality-modal');
    const quizQuestions = [
        { q: "قرار ملاقات ایده‌آل شما چطوره؟", options: ["☕ کافه آرام", "🎢 شهربازی هیجانی", "🏕️ طبیعت‌گردی"] },
        { q: "در مواقع فراغت چکار می‌کنید؟", options: ["🎧 موسیقی و فیلم", "🎮 گیم با دوستان", "📚 مطالعه و هنر"] }
    ];
    let currentQuizStep = 0;

    document.getElementById('game-personality')?.addEventListener('click', () => {
        personalityModal?.classList.remove('hidden');
        currentQuizStep = 0;
        document.getElementById('quiz-container')?.classList.remove('hidden');
        document.getElementById('quiz-result')?.classList.add('hidden');
        renderQuizStep();
    });

    document.getElementById('btn-close-personality')?.addEventListener('click', () => {
        personalityModal?.classList.add('hidden');
    });

    function renderQuizStep() {
        if (currentQuizStep >= quizQuestions.length) {
            document.getElementById('quiz-container')?.classList.add('hidden');
            document.getElementById('quiz-result')?.classList.remove('hidden');
            const percentElem = document.getElementById('match-percent');
            if (percentElem) percentElem.textContent = `${Math.floor(Math.random() * 20) + 80}%`;
            return;
        }

        const qData = quizQuestions[currentQuizStep];
        const qElem = document.getElementById('quiz-question');
        if (qElem) qElem.textContent = qData.q;

        const optionsContainer = document.getElementById('quiz-options');
        if (optionsContainer) {
            optionsContainer.innerHTML = '';
            qData.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'w-full py-2 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-amber-500/20 transition';
                btn.textContent = opt;
                btn.onclick = () => {
                    currentQuizStep++;
                    renderQuizStep();
                };
                optionsContainer.appendChild(btn);
            });
        }
    }

    // ----------------------------------------------------
    // 10. مینی‌گیم ۳: دوز نئونی (Tic-Tac-Toe)
    // ----------------------------------------------------
    const tttModal = document.getElementById('tictactoe-modal');
    let board = ["", "", "", "", "", "", "", "", ""];
    let currentPlayer = "❌";
    let gameActive = true;

    document.getElementById('game-tictactoe')?.addEventListener('click', () => {
        tttModal?.classList.remove('hidden');
        resetTTT();
    });

    document.getElementById('btn-close-tictactoe')?.addEventListener('click', () => {
        tttModal?.classList.add('hidden');
    });

    function resetTTT() {
        board = ["", "", "", "", "", "", "", "", ""];
        currentPlayer = "❌";
        gameActive = true;
        const statusElem = document.getElementById('ttt-status');
        if (statusElem) statusElem.textContent = `نوبت: ${currentPlayer}`;
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
            div.onclick = () => handleCellClick(idx);
            boardElem.appendChild(div);
        });
    }

    function handleCellClick(idx) {
        if (board[idx] !== "" || !gameActive) return;
        board[idx] = currentPlayer;
        checkTTTWinner();
        if (gameActive) {
            currentPlayer = currentPlayer === "❌" ? "⭕" : "❌";
            const statusElem = document.getElementById('ttt-status');
            if (statusElem) statusElem.textContent = `نوبت: ${currentPlayer}`;
        }
        renderTTTBoard();
    }

    function checkTTTWinner() {
        const winConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let condition of winConditions) {
            const [a, b, c] = condition;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                gameActive = false;
                const statusElem = document.getElementById('ttt-status');
                if (statusElem) statusElem.textContent = `بازیکن ${board[a]} برنده شد! 🎉`;
                return;
            }
        }

        if (!board.includes("")) {
            gameActive = false;
            const statusElem = document.getElementById('ttt-status');
            if (statusElem) statusElem.textContent = "بازی مساوی شد! 🤝";
        }
    }

    document.getElementById('btn-reset-ttt')?.addEventListener('click', resetTTT);

    // ----------------------------------------------------
    // 11. مینی‌گیم ۴: سنگ کاغذ قیچی
    // ----------------------------------------------------
    const rpsModal = document.getElementById('rps-modal');
    let userScore = 0;

    document.getElementById('game-rps')?.addEventListener('click', () => {
        rpsModal?.classList.remove('hidden');
        userScore = 0;
        const scoreElem = document.getElementById('rps-score');
        const resElem = document.getElementById('rps-result');
        if (scoreElem) scoreElem.textContent = `امتیاز: ${userScore}/3`;
        if (resElem) resElem.textContent = 'انتخاب کنید...';
    });

    document.getElementById('btn-close-rps')?.addEventListener('click', () => {
        rpsModal?.classList.add('hidden');
    });

    document.querySelectorAll('.rps-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const userChoice = btn.dataset.choice;
            const choices = ['👊', '✋', '✂️'];
            const botChoice = choices[Math.floor(Math.random() * choices.length)];

            let resultText = '';
            if (userChoice === botChoice) {
                resultText = `مساوی! هر دو ${botChoice}`;
            } else if (
                (userChoice === '👊' && botChoice === '✂️') ||
                (userChoice === '✋' && botChoice === '👊') ||
                (userChoice === '✂️' && botChoice === '✋')
            ) {
                userScore++;
                resultText = `برنده شدید! حریف ${botChoice} آورد.`;
            } else {
                resultText = `باختید! حریف ${botChoice} آورد.`;
            }

            const scoreElem = document.getElementById('rps-score');
            const resElem = document.getElementById('rps-result');
            if (scoreElem) scoreElem.textContent = `امتیاز: ${userScore}/3`;
            if (resElem) resElem.textContent = resultText;

            if (userScore >= 3) {
                showToast('تبریک! شما برنده چالش شدید 🏆');
                setTimeout(() => rpsModal?.classList.add('hidden'), 1000);
            }
        });
    });

    // ----------------------------------------------------
    // 12. پرداخت‌های استارز تلگرام (Telegram Stars)
    // ----------------------------------------------------
    function handleVipPurchase() {
        if (tg && tg.openInvoice) {
            showToast('در حال آماده‌سازی پرداخت...', '⭐️');
            // در حالت عملیاتی لینک فاکتور پرداختی تولید شده از ربات پاس داده می‌شود
            const invoiceUrl = ""; 
            if (invoiceUrl) {
                tg.openInvoice(invoiceUrl, (status) => {
                    if (status === 'paid') {
                        if (currentUser) currentUser.isVip = true;
                        saveAndInitUser();
                        showToast('اشتراک VIP فعال شد! ⭐');
                    }
                });
            } else {
                // شبیه‌سازی تست پرداخت
                setTimeout(() => {
                    if (currentUser) currentUser.isVip = true;
                    saveAndInitUser();
                    showToast('اشتراک VIP بر روی اکانت شما فعال شد! ⭐');
                }, 1000);
            }
        } else {
            if (currentUser) currentUser.isVip = true;
            saveAndInitUser();
            showToast('اشتراک VIP فعال شد! ⭐');
        }
    }

    document.getElementById('btn-buy-vip')?.addEventListener('click', handleVipPurchase);
    document.getElementById('btn-upgrade-vip')?.addEventListener('click', handleVipPurchase);
});
