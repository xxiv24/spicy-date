'use client'
import React, { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";

interface LikeButtonProps {
    from_user_id: string;
    to_user_id: string;
    backendUrl: string;
}

export const LikeButton = ({ from_user_id, to_user_id, backendUrl }: LikeButtonProps) => {
    const [liked, setLiked] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLikeStatus = async () => {
            try {
                const res = await fetch(`${backendUrl}/likes/check/${from_user_id}/${to_user_id}`);
                const data = await res.json();
                setLiked(!!data?.is_liked);
            } catch (error) {
                console.error("خطا در دریافت وضعیت لایک:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLikeStatus();
    }, [from_user_id, to_user_id, backendUrl]);

    const handleLikeClick = async () => {
        const nextState = !liked;
        setLiked(nextState);

        const endpoint = nextState
            ? `${backendUrl}/likes/add/${from_user_id}/${to_user_id}`
            : `${backendUrl}/likes/remove/${from_user_id}/${to_user_id}`;

        try {
            await fetch(endpoint, {
                method: nextState ? 'POST' : 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            console.error("خطا در ارسال لایک:", error);
            setLiked(!nextState); // بازگرداندن وضعیت در صورت خطا
        }
    };

    if (loading) {
        return (
            <div className="p-2.5 rounded-full bg-slate-800/80 border border-slate-700">
                <Loader2 className="w-5 h-5 text-rose-500 animate-spin" />
            </div>
        );
    }

    return (
        <button
            onClick={handleLikeClick}
            className={`p-3 rounded-full transition-all duration-200 shadow-lg ${
                liked
                    ? "bg-rose-600 text-white shadow-rose-900/50 scale-105"
                    : "bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-700"
            }`}
        >
            <Heart className={`w-5 h-5 ${liked ? "fill-current" : ""}`} />
        </button>
    );
};
