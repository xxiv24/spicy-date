// دریافت اطلاعات کاربر فعلی از Telegram Mini App
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.ready();
    tg.expand();
}

const currentUserId = tg?.initDataUnsafe?.user?.id || "12345678";
const API_BASE_URL = window.location.origin;

// مدیریت سوئیچ بین تب‌های منوی پایینی
function switchTab(tabName) {
    const tabs = ['explore', 'night', 'chats', 'profile'];
    
    tabs.forEach(tab => {
        const section = document.getElementById(`tab-${tab}`);
        const navBtn = document.getElementById(`nav-${tab}`);
        
        if (tab === tabName) {
            section.classList.remove('hidden');
            navBtn.className = "flex flex-col items-center gap-1 text-rose-500 font-bold scale-105 transition-transform";
        } else {
            section.classList.add('hidden');
            navBtn.className = "flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors";
        }
    });
}

// دریافت و نمایش کاربران پیشنهاد شده
async function loadSuggestedUsers() {
    const container = document.getElementById('cards-container');

    try {
        const response = await fetch(`${API_BASE_URL}/likes/suggested/${currentUserId}`, {
            headers: {
                'bypass-tunnel-reminder': 'true',
                'ngrok-skip-browser-warning': 'true'
            }
        });

        if (!response.ok) throw new Error('Failed to load');

        const users = await response.json();

        if (!users || users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 bg-slate-900/50 rounded-3xl border border-slate-800 p-6">
                    <p class="text-slate-400 font-medium">کاربر جدیدی در محدوده شما پیدا نشد!</p>
                    <button onclick="loadSuggestedUsers()" class="mt-4 px-4 py-2 bg-slate-800 text-rose-400 rounded-xl text-xs font-semibold hover:bg-slate-700">
                        تلاش مجدد 🔄
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = users.map((user) => `
            <div class="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-2xl backdrop-blur-md mb-6 transition-all duration-300">
                
                <!-- تصویر کاربر -->
                <div class="relative w-full h-80 rounded-2xl overflow-hidden mb-4 bg-slate-950">
                    <img src="${user.photo || 'https://via.placeholder.com/400x500?text=Spicy+Date'}" 
                         alt="${user.name}" 
                         class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                    
                    <div class="absolute bottom-4 right-4 left-4 text-white">
                        <div class="flex items-baseline gap-2">
                            <h3 class="text-2xl font-bold">${user.name}</h3>
                            <span class="text-base text-slate-300 font-normal">${user.age || 20} ساله</span>
                        </div>
                        <p class="text-xs text-rose-400 mt-1">📍 ${user.city || 'نامشخص'}</p>
                    </div>
                </div>

                <!-- دکمه اکشن لایک -->
                <div class="flex gap-3">
                    <button id="like-btn-${user.telegram_id}" 
                            onclick="toggleLike('${user.telegram_id}')" 
                            class="flex-1 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 transition active:scale-95">
                        <span>❤️</span>
                        <span>لایک اسپایسی</span>
                    </button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading users:', error);
        renderDemoCard(container);
    }
}

// ثبت یا حذف لایک
async function toggleLike(toUserId) {
    const btn = document.getElementById(`like-btn-${toUserId}`);
    const isLiked = btn.classList.contains('bg-rose-800');

    const endpoint = isLiked 
        ? `${API_BASE_URL}/likes/remove/${currentUserId}/${toUserId}`
        : `${API_BASE_URL}/likes/add/${currentUserId}/${toUserId}`;

    try {
        if (!isLiked) {
            btn.className = "flex-1 py-3 bg-rose-800 text-slate-300 font-bold rounded-2xl flex items-center justify-center gap-2";
            btn.innerHTML = "<span>💖</span><span>لایک شد</span>";
        } else {
            btn.className = "flex-1 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2";
            btn.innerHTML = "<span>❤️</span><span>لایک اسپایسی</span>";
        }

        await fetch(endpoint, { method: isLiked ? 'DELETE' : 'POST' });
    } catch (err) {
        console.error('Error toggling like:', err);
    }
}

// کارت نمونه دمو جهت جایگزین موقع قطعی دیتابیس
function renderDemoCard(container) {
    container.innerHTML = `
        <div class="relative bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl mb-6">
            <div class="relative w-full h-80 rounded-2xl overflow-hidden mb-4 bg-slate-950">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500" class="w-full h-full object-cover" />
                <div class="absolute bottom-4 right-4 text-white">
                    <h3 class="text-2xl font-bold">سارا <span class="text-base text-slate-300 font-normal">۲۳ ساله</span></h3>
                    <p class="text-xs text-rose-400 mt-1">📍 بندرعباس</p>
                </div>
            </div>
            <button onclick="alert('لایک ثبت شد!')" class="w-full py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2">
                <span>❤️</span> <span>لایک اسپایسی</span>
            </button>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', loadSuggestedUsers);
