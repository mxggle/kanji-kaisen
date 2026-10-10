// Category color themes. Every class is written out in full so Tailwind can find it at
// build time; never build these by string replacement (e.g. "text-" -> "bg-").
export interface CategoryTheme {
    text: string;
    border: string;
    surface: string;
    card: string;
    // Filled buttons and icon tiles, with a text color that keeps 4.5:1 contrast.
    solid: string;
    // Progress bars and indicator dots.
    accent: string;
    heroFrom: string;
}

export const CATEGORY_THEMES: Record<string, CategoryTheme> = {
    "Nature & Elements": {
        text: "text-emerald-400",
        border: "border-emerald-800/50",
        surface: "bg-emerald-950/20",
        card: "bg-emerald-950/40 hover:bg-emerald-950/60",
        solid: "bg-emerald-500 text-black",
        accent: "bg-emerald-400",
        heroFrom: "from-emerald-900/40",
    },
    "Human Body & People": {
        text: "text-blue-400",
        border: "border-blue-800/50",
        surface: "bg-blue-950/20",
        card: "bg-blue-950/40 hover:bg-blue-950/60",
        solid: "bg-blue-500 text-black",
        accent: "bg-blue-400",
        heroFrom: "from-blue-900/40",
    },
    "Action & Movement": {
        text: "text-red-400",
        border: "border-red-800/50",
        surface: "bg-red-950/20",
        card: "bg-red-950/40 hover:bg-red-950/60",
        solid: "bg-red-500 text-black",
        accent: "bg-red-400",
        heroFrom: "from-red-900/40",
    },
    "Structures & Home": {
        text: "text-stone-400",
        border: "border-stone-800/50",
        surface: "bg-stone-950/20",
        card: "bg-stone-950/40 hover:bg-stone-950/60",
        solid: "bg-stone-500 text-white",
        accent: "bg-stone-400",
        heroFrom: "from-stone-900/40",
    },
    "Animals & Wildlife": {
        text: "text-amber-400",
        border: "border-amber-800/50",
        surface: "bg-amber-950/20",
        card: "bg-amber-950/40 hover:bg-amber-950/60",
        solid: "bg-amber-500 text-black",
        accent: "bg-amber-400",
        heroFrom: "from-amber-900/40",
    },
    "Tools & Weapons": {
        text: "text-slate-400",
        border: "border-slate-800/50",
        surface: "bg-slate-950/20",
        card: "bg-slate-950/40 hover:bg-slate-950/60",
        solid: "bg-slate-500 text-white",
        accent: "bg-slate-400",
        heroFrom: "from-slate-900/40",
    },
    "Communication & Thought": {
        text: "text-purple-400",
        border: "border-purple-800/50",
        surface: "bg-purple-950/20",
        card: "bg-purple-950/40 hover:bg-purple-950/60",
        solid: "bg-purple-500 text-black",
        accent: "bg-purple-400",
        heroFrom: "from-purple-900/40",
    },
    "Textiles, Plants & Food": {
        text: "text-lime-400",
        border: "border-lime-800/50",
        surface: "bg-lime-950/20",
        card: "bg-lime-950/40 hover:bg-lime-950/60",
        solid: "bg-lime-500 text-black",
        accent: "bg-lime-400",
        heroFrom: "from-lime-900/40",
    },
    "States & Attributes": {
        text: "text-pink-400",
        border: "border-pink-800/50",
        surface: "bg-pink-950/20",
        card: "bg-pink-950/40 hover:bg-pink-950/60",
        solid: "bg-pink-500 text-black",
        accent: "bg-pink-400",
        heroFrom: "from-pink-900/40",
    },
    "Time & Sequence": {
        text: "text-indigo-400",
        border: "border-indigo-800/50",
        surface: "bg-indigo-950/20",
        card: "bg-indigo-950/40 hover:bg-indigo-950/60",
        solid: "bg-indigo-500 text-black",
        accent: "bg-indigo-400",
        heroFrom: "from-indigo-900/40",
    },
    "Others": {
        text: "text-zinc-400",
        border: "border-zinc-800/50",
        surface: "bg-zinc-950/20",
        card: "bg-zinc-900/40 hover:bg-zinc-900/60",
        solid: "bg-zinc-500 text-white",
        accent: "bg-zinc-400",
        heroFrom: "from-zinc-900/40",
    },
};

export function getCategoryTheme(category: string | undefined): CategoryTheme {
    return (category && CATEGORY_THEMES[category]) || CATEGORY_THEMES["Others"];
}
