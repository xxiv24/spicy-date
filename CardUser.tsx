'use client'
import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface UserProps {
    user: {
        telegram_id: string;
        name: string;
        age: number;
        city: string;
        photo: string;
        username?: string;
    };
    param: { users: string };
    index: number;
}

export const CardUser = ({ user, param, index }: UserProps) => {
    return (
        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="w-full max-w-sm mx-auto mb-4"
        >
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
                {/* Header Info */}
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-lg font-bold text-white">{user.name}</h3>
                        <span className="text-sm font-medium text-slate-400">{user.age} ساله</span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-rose-400 rounded-full border border-rose-500/20">
                        {user.city}
                    </span>
                </div>

                {/* Profile Image */}
                <div className="relative w-full h-80 rounded-xl overflow-hidden mb-4 bg-slate-950">
                    <img
                        src={user.photo || "/placeholder.png"}
                        alt={user.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                </div>

                {/* Action Button */}
                <Link
                    href={`/users/${param.users}/${user.telegram_id}`}
                    className="block w-full text-center py-2.5 px-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-semibold rounded-xl transition shadow-lg shadow-rose-950/40"
                >
                    مشاهده پروفایل
                </Link>
            </div>
        </motion.div>
    );
};
