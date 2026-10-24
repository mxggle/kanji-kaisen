// Visual identity of the 10 radical themes (colors, icon, decorative glyphs).
// Shared by the classic practice cards and the atlas pages. Client-safe.

import {
    type LucideIcon,
    TreeDeciduous, Users, Footprints, Home, Bird,
    Sword, MessageCircle, Wheat, Activity, Clock, Box,
} from "lucide-react";

export interface ThemeStyle {
    /** Card background incl. hover state. */
    bg: string;
    border: string;
    /** Accent text color, e.g. "text-emerald-400". */
    title: string;
    /** Solid accent background, e.g. "bg-emerald-500". */
    solid: string;
    /** Subtle tinted background, e.g. "bg-emerald-950/20". */
    tint: string;
    icon: LucideIcon;
    elements: string[];
    radicals: string[];
}

export const THEME_STYLES: Record<string, ThemeStyle> = {
    "Nature & Elements": {
        bg: "bg-emerald-950/40 hover:bg-emerald-950/60",
        border: "border-emerald-800/50",
        title: "text-emerald-400",
        solid: "bg-emerald-500",
        tint: "bg-emerald-950/20",
        icon: TreeDeciduous,
        elements: ["木", "山", "川", "火", "土"],
        radicals: ["木", "氵", "火", "土", "山"],
    },
    "Human Body & People": {
        bg: "bg-blue-950/40 hover:bg-blue-950/60",
        border: "border-blue-800/50",
        title: "text-blue-400",
        solid: "bg-blue-500",
        tint: "bg-blue-950/20",
        icon: Users,
        elements: ["人", "女", "目", "手", "足"],
        radicals: ["亻", "女", "目", "扌", "⻊"],
    },
    "Action & Movement": {
        bg: "bg-red-950/40 hover:bg-red-950/60",
        border: "border-red-800/50",
        title: "text-red-400",
        solid: "bg-red-500",
        tint: "bg-red-950/20",
        icon: Footprints,
        elements: ["走", "行", "止", "来", "去"],
        radicals: ["止", "癶", "彳", "辶", "走"],
    },
    "Structures & Home": {
        bg: "bg-stone-950/40 hover:bg-stone-950/60",
        border: "border-stone-800/50",
        title: "text-stone-400",
        solid: "bg-stone-500",
        tint: "bg-stone-950/20",
        icon: Home,
        elements: ["家", "門", "戶", "屋", "室"],
        radicals: ["宀", "广", "門", "戶", "囗"],
    },
    "Animals & Wildlife": {
        bg: "bg-amber-950/40 hover:bg-amber-950/60",
        border: "border-amber-800/50",
        title: "text-amber-400",
        solid: "bg-amber-500",
        tint: "bg-amber-950/20",
        icon: Bird,
        elements: ["鳥", "魚", "虫", "犬", "鹿"],
        radicals: ["鳥", "魚", "虫", "犭", "鹿"],
    },
    "Tools & Weapons": {
        bg: "bg-slate-950/40 hover:bg-slate-950/60",
        border: "border-slate-800/50",
        title: "text-slate-400",
        solid: "bg-slate-500",
        tint: "bg-slate-950/20",
        icon: Sword,
        elements: ["刀", "弓", "矛", "斤", "矢"],
        radicals: ["刀", "弓", "矛", "斤", "矢"],
    },
    "Communication & Thought": {
        bg: "bg-purple-950/40 hover:bg-purple-950/60",
        border: "border-purple-800/50",
        title: "text-purple-400",
        solid: "bg-purple-500",
        tint: "bg-purple-950/20",
        icon: MessageCircle,
        elements: ["言", "語", "心", "意", "知"],
        radicals: ["言", "心", "讠", "忄"],
    },
    "Textiles, Plants & Food": {
        bg: "bg-lime-950/40 hover:bg-lime-950/60",
        border: "border-lime-800/50",
        title: "text-lime-400",
        solid: "bg-lime-500",
        tint: "bg-lime-950/20",
        icon: Wheat,
        elements: ["糸", "草", "食", "禾", "米"],
        radicals: ["糸", "艹", "飠", "禾", "米"],
    },
    "States & Attributes": {
        bg: "bg-pink-950/40 hover:bg-pink-950/60",
        border: "border-pink-800/50",
        title: "text-pink-400",
        solid: "bg-pink-500",
        tint: "bg-pink-950/20",
        icon: Activity,
        elements: ["長", "大", "高", "色", "形"],
        radicals: ["長", "大", "赤", "青"],
    },
    "Time & Sequence": {
        bg: "bg-indigo-950/40 hover:bg-indigo-950/60",
        border: "border-indigo-800/50",
        title: "text-indigo-400",
        solid: "bg-indigo-500",
        tint: "bg-indigo-950/20",
        icon: Clock,
        elements: ["日", "月", "时", "午", "夕"],
        radicals: ["日", "月", "夕"],
    },
    Others: {
        bg: "bg-zinc-900/40 hover:bg-zinc-900/60",
        border: "border-zinc-800/50",
        title: "text-zinc-400",
        solid: "bg-zinc-500",
        tint: "bg-zinc-950/20",
        icon: Box,
        elements: ["乙", "亅", "二", "八", "十"],
        radicals: ["乙", "亅", "二", "八", "十"],
    },
};

export function getThemeStyle(category: string | null | undefined): ThemeStyle {
    return (category && THEME_STYLES[category]) || THEME_STYLES.Others;
}

/**
 * Legacy "text border bg" class triple used by the story modals and
 * RadicalCard (e.g. "text-emerald-400 border-emerald-800/50 bg-emerald-950/20").
 */
export function getThemeClass(category: string | null | undefined): string {
    const t = getThemeStyle(category);
    return `${t.title} ${t.border} ${t.tint}`;
}
