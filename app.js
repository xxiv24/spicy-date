const tg = window.Telegram?.WebApp;

if (tg) {
    tg.ready();
    tg.expand();
}

const IRAN_CITIES = [
    "تهران", "بندرعباس", "مشهد", "اصفهان", "شیراز", "تبریز", "کرج", "قم", "اهواز", 
    "رشت", "کرمانشاه", "زاهدان", "ارومیه", "یزد", "اراک", "همدان", "قزوین", "سنندج"
];

document.addEventListener('DOMContentLoaded', () => {
    populateCities();
    loadSavedProfile();
});

function showToast(text, icon = "✨") {
    const toast = document.getElementById('custom-toast');
    document.getElementById('toast-text').innerText = text;
    document.getElementById('toast-icon').innerText = icon;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function populateCities() {
    const userCitySelect = document.getElementById('user-city');
    if (!userCitySelect) return;
    
    userCitySelect.innerHTML = '';
    IRAN_CITIES.sort().forEach(city => {
        userCitySelect.add(new Option(city, city));
    });
}

function loadSavedProfile() {
    const saved = localStorage.getItem('spicy_user_profile');
    if (saved) {
        const data = JSON.parse(saved);
        if (data.name) document.getElementById('user-display-name').value = data.name;
        if (data.age) document.getElementById('user-age').value = data.age;
        if (data.name) document.getElementById('profile-name-display').innerText = data.name;
        if (data.gender) document.getElementById('user-gender').value = data.gender;
        if (data.city) document.getElementById('user-city').value = data.city;
        if (data.intent) document.getElementById('user-intent').value = data.intent;
        if (data.bio) document.getElementById('user-bio').value = data.bio;
        document.getElementById('user-incognito').checked = !!data.incognito;
        if (data.avatar) {
            document.getElementById('profile-avatar').src = data.avatar;
        }
    }
}

// تابع مستقیم برای ذخیره اطلاعات پروفایل بدون تداخل فرم
function saveProfileDirect() {
    const nameInput = document.getElementById('user-display-name').value;
    const ageInput = document.getElementById('user-age').value;
    const genderInput = document.getElementById('user-gender').value;
    const cityInput = document.getElementById('user-city').value;
    const intentInput = document.getElementById('user-intent').value;
    const bioInput = document.getElementById('user-bio').value;
    const incognitoInput = document.getElementById('user-incognito').checked;
    const avatarInput = document.getElementById('profile-avatar').src;

    const profileData = {
        name: nameInput,
        age: ageInput,
        gender: genderInput,
        city: cityInput,
        intent: intentInput,
        bio: bioInput,
        incognito: incognitoInput,
        avatar: avatarInput
    };

    localStorage.setItem('spicy_user_profile', JSON.stringify(profileData));
    
    if (nameInput) {
        document.getElementById('profile-name-display').innerText = nameInput;
    }

    // ارسال لرزش لمسی تلگرام (Haptic Feedback) در صورت پشتیبانی
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
    }

    showToast("اطلاعات پروفایل با موفقیت ذخیره شد!", "✅");
}

function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('profile-avatar').src = e.target.result;
            saveProfileDirect();
        };
        reader.readAsDataURL(file);
    }
}

function shareReferralLink() {
    if (tg) tg.openTelegramLink("https://t.me/share/url?url=https://t.me/SpicyDateBot");
}

function joinChannel() {
    if (tg) tg.openTelegramLink("https://t.me/SpicyDateChannel");
}
