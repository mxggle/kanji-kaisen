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
