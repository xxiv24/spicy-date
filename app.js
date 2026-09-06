const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

const currentUser = tg?.initDataUnsafe?.user || { id: 12345678, first_name: "کاربر مهمان", username: "guest" };
const API_BASE_URL = window.location.origin;

// لیست جامع شهرهای ایران
const IRAN_CITIES = [
    "بندرعباس", "تهران", "شیراز", "اصفهان", "مشهد", "تبریز", "کرج", "اهواز", 
    "رشت", "کرمان", "کرمانشاه", "ارومیه", "یزد", "بوشهر", "همدان", "زاهدان", 
    "قزوین", "ساری", "گرگان", "کیش", "قشم", "چابهار"
];

// لرزش لمسی تلگرام
function triggerHaptic(type = 'light') {
    if (tg?.HapticFeedback) {
        if (type === 'success') tg.HapticFeedback.notificationOccurred('success');
        else tg.HapticFeedback.impactOccurred(type);
    }
}

// مدیریت تب‌ها
function switchTab(tabName) {
    const tabs = ['explore', 'favorites', 'chats', 'profile'];
    
    tabs.forEach(tab => {
        const section = document.getElementById(`tab-${tab}`);
        const navBtn = document.getElementById(`nav-${tab}`);
        
        if (tab === tabName) {
            section?.classList.remove('hidden');
            if (navBtn) navBtn.className = "flex flex-col items-center gap-1 text-rose-500 font-bold scale-105 transition-transform";
        } else {
            section?.classList.add('hidden');
            if (navBtn) navBtn.className = "flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors";
        }
    });

    if (tabName === 'profile') loadUserProfile();
    if (tabName === 'favorites') loadFavorites();
}

// دریافت و نمایش کاربران پیشنهاد شده با فیلتر
async function loadSuggestedUsers() {
    const container = document.getElementById('cards-container');
    const genderFilter = document.getElementById('filter-gender')?.value || 'all';
    const cityFilter = document.getElementById('filter-city')?.value || 'all';

    try {
        const res = await fetch(`${API_BASE_URL}/likes/suggested/${currentUser.id}?gender=${genderFilter}&city=${cityFilter}`);
        const users = await res.json();

        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-10 bg-slate-900/60 rounded-3xl border border-slate-800 p-6">
                    <p class="text-slate-400 font-medium text-sm">کاربری یافت نشد!</p>
                </div>
            `;
            return;
        }

        const user = users[0];
        const cityOptions = IRAN_CITIES.map(c => `<option value="${c}" ${cityFilter === c ? 'selected' : ''}>${c}</option>`).join('');

        container.innerHTML = `
            <div class="flex gap-2 mb-4 bg-slate-900/80 p-2 rounded-2xl border border-slate-800 text-xs">
                <select id="filter-gender" onchange="loadSuggestedUsers()" class="bg-slate-950 text-slate-300 p-2 rounded-xl flex-1 outline-none border border-slate-800">
                    <option value="all">همه جنسیت‌ها</option>
                    <option value="female" ${genderFilter === 'female' ? 'selected' : ''}>فقط دختران 👩</option>
                    <option value="male" ${genderFilter === 'male' ? 'selected' : ''}>فقط پسران 👨</option>
                </select>
                <select id="filter-city" onchange="loadSuggestedUsers()" class="bg-slate-950 text-slate-300 p-2 rounded-xl flex-1 outline-none border border-slate-800">
                    <option value="all">همه شهرها</option>
                    ${cityOptions}
                </select>
            </div>

            <div class="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-2xl backdrop-blur-md">
                <div class="relative w-full h-80 rounded-2xl overflow-hidden mb-3 bg-slate-950">
                    <img src="${user.photo || 'https://via.placeholder.com/400x500'}" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                    <div class="absolute bottom-4 right-4 left-4 text-white">
                        <div class="flex items-baseline gap-2">
                            <h3 class="text-2xl font-bold">${user.name}</h3>
                            <span class="text-base text-slate-300 font-normal">${user.age || 20} ساله</span>
                        </div>
                        <p class="text-xs text-rose-400 mt-1">📍 ${user.city || 'بندرعباس'} • ${user.gender === 'female' ? 'دختر 👧' : 'پسر 👦'}</p>
                    </div>
                </div>

                <!-- بخش درباره من -->
                <div class="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 mb-4">
                    <p class="text-xs text-slate-300 leading-relaxed">💬 ${user.bio || 'هنوز بیوگرافی ثبت نکرده است.'}</p>
                </div>

                <div class="flex gap-3">
                    <button onclick="triggerHaptic('medium'); loadSuggestedUsers();" class="w-1/3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl flex items-center justify-center">
                        ✖️ رد
                    </button>
                    <button onclick="toggleLike('${user.telegram_id}')" class="w-2/3 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                        ❤️ لایک اسپایسی
                    </button>
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
    }
}

// ثبت لایک
async function toggleLike(toUserId) {
    triggerHaptic('success');
    await fetch(`${API_BASE_URL}/likes/add/${currentUser.id}/${toUserId}`, { method: 'POST' });
    loadSuggestedUsers();
}

// دریافت و لود اطلاعات واقعی کاربر از دیتابیس
async function loadUserProfile() {
    const profileSection = document.getElementById('tab-profile');
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/user/${currentUser.id}`);
        const dbUser = await res.json();

        const cityOptions = IRAN_CITIES.map(c => `<option value="${c}" ${dbUser.city === c ? 'selected' : ''}>${c}</option>`).join('');

        profileSection.innerHTML = `
            <div class="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div class="w-20 h-20 bg-rose-500/20 border-2 border-rose-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl overflow-hidden">
                    ${currentUser.photo_url ? `<img src="${currentUser.photo_url}" class="w-full h-full object-cover"/>` : '👤'}
                </div>
                <h2 class="text-xl font-bold text-center text-white">${currentUser.first_name}</h2>
                <p class="text-xs text-center text-rose-400 mt-1 mb-4">@${currentUser.username || 'بدون آیدی'}</p>

                <!-- بنر اکانت VIP -->
                <div class="bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 text-center">
                    <h3 class="text-sm font-bold text-amber-400 mb-1">👑 اشتراک ویژه (VIP)</h3>
                    <p class="text-[11px] text-slate-300 mb-3">${dbUser.isVip ? 'حساب شما ویژه است!' : 'دیدن کسانی که شما را لایک کرده‌اند + لایک نامحدود'}</p>
                    ${!dbUser.isVip ? `<button onclick="activateVip()" class="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black rounded-xl text-xs shadow-lg">ارتقا به VIP (اشتراک)</button>` : ''}
                </div>

                <!-- فرم ویرایش اطلاعات -->
                <div class="space-y-4 text-right border-t border-slate-800 pt-4">
                    <h3 class="text-xs font-bold text-slate-400">ویرایش اطلاعات شخصی:</h3>
                    
                    <div>
                        <label class="text-xs text-slate-300 block mb-1">جنسیت شما:</label>
                        <select id="edit-gender" class="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 text-xs">
                            <option value="male" ${dbUser.gender === 'male' ? 'selected' : ''}>پسر 👦</option>
                            <option value="female" ${dbUser.gender === 'female' ? 'selected' : ''}>دختر 👧</option>
                        </select>
                    </div>

                    <div>
                        <label class="text-xs text-slate-300 block mb-1">شهر شما:</label>
                        <select id="edit-city" class="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 text-xs">
                            ${cityOptions}
                        </select>
                    </div>

                    <div>
                        <label class="text-xs text-slate-300 block mb-1">درباره من (بیوگرافی):</label>
                        <textarea id="edit-bio" rows="3" class="w-full bg-slate-950 text-slate-200 p-2.5 rounded-xl border border-slate-800 text-xs focus:outline-none focus:border-rose-500" placeholder="چیزی درباره خودت بنویس...">${dbUser.bio || ''}</textarea>
                    </div>

                    <button onclick="saveUserProfile()" class="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition">
                        ذخیره تغییرات دائم 💾
                    </button>
                </div>
            </div>
        `;
    } catch (err) {
        console.error(err);
    }
}

// ذخیره دائمی پروفایل در MongoDB
async function saveUserProfile() {
    triggerHaptic('success');
    const gender = document.getElementById('edit-gender').value;
    const city = document.getElementById('edit-city').value;
    const bio = document.getElementById('edit-bio').value;

    await fetch(`${API_BASE_URL}/api/user/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: currentUser.id, gender, city, bio })
    });

    tg.showAlert('اطلاعات شما با موفقیت ذخیره شد!');
}

// فعال‌سازی آزمایشی VIP
async function activateVip() {
    triggerHaptic('success');
    await fetch(`${API_BASE_URL}/api/user/vip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: currentUser.id })
    });
    tg.showAlert('اشتراک VIP شما فعال شد! 👑');
    loadUserProfile();
}

// لود تب علاقه‌مندی‌ها
async function loadFavorites() {
    const container = document.getElementById('favorites-container');
    try {
        const res = await fetch(`${API_BASE_URL}/likes/favorites/${currentUser.id}`);
        const list = await res.json();

        if (!list || list.length === 0) {
            container.innerHTML = '<p class="text-xs text-slate-500 text-center py-8">لیست علاقه‌مندی‌های شما خالی است.</p>';
            return;
        }

        container.innerHTML = list.map(item => `
            <div class="flex items-center justify-between bg-slate-900 border border-slate-800 p-3 rounded-2xl">
                <div class="flex items-center gap-3">
                    <img src="${item.photo || 'https://via.placeholder.com/100'}" class="w-12 h-12 rounded-full object-cover" />
                    <div>
                        <h4 class="text-sm font-bold text-white">${item.name}</h4>
                        <p class="text-[10px] text-slate-400">📍 ${item.city}</p>
                    </div>
                </div>
                <button onclick="tg.openTelegramLink('https://t.me/${item.username}')" class="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold">
                    چت 💬
                </button>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
    }
}

document.addEventListener('DOMContentLoaded', loadSuggestedUsers);
