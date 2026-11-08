// Pure phonetic-series logic. A series is every kanji whose sound component
// (KanjiVG kvg:phon, see lib/core/kanjivg-parse.ts) is the same character:
// 毎 -> 海 悔 梅 敏 … The shared on'yomi is the reading most of the family has.

export interface PhoneticSeries {
    /** The phonetic component. */
    char: string;
    /** Atlas kanji in the series, the phonetic itself first when it is one. */
    members: string[];
    /** On'yomi (katakana) shared by at least two characters of the family, else null. */
    reading: string | null;
}

const VOICING: Record<string, string> = {};
for (const [plain, voiced] of [
    ["かきくけこさしすせそたちつてとはひふへほ", "がぎぐげござじずぜぞだぢづでどばびぶべぼ"],
    ["はひふへほ", "ぱぴぷぺぽ"],
    ["カキクケコサシスセソタチツテトハヒフヘホ", "ガギグゲゴザジズゼゾダヂヅデドバビブベボ"],
    ["ハヒフヘホ", "パピプペポ"],
]) {
    [...voiced].forEach((v, i) => (VOICING[v] = [...plain][i]));
}

/** Comparison key for on'yomi: the first mora's voicing is ignored (ハン = バン = パン). */
export function onKey(reading: string): string {
    const chars = [...reading];
    if (!chars.length) return "";
    chars[0] = VOICING[chars[0]] ?? chars[0];
    return chars.join("");
}

/**
 * The on'yomi most characters in `chars` share (voicing-insensitive), or null
 * when no reading is shared by two of them. Ties go to the phonetic's own
 * reading, then to the earliest character.
 */
export function sharedOnReading(chars: string[], onOf: (char: string) => string[], phonetic?: string): string | null {
    const holders = new Map<string, { count: number; forms: Map<string, number>; first: number; ownedByPhonetic: boolean }>();
    chars.forEach((char, index) => {
        const seen = new Set<string>();
        for (const reading of onOf(char)) {
            const key = onKey(reading);
            if (seen.has(key)) continue;
            seen.add(key);
            const entry = holders.get(key) ?? { count: 0, forms: new Map(), first: index, ownedByPhonetic: false };
            entry.count++;
            entry.forms.set(reading, (entry.forms.get(reading) ?? 0) + 1);
            if (char === phonetic) entry.ownedByPhonetic = true;
            holders.set(key, entry);
        }
    });
    let best: [string, { count: number; forms: Map<string, number>; first: number; ownedByPhonetic: boolean }] | null = null;
    for (const entry of holders) {
        const [, h] = entry;
        if (h.count < 2) continue;
        if (
            !best ||
            h.count > best[1].count ||
            (h.count === best[1].count && h.ownedByPhonetic && !best[1].ownedByPhonetic) ||
            (h.count === best[1].count && h.ownedByPhonetic === best[1].ownedByPhonetic && h.first < best[1].first)
        ) {
            best = entry;
        }
    }
    if (!best) return null;
    // The most common written form (カン over ガン).
    return [...best[1].forms].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0][0];
}

/** Whether a kanji with on'yomi `on` reads like its series. */
export function isRegular(on: string[], shared: string | null): boolean {
    if (!shared) return false;
    const key = onKey(shared);
    return on.some((r) => onKey(r) === key);
}

/**
 * Builds every phonetic series. `entries` are the atlas kanji in display
 * order with their phonetic (or null); `inAtlas` says whether the phonetic
 * itself is an atlas kanji (it then heads the member list); `onOf` gives
 * on'yomi for any character, including phonetics outside the atlas.
 */
export function buildPhoneticSeries(
    entries: { char: string; phon: string | null }[],
    inAtlas: (char: string) => boolean,
    onOf: (char: string) => string[],
): Map<string, PhoneticSeries> {
    const groups = new Map<string, string[]>();
    for (const { char, phon } of entries) {
        if (!phon || phon === char) continue;
        const list = groups.get(phon) ?? [];
        list.push(char);
        groups.set(phon, list);
    }
    const series = new Map<string, PhoneticSeries>();
    for (const [phon, chars] of groups) {
        const members = inAtlas(phon) ? [phon, ...chars] : chars;
        const family = members.includes(phon) ? members : [phon, ...members];
        series.set(phon, { char: phon, members, reading: sharedOnReading(family, onOf, phon) });
    }
    return series;
}
