// آدرس بک‌اند پروژه (می‌توانی از فایل env یا مقدار مستقیم استفاده کنی)
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const defaultHeaders = {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
    'ngrok-skip-browser-warning': 'true'
};

// دریافت وضعیت لایک بین دو کاربر
export async function getUserLike(from_user: string | number, to_user: string | number) {
    try {
        const res = await fetch(`${API_BASE_URL}/likes/get/${from_user}/${to_user}`, {
            method: 'GET',
            headers: defaultHeaders
        });

        if (!res.ok) {
            throw new Error('خطا در دریافت وضعیت لایک');
        }

        return await res.json();
    } catch (error) {
        console.error("API Error (getUserLike):", error);
        return { data: null };
    }
}

// ثبت لایک جدید
export async function addLike(from_user: string | number, to_user: string | number) {
    try {
        const res = await fetch(`${API_BASE_URL}/likes/add/${from_user}/${to_user}`, {
            method: 'POST',
            headers: defaultHeaders
        });

        return res.ok;
    } catch (error) {
        console.error("API Error (addLike):", error);
        return false;
    }
}

// حذف لایک
export async function removeLike(from_user: string | number, to_user: string | number) {
    try {
        const res = await fetch(`${API_BASE_URL}/likes/remove/${from_user}/${to_user}`, {
            method: 'DELETE',
            headers: defaultHeaders
        });

        return res.ok;
    } catch (error) {
        console.error("API Error (removeLike):", error);
        return false;
    }
}

// دریافت لیست کاربران پیشنهاد شده برای کارت‌ها
export async function getSuggestedUsers(telegram_id: string | number) {
    try {
        const res = await fetch(`${API_BASE_URL}/users/suggested/${telegram_id}`, {
            method: 'GET',
            headers: defaultHeaders
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("API Error (getSuggestedUsers):", error);
        return [];
    }
}
