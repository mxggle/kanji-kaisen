// The 10 radical themes, in path order. Client-safe (no data imports).

export const CATEGORIES = [
    "Nature & Elements",
    "Human Body & People",
    "Action & Movement",
    "Structures & Home",
    "Animals & Wildlife",
    "Tools & Weapons",
    "Communication & Thought",
    "Textiles, Plants & Food",
    "States & Attributes",
    "Time & Sequence",
] as const;

export type CategoryName = typeof CATEGORIES[number];

export function getCategorySlug(category: string): string {
    return category.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-").replace(/,/g, "");
}

export function getCategoryFromSlug(slug: string): CategoryName | undefined {
    return CATEGORIES.find((c) => getCategorySlug(c) === slug);
}

export function getCategoryImage(category: string): string {
    return `/images/categories/${getCategorySlug(category)}.png`;
}

// Theme metadata from the Today board. Colours are the 夜 (night) accents; in
// 墨 (ink) every theme uses the vermilion accent instead (see --c in globals.css).

export const THEME_COLORS: Record<CategoryName, string> = {
    "Nature & Elements": "#34D399",
    "Human Body & People": "#60A5FA",
    "Action & Movement": "#F87171",
    "Structures & Home": "#D6CFC4",
    "Animals & Wildlife": "#FBBF24",
    "Tools & Weapons": "#A5B4C8",
    "Communication & Thought": "#C084FC",
    "Textiles, Plants & Food": "#A3E635",
    "States & Attributes": "#F472B6",
    "Time & Sequence": "#A5B4FC",
};

/** One-word names for gates, scrolls and tight spaces. */
export const THEME_SHORT: Record<CategoryName, string> = {
    "Nature & Elements": "Nature",
    "Human Body & People": "Body",
    "Action & Movement": "Action",
    "Structures & Home": "Home",
    "Animals & Wildlife": "Animals",
    "Tools & Weapons": "Tools",
    "Communication & Thought": "Thought",
    "Textiles, Plants & Food": "Plants",
    "States & Attributes": "States",
    "Time & Sequence": "Time",
};

export const THEME_JP: Record<CategoryName, string> = {
    "Nature & Elements": "自然と元素",
    "Human Body & People": "人と身体",
    "Action & Movement": "動きと行い",
    "Structures & Home": "住まい",
    "Animals & Wildlife": "動物と野生",
    "Tools & Weapons": "道具と武器",
    "Communication & Thought": "言葉と思考",
    "Textiles, Plants & Food": "糸・草・食",
    "States & Attributes": "状態と性質",
    "Time & Sequence": "時と順序",
};

/** One-line lore for theme heroes. */
export const THEME_LORE: Record<CategoryName, string> = {
    "Nature & Elements": "Water, fire, earth, wood, mountain and sky. The first scribes drew what they saw, and those pictures still sit inside hundreds of kanji.",
    "Human Body & People": "A standing person, a working hand, an open mouth, a beating heart. The body is the measure of everything people do.",
    "Action & Movement": "Roads, words, strength and strikes. These parts turn a still picture into something happening.",
    "Structures & Home": "A roof, a gate, an enclosing wall. Put something under 宀 and it belongs to a house.",
    "Animals & Wildlife": "Shells that were once money, birds, horses and beasts. Ancient life left its tracks in the script.",
    "Tools & Weapons": "Knife, bow, cart and jade. What people made with their hands became the parts of new words.",
    "Communication & Thought": "Sound, speech and comparison: the smallest theme, and the strangest.",
    "Textiles, Plants & Food": "Silk thread, grass and bamboo. The everyday materials of life, spun into the script.",
    "States & Attributes": "Big and small, white and blue, sweet and bitter. How things are, rather than what they are.",
    "Time & Sequence": "One, ten, evening, the dragon hour. Counting and the turning of the day.",
};

/** Large faint glyph behind a theme hero. */
export const THEME_MARK: Record<CategoryName, string> = {
    "Nature & Elements": "氵",
    "Human Body & People": "亻",
    "Action & Movement": "辶",
    "Structures & Home": "宀",
    "Animals & Wildlife": "鳥",
    "Tools & Weapons": "刀",
    "Communication & Thought": "音",
    "Textiles, Plants & Food": "糸",
    "States & Attributes": "大",
    "Time & Sequence": "夕",
};

/** Neutral accent for unknown or missing themes. */
export const DEFAULT_THEME_COLOR = "#B4AFA4";

export function isCategoryName(value: string | null | undefined): value is CategoryName {
    return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

/** The theme's 夜 accent colour, or a neutral grey. */
export function getThemeColor(category: string | null | undefined): string {
    return isCategoryName(category) ? THEME_COLORS[category] : DEFAULT_THEME_COLOR;
}
