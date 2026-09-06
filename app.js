const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

// لیست جامع مراکز استان و شهرهای مهم ایران
const IRAN_CITIES = [
    "تهران", "بندرعباس", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "قم", "اهواز", 
    "رشت", "کرمانشاه", "زاهدان", "ارومیه", "یزد", "اراک", "همدان", "قزوین", "سنندج", 
    "خرم‌آباد", "گرگان", "ساری", "بجنورد", "بوشهر", "بیرجند", "ایلام", "شهرکرد", 
    "سمنان", "زنجان", "یاسوج", "اردبیل", "کیش", "قشم", "چابهار"
];

const MOCK_USERS = [
    {
        telegram_id: 101,
        name: "سارا",
        age: 23,
        city: "بندرعباس",
        gender: "female",
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
        bio: "طراح UI/UX و شیفته هنر مدرن 🎨",
        photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
        voice: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
    }
];

let suggestedUsersQueue = [];
let matchedUsersList = [];
let isRecording = false;
let recordTimerInterval = null;
let recordSeconds = 0;
let userVoiceData = null;

document.addEventListener('DOMContentLoaded', () => {
    populateCities();
    setupNavigation();
    initApp();
});

function populateCities() {
    const filterCitySelect = document.getElementById('filter-city');
    const userCitySelect = document.getElementById('user-city');

    IRAN_CITIES.sort().forEach(city => {
        const option1 = new Option(city, city);
        const option2 = new Option(city, city);
        filterCitySelect.add(option1);
        userCitySelect.add(option2);
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

            if (recordSeconds >= 15) {
                stopRecording();
            }
        }, 1000);
    } else {
        stopRecording();
    }
}

function stopRecording() {
    clearInterval(recordTimerInterval);
    isRecording = false;

    const btnRec = document.getElementById('btn-record-voice');
    const btnDel = document.getElementById('btn-delete-voice');
    const timerDisplay = document.getElementById('voice-timer');

    btnRec.innerText = "🎤 ضبط مجدد";
    btnRec.style.background = "var(--accent-red)";
    btnDel.style.display = "inline-block";
    userVoiceData = "recorded_voice_data_placeholder";
    timerDisplay.innerText = `ثبت شد (${recordSeconds} ثانیه)`;
}

function deleteVoice() {
    clearInterval(recordTimerInterval);
    isRecording = false;
    userVoiceData = null;
    recordSeconds = 0;

    document.getElementById('btn-record-voice').innerText = "🎤 شروع ضبط";
    document.getElementById('btn-delete-voice').style.display = "none";
    document.getElementById('voice-timer').innerText = "00:00";
}

async function fetchSuggestedUsers() {
    const gender = document.getElementById('filter-gender')?.value || 'all';
    const city = document.getElementById('filter-city')?.value || 'all';

    let filtered = [...MOCK_USERS];
    if (gender !== 'all') filtered = filtered.filter(u => u.gender === gender);
    if (city !== 'all') filtered = filtered.filter(u => u.city === city);

    suggestedUsersQueue = filtered;
    renderNextCard();
}

function applyFilters() {
    fetchSuggestedUsers();
}

function renderNextCard() {
    const container = document.getElementById('cards-container');

    if (!suggestedUsersQueue || suggestedUsersQueue.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h4>پروفایل دیگری یافت نشد!</h4>
                <p>فیلتر شهر یا جنسیت را تغییر دهید.</p>
            </div>
        `;
        return;
    }

    const user = suggestedUsersQueue[0];

    container.innerHTML = `
        <div class="dating-card">
            <div class="card-media">
                <img src="${user.photo}" alt="${user.name}">
                <div class="card-gradient-overlay"></div>
                <div class="card-info-content">
                    <h2>${user.name} <span class="age">${user.age}</span></h2>
                    <span class="city-badge">📍 ${user.city}</span>
                </div>
            </div>
            <div class="card-bio">
                <p>${user.bio}</p>
                ${user.voice ? `<button onclick="playVoice('${user.voice}')" class="btn-voice">🎙️ شنیدن ویس معرفی</button>` : ''}
            </div>
            <div class="card-actions-bar">
                <button onclick="handlePass()" class="btn-circle btn-pass">✖</button>
                <button onclick="handleLike()" class="btn-circle btn-like-main">🔥</button>
            </div>
        </div>
    `;
}

function playVoice(url) {
    new Audio(url).play();
}

function handlePass() {
    suggestedUsersQueue.shift();
    renderNextCard();
}

function handleLike() {
    const currentMatched = suggestedUsersQueue[0];
    if (currentMatched && !matchedUsersList.some(u => u.telegram_id === currentMatched.telegram_id)) {
        matchedUsersList.push(currentMatched);
    }
    suggestedUsersQueue.shift();
    renderNextCard();
}

function renderMatchesAndChats() {
    const newMatchesContainer = document.getElementById('new-matches-list');
    if (!newMatchesContainer) return;

    if (matchedUsersList.length === 0) {
        newMatchesContainer.innerHTML = '<span style="font-size:11px; color:var(--text-secondary);">هنوز مچی ندارید</span>';
        return;
    }

    newMatchesContainer.innerHTML = matchedUsersList.map(user => `
        <div class="match-item-avatar" onclick="openChatWith(${user.telegram_id})">
            <img src="${user.photo}" style="width:55px; height:55px; border-radius:50%; border:2px solid var(--accent-red);" alt="${user.name}">
            <span style="font-size:11px; display:block; text-align:center; margin-top:3px;">${user.name}</span>
        </div>
    `).join('');
}

function openChatWith(telegramId) {
    const user = matchedUsersList.find(u => u.telegram_id === telegramId);
    if (!user) return;

    document.getElementById('chat-user-name').innerText = user.name;
    document.getElementById('chat-user-avatar').src = user.photo;
    document.getElementById('chat-messages').innerHTML = `<div class="chat-bubble them">سلام! خوشحالم مچ شدیم 😊</div>`;
    document.getElementById('chat-modal').classList.add('active');
}

function closeChat() {
    document.getElementById('chat-modal').classList.remove('active');
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const body = document.getElementById('chat-messages');
    body.innerHTML += `<div class="chat-bubble me">${msg}</div>`;
    input.value = '';
    body.scrollTop = body.scrollHeight;
}

function saveProfile() {
    const displayName = document.getElementById('user-display-name').value;
    if (displayName) {
        document.getElementById('profile-name-display').innerText = displayName;
    }
    alert('اطلاعات پروفایل با موفقیت ذخیره شد! ✨');
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

            if (targetTab === 'chats') renderMatchesAndChats();
        });
    });
}
