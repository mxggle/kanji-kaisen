"use client";

import { useState } from 'react';
import Link from 'next/link';
import { getCategorySlug } from '@/lib/checkpoints';
import { Checkpoint } from '@/lib/checkpoints';
import {
    TreeDeciduous, Users, Footprints, Home, Bird,
    Sword, MessageCircle, Wheat, Activity, Clock, Box, BookOpen
} from 'lucide-react';
import { CategoryStoryModal } from '@/components/Story/CategoryStoryModal';

interface CategoryCardProps {
    title: string;
    checkpoints: Checkpoint[];
    completedCount: number;
}

const THEME_STYLES: Record<string, { bg: string, border: string, title: string, icon: any, elements: string[], radicals: string[] }> = {
    "Nature & Elements": {
        bg: "bg-emerald-950/40 hover:bg-emerald-950/60",
        border: "border-emerald-800/50",
        title: "text-emerald-400",
        icon: TreeDeciduous,
        elements: ["木", "山", "川", "火", "土"],
        radicals: ["木", "氵", "火", "土", "山"]
    },
    "Human Body & People": {
        bg: "bg-blue-950/40 hover:bg-blue-950/60",
        border: "border-blue-800/50",
        title: "text-blue-400",
        icon: Users,
        elements: ["人", "女", "目", "手", "足"],
        radicals: ["亻", "女", "目", "扌", "⻊"]
    },
    "Action & Movement": {
        bg: "bg-red-950/40 hover:bg-red-950/60",
        border: "border-red-800/50",
        title: "text-red-400",
        icon: Footprints,
        elements: ["走", "行", "止", "来", "去"],
        radicals: ["止", "癶", "彳", "辶", "走"]
    },
    "Structures & Home": {
        bg: "bg-stone-950/40 hover:bg-stone-950/60",
        border: "border-stone-800/50",
        title: "text-stone-400",
        icon: Home,
        elements: ["家", "門", "戶", "屋", "室"],
        radicals: ["宀", "广", "門", "戶", "囗"]
    },
    "Animals & Wildlife": {
        bg: "bg-amber-950/40 hover:bg-amber-950/60",
        border: "border-amber-800/50",
        title: "text-amber-400",
        icon: Bird,
        elements: ["鳥", "魚", "虫", "犬", "鹿"],
        radicals: ["鳥", "魚", "虫", "犭", "鹿"]
    },
    "Tools & Weapons": {
        bg: "bg-slate-950/40 hover:bg-slate-950/60",
        border: "border-slate-800/50",
        title: "text-slate-400",
        icon: Sword,
        elements: ["刀", "弓", "矛", "斤", "矢"],
        radicals: ["刀", "弓", "矛", "斤", "矢"]
    },
    "Communication & Thought": {
        bg: "bg-purple-950/40 hover:bg-purple-950/60",
        border: "border-purple-800/50",
        title: "text-purple-400",
        icon: MessageCircle,
        elements: ["言", "語", "心", "意", "知"],
        radicals: ["言", "心", "讠", "忄"]
    },
    "Textiles, Plants & Food": {
        bg: "bg-lime-950/40 hover:bg-lime-950/60",
        border: "border-lime-800/50",
        title: "text-lime-400",
        icon: Wheat,
        elements: ["糸", "草", "食", "禾", "米"],
        radicals: ["糸", "艹", "飠", "禾", "米"]
    },
    "States & Attributes": {
        bg: "bg-pink-950/40 hover:bg-pink-950/60",
        border: "border-pink-800/50",
        title: "text-pink-400",
        icon: Activity,
        elements: ["長", "大", "高", "色", "形"],
        radicals: ["長", "大", "赤", "青"]
    },
    "Time & Sequence": {
        bg: "bg-indigo-950/40 hover:bg-indigo-950/60",
        border: "border-indigo-800/50",
        title: "text-indigo-400",
        icon: Clock,
        elements: ["日", "月", "时", "午", "夕"],
        radicals: ["日", "月", "夕"]
    },
    "Others": {
        bg: "bg-zinc-900/40 hover:bg-zinc-900/60",
        border: "border-zinc-800/50",
        title: "text-zinc-400",
        icon: Box,
        elements: ["乙", "亅", "二", "八", "十"],
        radicals: ["乙", "亅", "二", "八", "十"]
    },
};

export function CategoryCard({ title, checkpoints, completedCount }: CategoryCardProps) {
    const [showStory, setShowStory] = useState(false);
    const theme = THEME_STYLES[title] || THEME_STYLES["Others"];
    const Icon = theme.icon;
    const slug = getCategorySlug(title);
    const total = checkpoints.length;
    const progress = Math.round((completedCount / total) * 100) || 0;
    const themeClass = `${theme.title} ${theme.border} ${theme.bg.split(' ')[0]}`;

    const handleInfoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowStory(true);
    };

    return (
        <>
            <Link href={`/category/${slug}`} className="block h-full">
                <div className={`
                h-full flex flex-col p-6 rounded-3xl border transition-all duration-500
                ${theme.bg} ${theme.border} backdrop-blur-md group
                hover:scale-[1.02] active:scale-[0.98]
                relative overflow-hidden shadow-lg hover:shadow-2xl
            `}>
                    {/* Background Image Layer */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-overlay">
                        <img
                            src={`/images/categories/${slug}.png`}
                            alt=""
                            className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-700 scale-105 group-hover:scale-100 transition-transform duration-1000"
                        />
                    </div>

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80" />

                    {/* Decorative Background Elements - Made more visible but clean */}
                    <div className="absolute inset-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-500 overflow-hidden">
                        {/* Large central character */}
                        <div className={`absolute -right-4 -bottom-12 text-[10rem] font-bold select-none ${theme.title} transform -rotate-12 opacity-50`}>
                            {theme.elements[0]}
                        </div>

                        {/* Subtle floating radicals - Reduced count for "not messy" look
                        Only showing a few carefully placed ones 
                    */}
                        {theme.radicals.slice(0, 3).map((radical, i) => (
                            <div
                                key={i}
                                className={`absolute text-4xl font-bold ${theme.title} opacity-60`}
                                style={{
                                    top: `${15 + (i * 30)}%`,
                                    left: `${10 + (i * 60)}%`,
                                    transform: `rotate(${(i * 20)}deg)`,
                                }}
                            >
                                {radical}
                            </div>
                        ))}
                    </div>

                    {/* Foreground Content */}
                    <div className="relative z-10 flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl bg-white/10 ${theme.title} backdrop-blur-md shadow-inner border border-white/5`}>
                                <Icon size={24} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleInfoClick}
                                className={`
                                p-3 rounded-xl bg-white/10 hover:bg-white/20
                                ${theme.title} transition-all duration-200
                                opacity-60 group-hover:opacity-100
                                hover:scale-110 active:scale-95
                            `}
                                title="Learn about this category"
                            >
                                <BookOpen size={24} />
                            </button>
                            <span className="text-2xl font-bold opacity-60 group-hover:opacity-100 transition-opacity text-white">
                                {progress}%
                            </span>
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto transform translate-y-0 transition-transform duration-300">
                        <h3 className={`text-2xl font-bold mb-2 ${theme.title} tracking-wide drop-shadow-lg`}>
                            {title}
                        </h3>

                        <div className="flex items-center justify-between text-white/60 text-sm mb-3">
                            <span>{completedCount} / {total} Radicals</span>
                        </div>

                        {/* Modern Progress Bar */}
                        <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.3)] ${theme.title.replace('text-', 'bg-')}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </Link>

            {/* Story Modal */}
            {showStory && (
                <CategoryStoryModal
                    category={title}
                    onClose={() => setShowStory(false)}
                    themeClass={themeClass}
                />
            )}
        </>
    );
}
