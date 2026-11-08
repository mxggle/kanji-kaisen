// Pure reading alignment: which of a kanji's KANJIDIC readings does it take in
// a given word? Used by scripts/build-data-layers.mjs (word selection) and
// scripts/build-kanji-atlas.mjs (wordsByReading). Relative imports would need
// `.ts` so the Node test runner can load this file; it has none.
//
// Order of evidence:
//   1. JmdictFurigana segments for the word (CC BY-SA 4.0, Doublevil)
//   2. a heuristic segmentation of the word's reading against the KANJIDIC
//      readings of every kanji in it
//   3. otherwise the word is "special" (jukujikun, ateji, irregular reading)

export type ReadingKind = "on" | "kun";

export interface KanjiReadings {
    /** On'yomi in katakana (KANJIDIC). */
    on: string[];
    /** Kun'yomi in hiragana, KANJIDIC notation (`う.まれる`, `-び`, `なま-`). */
    kun: string[];
}

export interface ReadingMatch {
    /** The KANJIDIC reading as written there (`カイ`, `う.まれる`). */
    reading: string;
    kind: ReadingKind;
}

/** One furigana segment: `ruby` is the text, `rt` its reading (absent for kana). */
export interface FuriganaSegment {
    ruby: string;
    rt?: string;
}

export type ReadingsOf = (char: string) => KanjiReadings | null | undefined;

const KATAKANA_START = 0x30a1;
const KATAKANA_END = 0x30f6;

/** Katakana -> hiragana (ー and other characters are kept). */
export function kataToHira(text: string): string {
    let out = "";
    for (const ch of text) {
        const cp = ch.codePointAt(0) ?? 0;
        out += cp >= KATAKANA_START && cp <= KATAKANA_END ? String.fromCodePoint(cp - 0x60) : ch;
    }
    return out;
}

const KANA_RE = /^[ぁ-ゖァ-ヺー]+$/;
export const isKana = (text: string) => KANA_RE.test(text);

const VOICED: Record<string, string[]> = {
    か: ["が"], き: ["ぎ"], く: ["ぐ"], け: ["げ"], こ: ["ご"],
    さ: ["ざ"], し: ["じ"], す: ["ず"], せ: ["ぜ"], そ: ["ぞ"],
    た: ["だ"], ち: ["ぢ", "じ"], つ: ["づ", "ず"], て: ["で"], と: ["ど"],
    は: ["ば", "ぱ"], ひ: ["び", "ぴ"], ふ: ["ぶ", "ぷ"], へ: ["べ", "ぺ"], ほ: ["ぼ", "ぽ"],
};
const GEMINATING = new Set(["つ", "ち", "く", "き"]);

/** Bare hiragana stem of a KANJIDIC reading: `う.まれる` -> `う`, `-び` -> `び`, `カイ` -> `かい`. */
export function readingStem(reading: string): string {
    const core = reading.trim().replace(/^-|-$/g, "");
    const dot = core.indexOf(".");
    return kataToHira(dot === -1 ? core : core.slice(0, dot));
}

/** Okurigana of a KANJIDIC reading: `う.まれる` -> `まれる`. */
export function readingOkurigana(reading: string): string {
    const core = reading.trim().replace(/^-|-$/g, "");
    const dot = core.indexOf(".");
    return dot === -1 ? "" : kataToHira(core.slice(dot + 1));
}

const U_TO_I: Record<string, string> = { う: "い", く: "き", ぐ: "ぎ", す: "し", つ: "ち", ぬ: "に", ぶ: "び", む: "み", る: "り" };
const E_OR_I_ROW = new Set([..."えけげせぜてでねへべぺめれいきぎしじちぢにひびぴみり"]);

/**
 * Stems a kun'yomi with okurigana takes when the kanji also carries the verb's
 * stem in a compound: 立場 たち(ば) from た.つ, 建物 たて(もの) from た.てる,
 * 届 とどけ from とど.ける.
 */
function inflectedStems(stem: string, okurigana: string): string[] {
    if (!okurigana) return [];
    const chars = [...okurigana];
    const last = chars[chars.length - 1];
    const head = chars.slice(0, -1).join("");
    const out: string[] = [];
    // Ichidan verbs (-eru/-iru) drop る; godan verbs turn the final u-row kana into i-row.
    if (last === "る" && chars.length >= 2 && E_OR_I_ROW.has(chars[chars.length - 2])) out.push(stem + head);
    if (U_TO_I[last]) out.push(stem + head + U_TO_I[last]);
    return out;
}

/**
 * Surface forms a reading can take inside a word, with a cost: 0 for the
 * plain stem, 1 for rendaku (か -> が), gemination (がく -> がっ) or a verb
 * stem (た.つ -> たち), more when they combine.
 */
export function readingForms(reading: string): { form: string; cost: number }[] {
    const base = readingStem(reading);
    if (!base) return [];
    const bases = [{ form: base, cost: 0 }, ...inflectedStems(base, readingOkurigana(reading)).map((form) => ({ form, cost: 1 }))];
    const forms: { form: string; cost: number }[] = [];
    for (const b of bases) {
        const chars = [...b.form];
        const starts = [b];
        for (const voiced of VOICED[chars[0]] ?? []) starts.push({ form: voiced + chars.slice(1).join(""), cost: b.cost + 1 });
        forms.push(...starts);
        if (chars.length >= 2 && GEMINATING.has(chars[chars.length - 1])) {
            for (const { form, cost } of starts) forms.push({ form: [...form].slice(0, -1).join("") + "っ", cost: cost + 1 });
        }
    }
    return forms;
}

function commonPrefixLength(a: string, b: string): number {
    let i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
}

/**
 * Finds which reading `rt` (the kanji's reading in a word) is. `following` is
 * the kana written right after the kanji in the word; it picks between kun
 * readings that share a stem (生きる -> い.きる, not い.かす).
 */
export function matchReading(rt: string, readings: KanjiReadings, following = ""): ReadingMatch | null {
    const target = kataToHira(rt);
    const after = kataToHira(following);
    const all: ReadingMatch[] = [
        ...readings.on.map((reading) => ({ reading, kind: "on" as const })),
        ...readings.kun.map((reading) => ({ reading, kind: "kun" as const })),
    ];
    let best: ReadingMatch | null = null;
    let bestScore = Infinity;
    for (const candidate of all) {
        const hit = readingForms(candidate.reading).find((f) => f.form === target);
        if (!hit) continue;
        let score = hit.cost * 10;
        const okurigana = readingOkurigana(candidate.reading);
        if (okurigana) {
            // Conjugation changes the end of the okurigana, never its start.
            const shared = commonPrefixLength(okurigana, after);
            score += shared === 0 ? 5 : -Math.min(shared, 4);
            if (after.startsWith(okurigana)) score -= 5;
        }
        if (score < bestScore) {
            best = candidate;
            bestScore = score;
        }
    }
    return best;
}

/** Kana text that directly follows segment `index`. */
function kanaAfter(segments: FuriganaSegment[], index: number): string {
    let out = "";
    for (const segment of segments.slice(index + 1)) {
        if (!isKana(segment.ruby)) break;
        out += segment.ruby;
    }
    return out;
}

/**
 * Splits a word's reading across its characters using each kanji's readings.
 * Returns one rt per character, or null when no segmentation fits.
 */
export function segmentReading(word: string, reading: string, readingsOf: ReadingsOf): string[] | null {
    const chars = [...word];
    const target = kataToHira(reading);
    const result: string[] = [];

    const formsFor = (index: number): string[] => {
        let char = chars[index];
        if (char === "々" && index > 0) char = chars[index - 1];
        const readings = readingsOf(char);
        if (!readings) return [];
        const forms = [...readings.on, ...readings.kun].flatMap((r) => readingForms(r));
        // Cheapest first, then longest, so the first full parse is the most regular one.
        forms.sort((a, b) => a.cost - b.cost || b.form.length - a.form.length);
        return [...new Set(forms.map((f) => f.form))];
    };

    const walk = (ci: number, ri: number): boolean => {
        if (ci === chars.length) return ri === target.length;
        const char = chars[ci];
        if (isKana(char)) {
            const kana = kataToHira(char);
            if (target.startsWith(kana, ri)) {
                result.push(kana);
                if (walk(ci + 1, ri + kana.length)) return true;
                result.pop();
            }
            return false;
        }
        for (const form of formsFor(ci)) {
            if (!target.startsWith(form, ri)) continue;
            result.push(form);
            if (walk(ci + 1, ri + form.length)) return true;
            result.pop();
        }
        return false;
    };

    return walk(0, 0) ? result : null;
}

/**
 * The reading `kanji` takes in `word` (read `reading`), or null when it is
 * irregular. Furigana segments win when given; otherwise the heuristic
 * segmentation is used.
 */
export function alignKanji(
    word: string,
    reading: string,
    kanji: string,
    readingsOf: ReadingsOf,
    furigana?: FuriganaSegment[] | null,
): ReadingMatch | null {
    const readings = readingsOf(kanji);
    if (!readings) return null;

    if (furigana?.length) {
        const index = furigana.findIndex((s) => s.ruby.includes(kanji));
        if (index === -1) return null;
        const segment = furigana[index];
        // A multi-character segment is a reading of the whole group (今日 きょう).
        if ([...segment.ruby].length !== 1 || !segment.rt) return null;
        return matchReading(segment.rt, readings, kanaAfter(furigana, index));
    }

    const chars = [...word];
    const index = chars.indexOf(kanji);
    if (index === -1) return null;
    const parts = segmentReading(word, reading, readingsOf);
    if (!parts) return null;
    let following = "";
    for (const char of chars.slice(index + 1)) {
        if (!isKana(char)) break;
        following += char;
    }
    return matchReading(parts[index], readings, following);
}

const NON_JAPANESE_RE = /[0-9０-９A-Za-zＡ-Ｚａ-ｚ~〜]/;

/**
 * Last resort for words with digits or Latin letters (10代 じゅうだい, ３ページ目),
 * which cannot be segmented: a kanji at the end of the word must end the
 * reading with one of its forms, a kanji at the start must begin it.
 */
export function alignByEdge(word: string, reading: string, kanji: string, readings: KanjiReadings): ReadingMatch | null {
    if (!NON_JAPANESE_RE.test(word)) return null;
    const chars = [...word];
    const target = kataToHira(reading);
    const atEnd = chars[chars.length - 1] === kanji;
    const atStart = chars[0] === kanji;
    if (!atEnd && !atStart) return null;
    for (const [reading_, kind] of [...readings.on.map((r) => [r, "on"] as const), ...readings.kun.map((r) => [r, "kun"] as const)]) {
        for (const { form } of readingForms(reading_)) {
            if ((atEnd && target.endsWith(form)) || (atStart && target.startsWith(form))) return { reading: reading_, kind };
        }
    }
    return null;
}

/** Parses the compact furigana stored in lib/ja/words.jmdict.json: ["日:に", "本:ほん", "です"]. */
export function parseFurigana(compact: string[]): FuriganaSegment[] {
    return compact.map((part) => {
        const colon = part.indexOf(":");
        return colon === -1 ? { ruby: part } : { ruby: part.slice(0, colon), rt: part.slice(colon + 1) };
    });
}

/** Inverse of parseFurigana. */
export function formatFurigana(segments: FuriganaSegment[]): string[] {
    return segments.map((s) => (s.rt ? `${s.ruby}:${s.rt}` : s.ruby));
}
