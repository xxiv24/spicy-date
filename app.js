const tg = window.Telegram?.WebApp;
if (tg) { tg.expand(); tg.ready(); }

const IRAN_CITIES = ["تهران", "بندرعباس", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "رشت", "کرمانشاه", "یزد", "کیش", "قشم"];

let MOCK_USERS = [
    { telegram_id: 101, name: "سارا", age: 23, city: "بندرعباس", gender: "female", intent: "دوستی و چت ☕", bio: "علاقه‌مند به دریا و کافه‌گردی 🌊", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80" },
    { telegram_id: 102, name: "آرمین", age: 26, city: "بندرعباس", gender: "male", intent: "سفر ✈️", bio: "عاشق کمپینگ و برنامه نویسی ☕", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80" }
];

let suggestedUsersQueue = [];
let dailySwipes = 0;
let isVip = false;

document.addEventListener('DOMContentLoaded', () => {
    populateCities();
    setupNavigation();
    loadSavedProfile();
    fetchSuggestedUsers();
});

// نوتیفیکیشن اختصاصی داخل برنامه
function showToast(text, icon = "✨") {
    const toast = document.getElementById('custom-toast');
    document.getElementById('toast-text').innerText = text;
    document.getElementById('toast-icon').innerText = icon;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function populateCities() {
    const filterCity = document.getElementById('filter-city');
    const userCity = document.getElementById('user-city');
    IRAN_CITIES.forEach(c => {
        filterCity.add(new Option(c, c));
        userCity.add(new Option(c, c));
    });
}

// ذخیره‌سازی ماندگار پروفایل در localStorage
function saveProfile() {
    const profileData = {
        name: document.getElementById('user-display-name').value,
        gender: document.getElementById('user-gender').value,
        city: document.getElementById('user-city').value,
        intent: document.getElementById('user-intent').value,
        bio: document.getElementById('user-bio').value,
        avatar: document.getElementById('profile-avatar').src
    };

    localStorage.setItem('spicy_user_profile', JSON.stringify(profileData));
    document.getElementById('profile-name-display').innerText = profileData.name;
    showToast("پروفایل با موفقیت ذخیره شد!", "💾");
}

function loadSavedProfile() {
    const saved = localStorage.getItem('spicy_user_profile');
    if (saved) {
        const data = JSON.parse(saved);
        document.getElementById('user-display-name').value = data.name || '';
        document.getElementById('profile-name-display').innerText = data.name || 'پروفایل من';
        document.getElementById('user-gender').value = data.gender || 'male';
        document.getElementById('user-city').value = data.city || 'بندرعباس';
        document.getElementById('user-intent').value = data.intent || '';
        document.getElementById('user-bio').value = data.bio || '';
        if (data.avatar) document.getElementById('profile-avatar').src = data.avatar;
    } else if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('user-display-name').value = user.first_name;
        document.getElementById('profile-name-display').innerText = user.first_name;
    }
}

function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profile-avatar').src = e.target.result;
            saveProfile(); // ذخیره خودکار عکس
        };
        reader.readAsDataURL(file);
    }
}

// مدال و فرآیند پرداخت Stars
function openVipModal() { document.getElementById('vip-modal').classList.add('active'); }
function closeVipModal() { document.getElementById('vip-modal').classList.remove('active'); }

async function processPayment(starsCount, days) {
    closeVipModal();
    if (!tg) {
        showToast("برای پرداخت وارد تلگرام شوید", "⚠️");
        return;
    }

    showToast("در حال اتصال به درگاه Telegram Stars...", "⏳");

    // پس از ایجاد فاکتور روی سرور، این متد فاکتور رسمی را در تلگرام باز می‌کند
    // تمامی واریزی‌ها مستقیم به بالانس ربات شما (مالک) اضافه می‌شود.
    try {
        // نمونه ارسال درگاه تلگرام
        tg.openInvoice("https://t.me/invoice/example", (status) => {
            if (status === 'paid') {
                isVip = true;
                document.getElementById('vip-status-badge').innerText = "👑 کاربر VIP";
                document.getElementById('vip-status-badge').classList.add('active');
                showToast(`پرداخت موفق! ${days} روز VIP فعال شد.`, "🎉");
            } else {
                showToast("پرداخت لغو شد یا ناموفق بود.", "❌");
            }
        });
    } catch (e) {
        showToast("خطا در ایجاد درگاه پرداخت", "❌");
    }
}

function joinChannel() {
    const channelUsername = "SpicyDateChannel"; // آیدی کانال خودت را بگذار
    if (tg) tg.openTelegramLink(`https://t.me/${channelUsername}`);
}

function shareReferralLink() {
    const botName = "SpicyDateBot";
    const userId = tg?.initDataUnsafe?.user?.id || "123456";
    const link = `https://t.me/${botName}?start=ref_${userId}`;
    const text = "به مینی‌اپ Spicy Date بپیوند! 🌶️";
    if (tg) tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
}

function fetchSuggestedUsers() {
    suggestedUsersQueue = [...MOCK_USERS];
    renderNextCard();
}

function renderNextCard() {
    const container = document.getElementById('cards-container');
    if (!suggestedUsersQueue.length) {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:#9a97b2;">پروفایل دیگری یافت نشد!</div>`;
        return;
    }
    const user = suggestedUsersQueue[0];
    container.innerHTML = `
        <div class="dating-card">
            <div class="card-media">
                <img src="${user.photo}">
                <div class="card-gradient-overlay"></div>
                <div class="card-info-content">
                    <h2>${user.name} <span class="age">${user.age}</span></h2>
                    <div><span class="city-badge">📍 ${user.city}</span></div>
                </div>
            </div>
            <div class="card-actions-bar">
                <button onclick="handlePass()" class="btn-circle btn-pass">✖</button>
                <button onclick="handleLike()" class="btn-circle btn-like-main">🔥</button>
            </div>
        </div>
    `;
}

function handleLike() { showToast("لایک ارسال شد!", "🔥"); suggestedUsersQueue.shift(); renderNextCard(); }
function handlePass() { suggestedUsersQueue.shift(); renderNextCard(); }

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
