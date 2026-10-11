import type { KanjiData } from "@/types/kanji";

type QuizKanji = Pick<KanjiData, "char" | "meaning" | "jlpt" | "strokeCount">;

const OPTION_COUNT = 4;

// Words too generic to make two meanings synonyms.
const STOP_WORDS = new Set([
    "a", "an", "and", "as", "at", "be", "by", "for", "from", "in", "into", "is", "it",
    "of", "on", "one", "or", "out", "the", "to", "up", "with",
]);

function normalizeWord(word: string): string {
    if (word.length > 4 && /(s|x|z|ch|sh)es$/.test(word)) return word.slice(0, -2);
    if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
    return word;
}

export function meaningWords(meaning: string): Set<string> {
    return new Set(
        meaning
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((word) => word.length >= 2 && !STOP_WORDS.has(word))
            .map(normalizeWord)
    );
}

function sharesWord(a: Set<string>, b: Set<string>): boolean {
    for (const word of a) {
        if (b.has(word)) return true;
    }
    return false;
}

function stableHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash;
}

function scoreDistractor(
    target: QuizKanji,
    targetCategory: string,
    candidate: QuizKanji,
    candidateCategory: string
): number {
    let score = 0;

    // 1) Same category: similar context without sharing the meaning.
    if (candidateCategory === targetCategory) score += 5;

    // 2) Same JLPT level: similar difficulty band.
    if (candidate.jlpt === target.jlpt) score += 3;

    // 3) Similar stroke complexity: keeps options feeling from same "family".
    const strokeDiff = Math.abs(candidate.strokeCount - target.strokeCount);
    if (strokeDiff <= 2) score += 2;
    else if (strokeDiff <= 4) score += 1;

    return score;
}

// Returns the correct meaning plus three distractors. A distractor never shares a content
// word with the answer (or another option), so it can't also be a correct answer.
export function buildQuizOptions(
    target: QuizKanji,
    category: string,
    pool: QuizKanji[],
    charToCategory: Record<string, string>
): string[] {
    const targetWords = meaningWords(target.meaning);

    const ranked = pool
        .filter((candidate) => candidate.char !== target.char && candidate.meaning.trim())
        .map((candidate) => ({
            meaning: candidate.meaning,
            words: meaningWords(candidate.meaning),
            score: scoreDistractor(target, category, candidate, charToCategory[candidate.char] || "Others"),
            tieBreak: stableHash(target.char + candidate.char),
        }))
        .filter((candidate) => candidate.words.size > 0 && !sharesWord(candidate.words, targetWords))
        .sort((a, b) => b.score - a.score || a.tieBreak - b.tieBreak);

    const chosen: string[] = [];
    const usedWords = new Set(targetWords);

    for (const candidate of ranked) {
        if (sharesWord(candidate.words, usedWords)) continue;
        chosen.push(candidate.meaning);
        candidate.words.forEach((word) => usedWords.add(word));
        if (chosen.length === OPTION_COUNT - 1) break;
    }

    const options = [target.meaning, ...chosen];

    // Stable order per kanji, but not always same position globally.
    return options.sort((a, b) => stableHash(a + target.char) - stableHash(b + target.char));
}
