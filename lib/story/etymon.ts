// Which code points to look up ancient forms (and glyph origins) under, for a
// display character. Pure: the Unicode data files are parsed by the caller's
// I/O and passed in. Sources: Unihan (kJapaneseOldVariant, kTraditionalVariant,
// kZVariant, kRSUnicode), CJKRadicals.txt and EquivalentUnifiedIdeograph.txt.

export interface EtymonData {
    // char -> Unihan variant field -> variant chars
    variants: Map<string, Record<string, string[]>>;
    // char -> Kangxi radical number (no primes) and residual stroke count
    radicalStrokes: Map<string, { radical: string; residual: number }>;
    // Kangxi radical number -> its unified ideograph (85 -> 水)
    radicalChars: Map<string, string>;
    // CJK radical supplement char -> unified ideograph (⺖ -> 忄)
    equivalent: Map<string, string>;
}

const fromCodePoint = (u: string) => String.fromCodePoint(parseInt(u.replace(/^U\+/, ""), 16));

const dataLines = (text: string) => text.split("\n").filter((line) => line.trim() !== "" && !line.startsWith("#"));

/** Unihan_Variants.txt -> char -> field -> chars (source tags like `<kMatthews` dropped). */
export function parseUnihanVariants(text: string): EtymonData["variants"] {
    const map: EtymonData["variants"] = new Map();
    for (const line of dataLines(text)) {
        const [cp, field, value] = line.split("\t");
        if (!cp?.startsWith("U+") || !field || !value) continue;
        const char = fromCodePoint(cp);
        const chars = value
            .trim()
            .split(/\s+/)
            .map((v) => fromCodePoint(v.split("<")[0]));
        const entry = map.get(char) ?? {};
        entry[field] = chars;
        map.set(char, entry);
    }
    return map;
}

/** kRSUnicode lines (Unihan_IRGSources.txt) -> first radical/residual pair per char. */
export function parseRadicalStrokes(text: string): EtymonData["radicalStrokes"] {
    const map: EtymonData["radicalStrokes"] = new Map();
    for (const line of text.split("\n")) {
        const [cp, field, value] = line.split("\t");
        if (field !== "kRSUnicode" || !cp?.startsWith("U+") || !value) continue;
        const m = /^(\d+)'*\.(-?\d+)/.exec(value.trim());
        if (m) map.set(fromCodePoint(cp), { radical: m[1], residual: Number(m[2]) });
    }
    return map;
}

/** CJKRadicals.txt -> Kangxi radical number -> unified ideograph (main forms only). */
export function parseCjkRadicals(text: string): EtymonData["radicalChars"] {
    const map: EtymonData["radicalChars"] = new Map();
    for (const line of dataLines(text)) {
        const [num, , unified] = line.split(";").map((s) => s.trim());
        if (/^\d+$/.test(num) && unified) map.set(num, fromCodePoint(unified));
    }
    return map;
}

/** EquivalentUnifiedIdeograph.txt -> radical char -> unified ideograph. */
export function parseEquivalentUnified(text: string): EtymonData["equivalent"] {
    const map: EtymonData["equivalent"] = new Map();
    for (const line of dataLines(text)) {
        const [range, target] = line.split("#")[0].split(";").map((s) => s.trim());
        if (!range || !target) continue;
        const [from, to = from] = range.split("..").map((u) => parseInt(u, 16));
        for (let cp = from; cp <= to; cp++) map.set(String.fromCodePoint(cp), fromCodePoint(target));
    }
    return map;
}

export interface EtymonCandidates {
    // Code points to try, best first. Forms for one stage come from the first
    // candidate that has a usable file.
    candidates: string[];
    // Set when the char maps to several distinct old forms (弁 -> 辨 瓣 辯), so
    // no single etymon can be chosen; candidates is then empty.
    ambiguous?: string[];
}

/**
 * Candidates for a display char:
 * 1. A single kJapaneseOldVariant (学 -> 學, 体 -> 體, 芸 -> 藝) replaces the
 *    char: the shinjitai shape may coincide with an unrelated old character.
 * 2. Otherwise the char itself, its unified equivalent (⺖ -> 忄), a single
 *    kTraditionalVariant when the char is not itself traditional, its
 *    kZVariants (戸 -> 戶), and for a radical form with no strokes of its own
 *    the main Kangxi radical (氵 -> 水, 亻 -> 人, ⺮ -> 竹).
 * Semantic variants are not used: they link different characters.
 */
export function etymonCandidates(char: string, data: EtymonData): EtymonCandidates {
    const unified = data.equivalent.get(char) ?? char;
    const fields = data.variants.get(unified) ?? {};

    // Compatibility ideographs (海 U+FA45 for 海) are the same character.
    const same = (c: string) => c.normalize("NFC") === unified.normalize("NFC");
    const old = [...new Set((fields.kJapaneseOldVariant ?? []).filter((c) => !same(c)))];
    if (old.length > 1) return { candidates: [], ambiguous: old };
    if (old.length === 1) return { candidates: old };

    const out = [char, unified];
    const trad = fields.kTraditionalVariant ?? [];
    const tradOther = [...new Set(trad.filter((c) => c !== unified))];
    if (!trad.includes(unified) && tradOther.length === 1) out.push(tradOther[0]);
    out.push(...(fields.kZVariant ?? []));

    const rs = data.radicalStrokes.get(unified);
    if (rs && rs.residual === 0) {
        const main = data.radicalChars.get(rs.radical);
        if (main) out.push(main);
    }
    return { candidates: [...new Set(out)] };
}

/** Lower-case hex code point padded to 5 digits, as KanjiVG names files: 學 -> "05b78". */
export function codePointHex(char: string): string {
    return (char.codePointAt(0) ?? 0).toString(16).padStart(5, "0");
}
