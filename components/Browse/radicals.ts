// Radical options for the Browse rail: a short label and a small search over
// character, romaji name and meaning. Pure and client-safe.

/** One radical the rail can filter by (only radicals that head at least one kanji). */
export interface RadicalOption {
    /** Radical key, e.g. "sanzui". */
    key: string;
    char: string;
    /** Romaji name, e.g. "Sanzui" or "Hi / Nichi". */
    name: string;
    /** English meaning, e.g. "Water (3 drops)". */
    meaning: string;
    /** Kanji under this radical. */
    count: number;
    /** Theme name, for the seal's selected ring. */
    category: string | null;
}

/** First sense of a meaning, lowercased: "Water (3 drops)" -> "water", "tree, wood" -> "tree". */
export function shortMeaning(meaning: string): string {
    return meaning.split(/[,(;]/)[0].trim().toLowerCase();
}

/** "氵 water". */
export function radicalLabel(option: Pick<RadicalOption, "char" | "meaning">): string {
    const meaning = shortMeaning(option.meaning);
    return meaning ? `${option.char} ${meaning}` : option.char;
}

const words = (text: string) => text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);

function score(option: RadicalOption, q: string): number {
    if (option.char === q) return 100;
    const names = [option.key, ...words(option.name)];
    if (names.includes(q)) return 90;
    const senses = words(option.meaning);
    if (senses.includes(q)) return 80;
    if (names.some((n) => n.startsWith(q))) return 60;
    if (senses.some((w) => w.startsWith(q))) return 50;
    if (option.meaning.toLowerCase().includes(q)) return 30;
    return 0;
}

/**
 * The seals to show under the radical box. An empty query gives the most
 * used radicals; otherwise the best matches, then the most kanji first. The
 * selected radical always comes first so it stays visible.
 */
export function matchRadicals(options: readonly RadicalOption[], query: string, limit: number, selected: string | null = null): RadicalOption[] {
    const q = query.trim().toLowerCase();
    const ranked = q
        ? options
              .map((option) => ({ option, score: score(option, q) }))
              .filter((r) => r.score > 0)
              .sort((a, b) => b.score - a.score || b.option.count - a.option.count)
              .map((r) => r.option)
        : [...options].sort((a, b) => b.count - a.count);
    const chosen = selected ? options.find((o) => o.key === selected) : undefined;
    const list = chosen ? [chosen, ...ranked.filter((o) => o.key !== chosen.key)] : ranked;
    return list.slice(0, limit);
}
