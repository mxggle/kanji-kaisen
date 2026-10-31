// Pure facts for the "In Chinese" note (client-safe). The page phrases them;
// tests check the classification. Data: Unihan via lib/core/zh.ts.

import type { ZhInfo } from "../../lib/core/zh.ts";
import type { UnihanLookup } from "../../lib/core/zh.ts";

/**
 * Same code point, different word in Chinese:
 * - different-char: the Japanese form is its own, unrelated character in
 *   Chinese (芸 is 藝 "art" in Japan; Chinese 芸 yún is a plant).
 * - also-stands-for: the PRC simplified form also stands for other
 *   characters that Japanese keeps apart (机 "desk" is also 機 "machine").
 */
export type FalseFriend =
    | { kind: "different-char"; pinyin: string[] }
    | { kind: "also-stands-for"; chars: { char: string; meaning: string | null }[] };

/** Unihan's kMandarin lists only the most customary readings; more than this are cut. */
export const PINYIN_LIMIT = 3;

export interface ZhFacts {
    relation: ZhInfo["relation"];
    simplified: string | null;
    traditional: string | null;
    /** Further traditional forms the Japanese form merged (弁: 辨 辯). */
    alsoTraditional: string[];
    pinyin: string[];
    /** Readings were cut to PINYIN_LIMIT. */
    pinyinTruncated: boolean;
    kokuji: boolean;
    falseFriend: FalseFriend | null;
}

/**
 * @param meaningOf  first meanings of an atlas kanji (null when not in the atlas);
 *                   also-stands-for only lists characters the atlas has.
 */
export function zhFacts(char: string, zh: ZhInfo, get: UnihanLookup, meaningOf: (c: string) => string | null): ZhFacts {
    const entry = get(char);
    let falseFriend: FalseFriend | null = null;

    if (!zh.kokuji && zh.simplified) {
        const own = char !== zh.simplified && char !== zh.traditional;
        if (own && (entry?.tgh || entry?.tw)) {
            falseFriend = { kind: "different-char", pinyin: [...(entry?.m ?? [])] };
        } else if (char === zh.simplified) {
            const others = (entry?.t ?? [])
                .filter((t) => t !== char && t !== zh.traditional)
                .map((t) => ({ char: t, meaning: meaningOf(t) }))
                .filter((o) => o.meaning !== null);
            if (others.length) falseFriend = { kind: "also-stands-for", chars: others };
        }
    }

    return {
        relation: zh.relation,
        simplified: zh.simplified,
        traditional: zh.traditional,
        alsoTraditional: zh.alsoTraditional ?? [],
        pinyin: zh.pinyin.slice(0, PINYIN_LIMIT),
        pinyinTruncated: zh.pinyin.length > PINYIN_LIMIT,
        kokuji: zh.kokuji,
        falseFriend,
    };
}

/** The "In Chinese" row's one-line summary: "Same character in simplified and traditional · xiū". */
export function zhSummary(f: Pick<ZhFacts, "relation" | "simplified" | "traditional" | "pinyin" | "kokuji">): string {
    const s = f.simplified ?? "";
    const t = f.traditional ?? "";
    let head: string;
    switch (f.relation) {
        case "same":
            head = "Same character in simplified and traditional";
            break;
        case "ja-trad":
            head = `Simplified ${s} · traditional, as in Japanese`;
            break;
        case "ja-simp":
            head = `Simplified, as in Japanese · traditional ${t}`;
            break;
        case "ja-only":
            head = `A Japanese form · Chinese writes ${s}`;
            break;
        case "all-differ":
            head = `Simplified ${s} · traditional ${t}`;
            break;
        case "kokuji":
            head = "Made in Japan, no Chinese counterpart";
            break;
        default:
            head = "No clear Chinese counterpart";
    }
    return f.pinyin.length && !f.kokuji ? `${head} · ${f.pinyin.join(", ")}` : head;
}
