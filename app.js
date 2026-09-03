// ==========================================
// تنظیمات دیتابیس آنلاین Supabase
// ==========================================
const SUPABASE_URL = 'https://xivjfczprchemakaqsrf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_HxTEQUVB4Ohl8lki7EylIg_Pawg7CZ4';
const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    // ۱. مقداردهی اولیه Telegram WebApp SDK
    const tg = window.Telegram?.WebApp;
    if (tg) {
        tg.ready();
        tg.expand();
        if (tg.setHeaderColor) tg.setHeaderColor('#0f0c20');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#0f0c20');
    }

    const tgUser = tg?.initDataUnsafe?.user;
    const currentUserId = String(tgUser?.id || "demo_user_123");

    let currentUser = null;
    let currentFeedIndex = 0;
    let selectedTags = [];
    let onlineUsers = [];

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

        if (targetTab === 'chats') loadMatches();
    }

    // دریافت پروفایل کاربر از Supabase
    async function initUserSession() {
        toggleLoader(true);
        const { data: profile } = await db.from('profiles').select('*').eq('id', currentUserId).single();

        if (profile) {
            currentUser = profile;
            document.getElementById('login-screen')?.classList.add('hidden');
            updateProfileUI();
            await fetchFeedUsers();
        } else {
            document.getElementById('login-screen')?.classList.remove('hidden');
        }
        toggleLoader(false);
    }

    await initUserSession();

    // دریافت لیست سایر کاربران از دیتابیس
    async function fetchFeedUsers() {
        const { data: users, error } = await db.from('profiles').select('*').neq('id', currentUserId);
        if (!error && users) {
            onlineUsers = users;
            currentFeedIndex = 0;
            renderFeedCard();
        }
    }

    // مدیریت جهانی کلیک‌ها
    document.addEventListener('click', async (e) => {
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
            const name = tgUser?.first_name || 'کاربر تلگرام';
            
            const { error } = await db.from('profiles').upsert({
                id: currentUserId,
                name: name,
                age: 24,
                city: 'تهران'
            });

            toggleLoader(false);
            if (!error) {
                currentUser = { id: currentUserId, name, age: 24, city: 'تهران' };
                document.getElementById('login-screen')?.classList.add('hidden');
                updateProfileUI();
                await fetchFeedUsers();
                showToast(`خوش آمدی ${currentUser.name}! ⚡`);
            } else {
                showToast('خطا در اتصال به دیتابیس!', '⚠️');
            }
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

        // ذخیره اطلاعات آنلاین در Supabase
        if (btn.id === 'btn-save-profile') {
            const name = document.getElementById('reg-name')?.value.trim();
            const age = document.getElementById('reg-age')?.value.trim();
            const city = document.getElementById('reg-city')?.value.trim();

            if (!name || !age || !city) {
                showToast('لطفاً همه فیلدها را پر کنید.', '⚠️');
                return;
            }

            toggleLoader(true);
            const { error } = await db.from('profiles').upsert({
                id: currentUserId,
                name,
                age: parseInt(age),
                city,
                bio: selectedTags.join(' ، ')
            });

            toggleLoader(false);

            if (!error) {
                currentUser = { id: currentUserId, name, age, city };
                document.getElementById('register-modal')?.classList.add('hidden');
                document.getElementById('login-screen')?.classList.add('hidden');
                updateProfileUI();
                await fetchFeedUsers();
                showToast('پروفایل در دیتابیس ثبت شد! 🔥');
            } else {
                showToast('خطا در ذخیره‌سازی!', '⚠️');
            }
            return;
        }

        // اکشن لایک / سوایپ
        if (btn.id === 'btn-pass') { nextCard(); return; }
        if (btn.id === 'btn-like') {
            const user = onlineUsers[currentFeedIndex];
            if (user) {
                await db.from('likes').insert({ from_user_id: currentUserId, to_user_id: user.id });
                
                // بررسی Match آنلاین
                const { data: isMatched } = await db.from('likes')
                    .select('*')
                    .eq('from_user_id', user.id)
                    .eq('to_user_id', currentUserId)
                    .single();

                if (isMatched) {
                    showToast(`🎉 تبریک! با ${user.name} متچ شدید!`, '💖');
                } else {
                    showToast(`شما به ${user.name} اسپایسی دادید! 🌶️`);
                }
            }
            nextCard();
            return;
        }

        // باز کردن مینی‌گیم‌ها
        if (btn.id === 'game-truth-or-dare') { document.getElementById('tod-modal')?.classList.remove('hidden'); return; }
        if (btn.id === 'btn-close-tod') { document.getElementById('tod-modal')?.classList.add('hidden'); return; }
        
        if (btn.id === 'game-tictactoe') { document.getElementById('tictactoe-modal')?.classList.remove('hidden'); resetTTT(); return; }
        if (btn.id === 'btn-close-tictactoe') { document.getElementById('tictactoe-modal')?.classList.add('hidden'); return; }
        if (btn.id === 'btn-reset-ttt') { resetTTT(); return; }

        if (btn.id === 'game-rps') { document.getElementById('rps-modal')?.classList.remove('hidden'); return; }
        if (btn.id === 'btn-close-rps') { document.getElementById('rps-modal')?.classList.add('hidden'); return; }

        if (btn.id === 'btn-logout') {
            location.reload();
            return;
        }
    });

    function updateProfileUI() {
        if (!currentUser) return;
        const profName = document.getElementById('prof-name');
        const profInfo = document.getElementById('prof-info');

        if (profName) profName.textContent = `${currentUser.name}، ${currentUser.age}`;
        if (profInfo) profInfo.textContent = `📍 ${currentUser.city}`;
    }

    function renderFeedCard() {
        const userCard = document.getElementById('user-card');
        if (!userCard) return;

        if (currentFeedIndex >= onlineUsers.length) {
            userCard.innerHTML = `<div class="text-center my-auto p-4"><p class="text-xs text-gray-400">کاربر دیگری یافت نشد!</p></div>`;
            return;
        }

        const user = onlineUsers[currentFeedIndex];
        const cardImg = document.getElementById('card-img');
        const cardName = document.getElementById('card-name');
        const cardLoc = document.getElementById('card-location');

        if (cardImg) cardImg.src = user.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=600";
        if (cardName) cardName.textContent = `${user.name}، ${user.age}`;
        if (cardLoc) cardLoc.textContent = `📍 ${user.city}`;
    }

    function nextCard() {
        currentFeedIndex++;
        renderFeedCard();
    }

    // بارگذاری متچ‌ها از دیتابیس آنلاین
    async function loadMatches() {
        const list = document.getElementById('chats-list');
        if (!list) return;

        const { data: matches } = await db.from('likes').select('from_user_id, profiles!likes_from_user_id_fkey(*)').eq('to_user_id', currentUserId);

        if (matches && matches.length > 0) {
            list.innerHTML = matches.map(m => `
                <div class="spicy-card p-3 rounded-2xl flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-red-500/20 text-red-400 font-bold flex items-center justify-center">${(m.profiles?.name || 'U')[0]}</div>
                    <div>
                        <h4 class="text-xs font-bold">${m.profiles?.name || 'کاربر'}</h4>
                        <p class="text-[10px] text-gray-400">برای شروع چت کلیک کنید</p>
                    </div>
                </div>
            `).join('');
        } else {
            list.innerHTML = `<p class="text-gray-400 text-xs text-center mt-8">هنوز متچی ندارید</p>`;
        }
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
