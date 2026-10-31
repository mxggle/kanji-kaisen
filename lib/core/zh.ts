// Pure "In Chinese" classification from trimmed Unihan data (lib/core/unihan.json).
//
//   J = the Japanese (jōyō/jinmeiyō) form
//   T = its traditional form: kJapaneseOldVariant (the kyūjitai), else
//       kTraditionalVariant, else J when Taiwan uses it, else a Taiwan-standard
//       kZVariant (戸 -> 戶), else J
//   S = the PRC simplified form: a kSimplifiedVariant of T or J that is in the
//       通用规范汉字表 (kTGH); else T or J when they are in that table; else the
//       same search over their kZVariant/kSemanticVariant forms (浄 -> 淨 ~ 凈 -> 净)
//
// Relations follow research_notes/中文汉字学习者市场调研/data_feasibility.md §3.

/** One character's Unihan fields, as stored in lib/core/unihan.json. */
export interface UnihanEntry {
    /** kMandarin readings (pinyin with tone marks). */
    m?: string[];
    /** kSimplifiedVariant chars. */
    s?: string[];
    /** kTraditionalVariant chars. */
    t?: string[];
    /** kJapaneseOldVariant chars (kyūjitai), compatibility ideographs removed. */
    jo?: string[];
    /** kZVariant chars (same character, different glyph). */
    z?: string[];
    /** kSemanticVariant chars (source tags dropped). */
    sv?: string[];
    /** In the PRC 通用规范汉字表 (kTGH). */
    tgh?: 1;
    /** In the Taiwan standard (kIRG_TSource CNS 11643 plane 1 or 2). */
    tw?: 1;
    /** kJoyoKanji: 1 for a jōyō kanji, or the official jōyō form this char is a popular variant of. */
    joyo?: 1 | string;
    /** kJinmeiyoKanji: 1 when listed. */
    jinmei?: 1;
}

export type UnihanLookup = (char: string) => UnihanEntry | undefined;

/**
 * - same: one code point in Japan, PRC and Taiwan (山)
 * - ja-trad: Japan keeps the traditional form, PRC simplifies (語 / 语)
 * - ja-simp: Japan shares the PRC simplified form (学 / 學)
 * - ja-only: Japan's own simplification, PRC and Taiwan share the old form (歩 / 步)
 * - all-differ: three different forms (広 / 广 / 廣)
 * - kokuji: made in Japan
 * - unknown: no Chinese counterpart could be determined
 */
export type ZhRelation = "same" | "ja-trad" | "ja-simp" | "ja-only" | "all-differ" | "kokuji" | "unknown";

export interface ZhInfo {
    relation: ZhRelation;
    /** PRC simplified form, null when unknown or kokuji. */
    simplified: string | null;
    /** Traditional (Taiwan/kyūjitai) form, null when unknown or kokuji. */
    traditional: string | null;
    /** Further traditional forms when the Japanese form merged several (弁: 辨 瓣 辯). */
    alsoTraditional?: string[];
    /** Every kMandarin reading of the Chinese counterpart (S, else T, else J). */
    pinyin: string[];
    kokuji: boolean;
}

/**
 * Jōyō kokuji (characters created in Japan) as listed in the project's
 * research report (data_feasibility.md §3: 働 匂 塀 峠 枠 栃 畑 込).
 * Unihan has no kokuji field, so the list is explicit.
 */
export const KOKUJI = new Set([..."働匂塀峠枠栃畑込"]);

/** True for CJK Compatibility Ideographs, which Unihan uses for some kyūjitai glyph variants (海 -> 海). */
export function isCompatibilityIdeograph(char: string): boolean {
    const cp = char.codePointAt(0) ?? 0;
    return (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0x2f800 && cp <= 0x2fa1f);
}

export function traditionalOf(char: string, get: UnihanLookup): string {
    const entry = get(char);
    const old = (entry?.jo ?? []).filter((c) => c !== char && !isCompatibilityIdeograph(c));
    if (old.length) return old[0];
    const trad = entry?.t ?? [];
    if (trad.length && !trad.includes(char)) return trad[0];
    if (entry?.tw) return char;
    return (entry?.z ?? []).find((c) => get(c)?.tw) ?? char;
}

/** S for one form: a standard simplified variant, else the form itself when it is standard. */
function standardFormOf(form: string, get: UnihanLookup): string | null {
    const simplified = (get(form)?.s ?? []).filter((c) => c !== form);
    const standard = simplified.find((c) => get(c)?.tgh);
    if (standard) return standard;
    if (!simplified.length && get(form)?.tgh) return form;
    return null;
}

/** The PRC simplified form for J (with traditional T), or null when undetermined. */
export function simplifiedOf(char: string, trad: string, get: UnihanLookup): string | null {
    const forms = [trad, char];
    for (const form of forms) {
        const found = standardFormOf(form, get);
        if (found) return found;
    }
    // Unihan sometimes points at an extension-block simplification the PRC
    // standard does not use; try the glyph variants, then semantic variants.
    for (const key of ["z", "sv"] as const) {
        for (const variant of forms.flatMap((f) => get(f)?.[key] ?? [])) {
            const found = standardFormOf(variant, get);
            if (found) return found;
        }
    }
    return null;
}

export function classifyZh(char: string, get: UnihanLookup): ZhInfo {
    const pinyinOf = (...chars: (string | null)[]) => {
        for (const c of chars) {
            const readings = c ? get(c)?.m : undefined;
            if (readings?.length) return [...readings];
        }
        return [];
    };

    if (KOKUJI.has(char)) {
        return { relation: "kokuji", simplified: null, traditional: null, pinyin: pinyinOf(char), kokuji: true };
    }

    const traditional = traditionalOf(char, get);
    const simplified = simplifiedOf(char, traditional, get);
    const pinyin = pinyinOf(simplified, traditional, char);
    if (!simplified) {
        return { relation: "unknown", simplified: null, traditional, pinyin, kokuji: false };
    }

    let relation: ZhRelation;
    if (char === simplified && char === traditional) relation = "same";
    else if (char === traditional) relation = "ja-trad";
    else if (char === simplified) relation = "ja-simp";
    else if (simplified === traditional) relation = "ja-only";
    else relation = "all-differ";
    const info: ZhInfo = { relation, simplified, traditional, pinyin, kokuji: false };
    const others = (get(char)?.jo ?? []).filter((c) => c !== traditional && !isCompatibilityIdeograph(c));
    if (others.length) info.alsoTraditional = others;
    return info;
}

/** The code point ancient forms hang on: the traditional form (学 -> 學), else the char itself. */
export function etymonOf(char: string, get: UnihanLookup): string {
    if (KOKUJI.has(char)) return char;
    return traditionalOf(char, get);
}
