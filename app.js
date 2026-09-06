const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

const IRAN_CITIES = [
    "تهران", "بندرعباس", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "قم", "اهواز", 
    "رشت", "کرمانشاه", "زاهدان", "ارومیه", "یزد", "اراک", "همدان", "قزوین", "سنندج", 
    "خرم‌آباد", "گرگان", "ساری", "بجنورد", "بوشهر", "بیرجند", "ایلام", "شهرکرد", 
    "سمنان", "زنجان", "یاسوج", "اردبیل", "کیش", "قشم", "چابهار"
];

// دیتای نمونه اولیه
let MOCK_USERS = [
    {
        telegram_id: 101,
        name: "سارا",
        age: 23,
        city: "بندرعباس",
        gender: "female",
        intent: "دوستی و چت ☕",
        bio: "علاقه‌مند به موسیقی، کافه‌گردی و دریا 🌊",
        photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80",
        voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
    },
    {
        telegram_id: 102,
        name: "آرمین",
        age: 26,
        city: "بندرعباس",
        gender: "male",
        intent: "کافه‌گردی و سفر ✈️",
        bio: "عاشق کمپینگ، قهوه و برنامه‌نویسی ☕",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80",
        voice: ""
    },
    {
        telegram_id: 103,
        name: "نیلوفر",
        age: 24,
        city: "تهران",
        gender: "female",
        intent: "آشنایی و ازدواج 💍",
        bio: "طراح UI/UX و شیفته هنر مدرن 🎨",
        photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
        voice: ""
    }
];

let suggestedUsersQueue = [];
let matchedUsersList = [];
let historyStack = []; // برای قابلیت Rewind
let dailySwipes = 0;
let isVip = false;

let isRecording = false;
let recordTimerInterval = null;
let recordSeconds = 0;

document.addEventListener('DOMContentLoaded', () => {
    populateCities();
    setupNavigation();
    initApp();
});

function populateCities() {
    const filterCitySelect = document.getElementById('filter-city');
    const userCitySelect = document.getElementById('user-city');

    IRAN_CITIES.sort().forEach(city => {
        filterCitySelect.add(new Option(city, city));
        userCitySelect.add(new Option(city, city));
    });
}

function initApp() {
    const user = tg?.initDataUnsafe?.user;
    if (user) {
        document.getElementById('profile-name-display').innerText = user.first_name || 'کاربر جدید';
        document.getElementById('user-display-name').value = user.first_name || '';
        if (user.photo_url) {
            document.getElementById('profile-avatar').src = user.photo_url;
        }
    }
    fetchSuggestedUsers();
}

function fetchSuggestedUsers() {
    const gender = document.getElementById('filter-gender').value;
    const city = document.getElementById('filter-city').value;

    let filtered = [...MOCK_USERS];
    if (gender !== 'all') filtered = filtered.filter(u => u.gender === gender);
    if (city !== 'all') filtered = filtered.filter(u => u.city === city);

    suggestedUsersQueue = filtered;
    renderNextCard();
}

function renderNextCard() {
    const container = document.getElementById('cards-container');

    if (!suggestedUsersQueue || suggestedUsersQueue.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div style="font-size:40px; margin-bottom:10px;">🔍</div>
                <h4>پروفایل دیگری یافت نشد!</h4>
                <p style="font-size:12px; margin-top:5px;">فیلتر شهر یا جنسیت را تغییر دهید.</p>
            </div>
        `;
        return;
    }

    const user = suggestedUsersQueue[0];

    container.innerHTML = `
        <div class="dating-card">
            <button class="btn-report-flag" onclick="reportUser(${user.telegram_id})">🚩 گزارش</button>
            <div class="card-media">
                <img src="${user.photo}" alt="${user.name}">
                <div class="card-gradient-overlay"></div>
                <div class="card-info-content">
                    <h2>${user.name} <span class="age">${user.age}</span></h2>
                    <div>
                        <span class="city-badge">📍 ${user.city}</span>
                        <span class="intent-badge">${user.intent || 'آشنایی'}</span>
                    </div>
                </div>
            </div>
            <div class="card-bio">
                <p>${user.bio}</p>
                ${user.voice ? `<button onclick="playVoice('${user.voice}')" class="btn-voice">🎙️ شنیدن ویس معرفی</button>` : ''}
            </div>
            <div class="card-actions-bar">
                <button onclick="handleRewind()" class="btn-circle btn-rewind" title="بازگردانی">🔄</button>
                <button onclick="handlePass()" class="btn-circle btn-pass" title="رد کردن">✖</button>
                <button onclick="handleSuperLike()" class="btn-circle btn-superlike" title="سوپر لایک">⭐</button>
                <button onclick="handleLike()" class="btn-circle btn-like-main" title="لایک">🔥</button>
            </div>
        </div>
    `;
}

function checkSwipeLimit() {
    if (isVip) return true;
    if (dailySwipes >= 50) {
        alert('سقف ۵۰ لایک رایگان روزانه شما تمام شد! برای سواپ نامحدود اشتراک VIP تهیه کنید.');
        buyVipWithStars();
        return false;
    }
    dailySwipes++;
    return true;
}

function handleLike() {
    if (!checkSwipeLimit()) return;
    const user = suggestedUsersQueue.shift();
    if (user) {
        historyStack.push(user);
        matchedUsersList.push(user);
    }
    renderNextCard();
}

function handlePass() {
    const user = suggestedUsersQueue.shift();
    if (user) historyStack.push(user);
    renderNextCard();
}

function handleSuperLike() {
    if (!checkSwipeLimit()) return;
    const user = suggestedUsersQueue[0];
    if (user) {
        alert(`⭐ سوپر لایک برای ${user.name} ارسال شد!`);
        handleLike();
    }
}

function handleRewind() {
    if (!isVip) {
        alert('بازگردانی کارت (Rewind) مخصوص کاربران VIP است!');
        buyVipWithStars();
        return;
    }
    if (historyStack.length === 0) {
        alert('کارتی برای بازگردانی وجود ندارد.');
        return;
    }
    const lastUser = historyStack.pop();
    suggestedUsersQueue.unshift(lastUser);
    renderNextCard();
}

function reportUser(userId) {
    if (confirm('آیا از گزارش و مسدود کردن این کاربر اطمینان دارید؟')) {
        alert('کاربر مسدود شد و دیگر به شما نشان داده نخواهد شد.');
        suggestedUsersQueue.shift();
        renderNextCard();
    }
}

function buyVipWithStars() {
    if (!tg) {
        alert('این قابلیت فقط داخل تلگرام فعال است.');
        return;
    }

    // ارسال درخواست به سرور برای دریافت لینک پرداخت (نمونه پیاده‌سازی)
    alert('در حال باز کردن درگاه پرداخت Telegram Stars...');
    // tg.openInvoice(invoiceLink, (status) => { if (status === 'paid') isVip = true; });
}

function shareReferralLink() {
    const botName = "SpicyDateBot";
    const userId = tg?.initDataUnsafe?.user?.id || "123456";
    const link = `https://t.me/${botName}?start=ref_${userId}`;
    const text = "به مینی‌اپ Spicy Date بپیوند و با افراد جدید آشنا شو! 🌶️";
    if (tg) {
        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
    } else {
        alert(`لینک دعوت شما: ${link}`);
    }
}

function toggleVoiceRecord() {
    const btnRec = document.getElementById('btn-record-voice');
    const btnDel = document.getElementById('btn-delete-voice');
    const timerDisplay = document.getElementById('voice-timer');

    if (!isRecording) {
        isRecording = true;
        recordSeconds = 0;
        btnRec.innerText = "⏹ توقف ضبط";
        btnRec.style.background = "#e74c3c";
        btnDel.style.display = "none";

        recordTimerInterval = setInterval(() => {
            recordSeconds++;
            const secStr = recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds;
            timerDisplay.innerText = `00:${secStr}`;

            if (recordSeconds >= 15) stopRecording();
        }, 1000);
    } else {
        stopRecording();
    }
}

function stopRecording() {
    clearInterval(recordTimerInterval);
    isRecording = false;

    document.getElementById('btn-record-voice').innerText = "🎤 ضبط مجدد";
    document.getElementById('btn-record-voice').style.background = "var(--accent-red)";
    document.getElementById('btn-delete-voice').style.display = "inline-block";
    document.getElementById('voice-timer').innerText = `ثبت شد (${recordSeconds} ثانیه)`;
}

function deleteVoice() {
    clearInterval(recordTimerInterval);
    isRecording = false;
    recordSeconds = 0;

    document.getElementById('btn-record-voice').innerText = "🎤 شروع ضبط";
    document.getElementById('btn-delete-voice').style.display = "none";
    document.getElementById('voice-timer').innerText = "00:00";
}

function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profile-avatar').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function playVoice(url) {
    new Audio(url).play();
}

function saveProfile() {
    const name = document.getElementById('user-display-name').value;
    if (name) document.getElementById('profile-name-display').innerText = name;
    alert('پروفایل با موفقیت به‌روزرسانی شد! ✨');
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabViews = document.querySelectorAll('.tab-view');

    navItems.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');

            navItems.forEach(btn => btn.classList.remove('active'));
            tabViews.forEach(view => view.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(`tab-${targetTab}`)?.classList.add('active');
        });
    });
}
