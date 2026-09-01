// ==========================================
// Spicy Date 🌶️ - Fixed Logic
// ==========================================

const STORAGE_KEY = 'spicy_user_profile_data_v4';

const IRAN_CITIES = [
    "تهران", "مشهد", "اصفهان", "کرج", "شیراز", "تبریز", "قم", "اهواز", 
    "کرمانشاه", "ارومیه", "رشت", "زاهدان", "همدان", "کرمان", "یزد", "بندرعباس"
];

const ALL_INTERESTS = [
    "☕ کافه‌گردی", "🎮 گیمینگ", "🎧 موسیقی", "✈️ سفر", 
    "🏋️ ورزش", "📸 عکاسی", "🍕 آشپزی", "🎬 فیلم و سریال"
];

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
        interests: ["🎧 موسیقی", "🎮 گیمینگ", "☕ کافه‌گردی"]
    };

    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
}

let profile = loadProfile();
let tempInterests = [...profile.interests];

function saveProfile() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function renderUI() {
    // پروفایل
    document.getElementById('profile-img').src = profile.image;
    document.getElementById('profile-name-age').innerText = `${profile.name}، ${profile.age}`;
    document.getElementById('profile-city').innerText = `📍 ${profile.city}`;
    document.getElementById('profile-gender').innerText = `| ${profile.gender === 'مرد' ? '♂️ مرد' : '♀️ زن'}`;
    document.getElementById('profile-bio').innerText = profile.bio || "بدون بیوگرافی";
    
    document.getElementById('profile-interests').innerHTML = profile.interests.map(t => 
        `<span class="text-[9px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">${t}</span>`
    ).join('');

    // اکسپلور
    document.getElementById('card-img').src = profile.image;
    document.getElementById('card-name-age').innerText = `${profile.name}، ${profile.age}`;
    document.getElementById('card-location').innerText = `📍 ${profile.city} | ${profile.gender === 'مرد' ? '♂️ مرد' : '♀️ زن'}`;
    document.getElementById('card-interests').innerHTML = profile.interests.map(t => 
        `<span class="text-[9px] bg-white/10 px-2 py-0.5 rounded-full">${t}</span>`
    ).join('');
}

// سوئیچ دقیق بین تب‌ها
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

document.addEventListener('DOMContentLoaded', () => {
    renderUI();

    // هندل کردن کلیک تب‌ها
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    document.getElementById('btn-back-header')?.addEventListener('click', () => switchTab('explore'));

    // آپلود عکس پروفایل
    document.getElementById('direct-avatar-upload')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                profile.image = event.target.result;
                saveProfile();
                renderUI();
                showToast('تصویر با موفقیت بروز شد 📸');
            };
            reader.readAsDataURL(file);
        }
    });

    // ویرایش پروفایل
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

        saveProfile();
        renderUI();
        document.getElementById('edit-profile-modal').classList.add('hidden');
        showToast('تغییرات ذخیره شد ✨');
    });
});
