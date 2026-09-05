/**
 * Spicy Date 🌶️ - Telegram Mini App
 * Complete Integrated Application Logic
 */

// Initialize Telegram Web App API
const tg = window.Telegram?.WebApp;

// App State Management
const state = {
    profile: {
        id: tg?.initDataUnsafe?.user?.id || 12345678,
        name: tg?.initDataUnsafe?.user?.first_name || 'کاربر اسپایسی',
        isVip: false,
        voiceUrl: null
    },
    users: [
        {
            id: 1,
            name: 'سارا',
            age: 24,
            bio: 'علاقه‌مند به موزیک، سفر و چالش‌های هیجان‌انگیز! 🎧✨',
            distance: '۲ کیلومتری شما',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
            voiceUrl: null
        },
        {
            id: 2,
            name: 'آرمين',
            age: 27,
            bio: 'برنامه‌نویس، عاشق قهوه و ساخت پروژه‌های خفن ☕💻',
            distance: '۵ کیلومتری شما',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
            voiceUrl: null
        },
        {
            id: 3,
            name: 'مریم',
            age: 22,
            bio: 'هنرمند، عاشق نقاشی و پادکست‌های جنایی 🎨🎧',
            distance: '۱ کیلومتری شما',
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
            voiceUrl: null
        }
    ],
    currentIndex: 0
};

// Audio & Recording State
let mediaRecorder = null;
let audioChunks = [];
let recordTimerInterval = null;
let recordSeconds = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initTelegramApp();
    renderUI();
    initSwipeController();
    initVoiceRecorder();
    initVipCheckout();
});

/**
 * Telegram Environment Setup & Viewport Fix
 */
function initTelegramApp() {
    if (tg) {
        tg.ready();
        tg.expand();
        
        // Correct Telegram Dynamic Viewport Height Issue
        const updateHeight = () => {
            if (tg.viewportStableHeight) {
                document.body.style.height = `${tg.viewportStableHeight}px`;
            }
        };
        updateHeight();
        tg.onEvent('viewportChanged', updateHeight);

        // Header Color Match
        if (tg.setHeaderColor) {
            tg.setHeaderColor('#0f0a1c');
        }
    } else {
        document.body.style.height = '100vh';
    }
}

/**
 * Render Profile Card UI
 */
function renderUI() {
    const currentUser = state.users[state.currentIndex];
    const cardAvatar = document.getElementById('card-avatar');
    const cardNameAge = document.getElementById('card-name-age');
    const cardBio = document.getElementById('card-bio');
    const cardDistance = document.getElementById('card-distance');
    const vipStatus = document.getElementById('user-vip-status');

    if (currentUser) {
        if (cardAvatar) cardAvatar.src = currentUser.avatar;
        if (cardNameAge) cardNameAge.innerText = `${currentUser.name}، ${currentUser.age}`;
        if (cardBio) cardBio.innerText = currentUser.bio;
        if (cardDistance) cardDistance.innerText = `📍 ${currentUser.distance}`;
    } else {
        if (cardNameAge) cardNameAge.innerText = 'کاربر دیگری یافت نشد!';
        if (cardBio) cardBio.innerText = 'لطفاً بعداً دوباره تلاش کنید یا شعاع جستجو را افزایش دهید.';
    }

    if (state.profile.isVip && vipStatus) {
        vipStatus.classList.remove('hidden');
    }
}

/**
 * Swipe Controller with Optimized Touch/Mouse Event Handling
 */
function initSwipeController() {
    const card = document.getElementById('user-card');
    const btnLike = document.getElementById('btn-like');
    const btnDislike = document.getElementById('btn-dislike');
    const btnSuperlike = document.getElementById('btn-superlike');

    if (!card) return;

    const onMove = (e) => {
        if (!isDragging) return;
        const currentX = e.touches ? e.touches[0].clientX : e.clientX;
        const deltaX = currentX - startX;
        const rotate = deltaX * 0.05;
        card.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg)`;
    };

    const onEnd = (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const currentX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const deltaX = currentX - startX;

        // Detach dynamic move listeners to avoid memory leaks
        window.removeEventListener('touchmove', onMove);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('touchend', onEnd);
        window.removeEventListener('mouseup', onEnd);

        if (deltaX > 100) {
            handleSwipe('right');
        } else if (deltaX < -100) {
            handleSwipe('left');
        } else {
            card.style.transform = 'translateX(0px) rotate(0deg)';
        }
    };

    const onStart = (e) => {
        if (e.target.closest('button')) return;
        isDragging = true;
        startX = e.touches ? e.touches[0].clientX : e.clientX;
        startY = e.touches ? e.touches[0].clientY : e.clientY;

        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchend', onEnd);
        window.addEventListener('mouseup', onEnd);
    };

    card.addEventListener('touchstart', onStart, { passive: true });
    card.addEventListener('mousedown', onStart);

    btnLike?.addEventListener('click', () => handleSwipe('right'));
    btnDislike?.addEventListener('click', () => handleSwipe('left'));
    btnSuperlike?.addEventListener('click', () => handleSwipe('up'));
}

function handleSwipe(direction) {
    const card = document.getElementById('user-card');
    if (!card) return;

    if (direction === 'right') {
        card.style.transform = 'translateX(500px) rotate(30deg)';
        showToast('🔥 پسندیدی (Like)');
    } else if (direction === 'left') {
        card.style.transform = 'translateX(-500px) rotate(-30deg)';
        showToast('❌ رد کردی (Pass)');
    } else if (direction === 'up') {
        card.style.transform = 'translateY(-500px)';
        showToast('⭐ سوپرلایک شد!');
    }

    setTimeout(() => {
        state.currentIndex = (state.currentIndex + 1) % state.users.length;
        card.style.transform = 'translateX(0px) rotate(0deg)';
        renderUI();
    }, 300);
}

/**
 * Voice Recording System with Memory Cleanup
 */
function initVoiceRecorder() {
    const btnOpenRecord = document.getElementById('btn-open-record');
    const modal = document.getElementById('voice-recorder-modal');
    const btnClose = document.getElementById('btn-close-voice');
    const btnRecord = document.getElementById('btn-record-voice');
    const recordLabel = document.getElementById('record-voice-label');
    const timerDisplay = document.getElementById('voice-timer');
    const btnSave = document.getElementById('btn-save-voice');

    btnOpenRecord?.addEventListener('click', () => modal?.classList.remove('hidden'));
    btnClose?.addEventListener('click', () => {
        stopRecording();
        modal?.classList.add('hidden');
    });

    btnRecord?.addEventListener('click', async () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            stopRecording();
        } else {
            startRecording();
        }
    });

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunks = [];
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                state.profile.voiceUrl = URL.createObjectURL(audioBlob);
                btnSave?.classList.remove('hidden');
            };

            mediaRecorder.start();
            btnRecord.classList.add('recording-pulse');
            recordLabel.innerText = 'در حال ضبط... (جهت توقف کلیک کنید)';
            
            recordSeconds = 12;
            timerDisplay.innerText = `00:${recordSeconds < 10 ? '0' : ''}${recordSeconds}`;

            recordTimerInterval = setInterval(() => {
                recordSeconds--;
                timerDisplay.innerText = `00:${recordSeconds < 10 ? '0' : ''}${recordSeconds}`;
                if (recordSeconds <= 0) {
                    stopRecording();
                }
            }, 1000);

        } catch (err) {
            showToast('خطا در دسترسی به میکروفون');
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            mediaRecorder.stream.getTracks().forEach(track => track.stop());
            mediaRecorder = null; // Free up stream memory
        }
        clearInterval(recordTimerInterval);
        if (recordLabel) recordLabel.innerText = '🎙️ شروع ضبط';
        btnRecord?.classList.remove('recording-pulse');
        if (timerDisplay) timerDisplay.innerText = '00:12';
    }

    btnSave?.addEventListener('click', () => {
        showToast('ویس با موفقیت ذخیره شد! 🎙️');
        modal?.classList.add('hidden');
    });
}

/**
 * VIP Modal & Telegram Stars Native Invoice Integration
 */
function initVipCheckout() {
    const btnOpenVip = document.getElementById('btn-open-vip');
    const vipModal = document.getElementById('vip-modal');
    const btnCloseVip = document.getElementById('btn-close-vip');
    const btnConfirm = document.getElementById('btn-confirm-vip');
    const planOptions = document.querySelectorAll('.vip-card-option');

    btnOpenVip?.addEventListener('click', () => vipModal?.classList.remove('hidden'));
    btnCloseVip?.addEventListener('click', () => vipModal?.classList.add('hidden'));

    planOptions.forEach(option => {
        option.addEventListener('click', () => {
            planOptions.forEach(opt => {
                opt.classList.remove('selected', 'border-amber-500', 'bg-amber-500/10');
                opt.classList.add('border-purple-800', 'bg-purple-900/20');
            });
            option.classList.add('selected', 'border-amber-500', 'bg-amber-500/10');
            option.classList.remove('border-purple-800', 'bg-purple-900/20');
        });
    });

    btnConfirm?.addEventListener('click', async () => {
        const selectedOption = document.querySelector('.vip-card-option.selected');
        const starsCount = selectedOption?.getAttribute('data-stars') || '150';

        // Check Native Telegram Invoice API Integration
        if (tg && tg.openInvoice) {
            showToast('در حال اتصال به درگاه Telegram Stars...');
            
            // نمونه لینک Invoice که معمولاً از سمت بک‌اند تولید می‌شود
            const dummyInvoiceUrl = `https://t.me/InvoiceBot?start=stars_${starsCount}`;

            tg.openInvoice(dummyInvoiceUrl, (status) => {
                if (status === 'paid') {
                    state.profile.isVip = true;
                    renderUI();
                    vipModal?.classList.add('hidden');
                    showToast('پرداخت موفقیت‌آمیز بود! 👑 شما VIP شدید');
                } else if (status === 'cancelled') {
                    showToast('پرداخت توسط کاربر لغو شد.');
                } else {
                    showToast('خطا در انجام پرداخت.');
                }
            });
        } else {
            // حالت شبیه‌سازی (Simulation) برای مرورگرهای معمولی
            state.profile.isVip = true;
            renderUI();
            vipModal?.classList.add('hidden');
            showToast('اکانت شما به VIP ارتقا یافت (حالت تست)! 👑');
        }
    });
}

/**
 * Helper: Notification Toast System
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.innerText = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translate(-50%, 0)';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -10px)';
    }, 2500);
}
