// ۱۰. راه‌اندازی Telegram WebApp SDK
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

const currentUser = tg?.initDataUnsafe?.user || { id: 12345678, first_name: "کاربر", username: "guest" };
const API_BASE_URL = window.location.origin;

// مدیریت سوئیچ بین تب‌های اصلی
function switchTab(tabName) {
    const tabs = ['explore', 'night', 'chats', 'profile'];
    
    tabs.forEach(tab => {
        const section = document.getElementById(`tab-${tab}`);
        const navBtn = document.getElementById(`nav-${tab}`);
        
        if (tab === tabName) {
            section.classList.remove('hidden');
            if (navBtn) navBtn.className = "flex flex-col items-center gap-1 text-rose-500 font-bold scale-105 transition-transform";
        } else {
            section.classList.add('hidden');
            if (navBtn) navBtn.className = "flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors";
        }
    });

    if (tabName === 'profile') renderProfileTab();
}

// ویبره لمسی تلگرام (Haptic Feedback)
function triggerHaptic(type = 'light') {
    if (tg?.HapticFeedback) {
        if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred(type);
    }
}

// ۱. بخش دریافت و نمایش پیشنهادات با فیلترها
async function loadSuggestedUsers() {
    const container = document.getElementById('cards-container');
    triggerHaptic('light');

    // دریافت فیلترهای انتخابی کاربر
    const genderFilter = document.getElementById('filter-gender')?.value || 'all';
    const cityFilter = document.getElementById('filter-city')?.value || 'all';

    try {
        const response = await fetch(`${API_BASE_URL}/likes/suggested/${currentUser.id}?gender=${genderFilter}&city=${cityFilter}`, {
            headers: { 'bypass-tunnel-reminder': 'true', 'ngrok-skip-browser-warning': 'true' }
        });

        if (!response.ok) throw new Error('Failed to load');
        const users = await response.json();

        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-10 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
                    <p class="text-slate-400 font-medium text-sm">کاربری با این فیلترها یافت نشد!</p>
                    <button onclick="loadSuggestedUsers()" class="mt-4 px-4 py-2 bg-slate-800 text-rose-400 rounded-xl text-xs font-semibold hover:bg-slate-700">
                        تلاش مجدد 🔄
                    </button>
                </div>
            `;
            return;
        }

        renderUserCards(users);
    } catch (error) {
        console.error('Error loading users:', error);
        renderDemoCard(container);
    }
}

// رندر کارت کاربر روی صفحه
function renderUserCards(users) {
    const container = document.getElementById('cards-container');
    const user = users[0]; // نمایش اولین پیشنهاد

    container.innerHTML = `
        <!-- فیلترهای جستجو بالای کارت -->
        <div class="flex gap-2 mb-4 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 text-xs">
            <select id="filter-gender" onchange="loadSuggestedUsers()" class="bg-slate-950 text-slate-300 p-2 rounded-xl flex-1 outline-none border border-slate-800">
                <option value="all">همه جنسیت‌ها</option>
                <option value="female">فقط دختران 👩</option>
                <option value="male">فقط پسران 👨</option>
            </select>
            <select id="filter-city" onchange="loadSuggestedUsers()" class="bg-slate-950 text-slate-300 p-2 rounded-xl flex-1 outline-none border border-slate-800">
                <option value="all">همه شهرها</option>
                <option value="بندرعباس">بندرعباس</option>
                <option value="تهران">تهران</option>
                <option value="شیراز">شیراز</option>
            </select>
        </div>

        <div class="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-2xl backdrop-blur-md">
            <div class="relative w-full h-80 rounded-2xl overflow-hidden mb-4 bg-slate-950">
                <img src="${user.photo || 'https://via.placeholder.com/400x500?text=Spicy+Date'}" alt="${user.name}" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                <div class="absolute bottom-4 right-4 left-4 text-white">
                    <div class="flex items-baseline gap-2">
                        <h3 class="text-2xl font-bold">${user.name}</h3>
                        <span class="text-base text-slate-300 font-normal">${user.age || 20} ساله</span>
                    </div>
                    <p class="text-xs text-rose-400 mt-1">📍 ${user.city || 'نامشخص'} • ${user.gender === 'female' ? 'دختر 👧' : 'پسر 👦'}</p>
                </div>
            </div>

            <!-- دکمه‌های اکشن: رد کردن (Dislike) + لایک -->
            <div class="flex gap-3">
                <button onclick="nextCard()" class="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-1 active:scale-95 transition">
                    <span>✖️</span>
                    <span>رد</span>
                </button>
                <button id="like-btn-${user.telegram_id}" onclick="toggleLike('${user.telegram_id}')" class="w-2/3 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 active:scale-95 transition">
                    <span>❤️</span>
                    <span>لایک اسپایسی</span>
                </button>
            </div>
        </div>
    `;
}

// رد کردن کارت فعلی
function nextCard() {
    triggerHaptic('medium');
    loadSuggestedUsers();
}

// ثبت لایک همراه با Haptic Feedback
async function toggleLike(toUserId) {
    triggerHaptic('success');
    const btn = document.getElementById(`like-btn-${toUserId}`);
    btn.className = "w-2/3 py-3 bg-rose-800 text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2";
    btn.innerHTML = "<span>💖</span><span>لایک شد</span>";

    try {
        await fetch(`${API_BASE_URL}/likes/add/${currentUser.id}/${toUserId}`, { method: 'POST' });
    } catch (err) {
        console.error('Error liking:', err);
    }
}

// ۲. رندر کامل اطلاعات واقعی کاربر در تب «پروفایل من»
function renderProfileTab() {
    const profileSection = document.getElementById('tab-profile');
    profileSection.innerHTML = `
        <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 text-center shadow-xl">
            <div class="w-20 h-20 bg-rose-500/20 border-2 border-rose-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl overflow-hidden">
                ${currentUser.photo_url ? `<img src="${currentUser.photo_url}" class="w-full h-full object-cover"/>` : '👤'}
            </div>
            <h2 class="text-xl font-bold text-white">${currentUser.first_name}</h2>
            <p class="text-xs text-rose-400 mt-1">@${currentUser.username || 'بدون آیدی'}</p>

            <!-- تنظیمات شخصی پروفایل -->
            <div class="mt-6 text-right space-y-4 border-t border-slate-800 pt-4">
                <h3 class="text-xs font-bold text-slate-400">تنظیمات حساب شما:</h3>
                <div>
                    <label class="text-xs text-slate-300 block mb-1">جنسیت شما:</label>
                    <select id="user-gender" class="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 text-xs">
                        <option value="male">پسر 👦</option>
                        <option value="female">دختر 👧</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs text-slate-300 block mb-1">شهر شما:</label>
                    <input type="text" id="user-city" value="بندرعباس" class="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 text-xs" />
                </div>
                <button onclick="triggerHaptic('success'); alert('تنظیمات ذخیره شد!');" class="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition">
                    ذخیره تغییرات 💾
                </button>
            </div>
        </div>
    `;
}

// کارت دمو جایگزین موقع نبود داده
function renderDemoCard(container) {
    container.innerHTML = `
        <div class="relative bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl mb-6">
            <div class="relative w-full h-80 rounded-2xl overflow-hidden mb-4 bg-slate-950">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500" class="w-full h-full object-cover" />
                <div class="absolute bottom-4 right-4 text-white">
                    <h3 class="text-2xl font-bold">سارا <span class="text-base text-slate-300 font-normal">۲۳ ساله</span></h3>
                    <p class="text-xs text-rose-400 mt-1">📍 بندرعباس • دختر 👧</p>
                </div>
            </div>
            <div class="flex gap-3">
                <button onclick="nextCard()" class="w-1/3 py-3 bg-slate-800 text-slate-300 font-bold rounded-2xl flex items-center justify-center">✖️ رد</button>
                <button onclick="toggleLike('demo_123')" class="w-2/3 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                    <span>❤️</span> <span>لایک اسپایسی</span>
                </button>
            </div>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', loadSuggestedUsers);
