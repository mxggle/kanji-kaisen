// Meaning multiple-choice options with "plausible" distractors: same theme,
// same JLPT level and similar stroke count rank highest. A candidate that
// shares a content word with the answer is never offered, so only one option
// is right ("ocean, sea" never sits beside "ocean, western style"). Shared by
// the classic practice quiz, the learn layer, /study and the projector quiz.

export interface QuizCandidate {
    char: string;
    meaning: string;
    jlpt: string;
    strokeCount: number;
    category: string | null;
}

export function stableHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return hash;
}

export function tokenizeMeaning(meaning: string): Set<string> {
    return new Set(
        meaning
            .toLowerCase()
            .replace(/[^a-z0-9,\s/-]/g, " ")
            .split(/[\s,/-]+/)
            .map((t) => t.trim())
            .filter((t) => t.length >= 2)
    );
}

// Small words two unrelated meanings can share ("the", "of", "to").
const STOP_WORDS = new Set(["an", "as", "at", "be", "by", "in", "is", "it", "of", "on", "or", "to", "up", "and", "for", "one", "out", "the", "with"]);

/** The content words of a meaning: tokenizeMeaning without small function words. */
function contentWords(meaning: string): Set<string> {
    return new Set([...tokenizeMeaning(meaning)].filter((token) => !STOP_WORDS.has(token)));
}

/** True when two meanings share a content word, so a learner could fairly pick either. */
export function sharesMeaning(a: string, b: string): boolean {
    const words = contentWords(a);
    for (const token of contentWords(b)) if (words.has(token)) return true;
    return false;
}

export function scoreDistractor(target: QuizCandidate, candidate: QuizCandidate): number {
    let score = 0;

    // 1) Same category: strongest signal for semantically similar context.
    if (candidate.category === target.category) score += 5;

    // 2) Same JLPT level: similar difficulty band.
    if (candidate.jlpt === target.jlpt) score += 3;

    // 3) Similar stroke complexity: keeps options feeling from same "family".
    const strokeDiff = Math.abs(candidate.strokeCount - target.strokeCount);
    if (strokeDiff <= 2) score += 2;
    else if (strokeDiff <= 4) score += 1;

    return score;
}

/** The target meaning plus `distractorCount` distractor meanings, in a stable per-kanji order. */
export function buildMeaningOptions(target: QuizCandidate, pool: QuizCandidate[], distractorCount = 3): string[] {
    const ranked = pool
        .filter((k) => k.char !== target.char && k.meaning !== target.meaning && !sharesMeaning(k.meaning, target.meaning))
        .map((candidate) => ({
            char: candidate.char,
            meaning: candidate.meaning,
            score: scoreDistractor(target, candidate),
        }))
        .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return stableHash(a.meaning + a.char) - stableHash(b.meaning + b.char);
        });

    const chosen: string[] = [];
    const used = new Set<string>();

    // Priority pick: best-scoring unique meanings.
    for (const item of ranked) {
        if (chosen.length === distractorCount) break;
        if (!used.has(item.meaning)) {
            chosen.push(item.meaning);
            used.add(item.meaning);
        }
    }

    const options = [target.meaning, ...chosen];

    // Stable order per kanji, but not always same position globally.
    return options.sort((a, b) => stableHash(a + target.char) - stableHash(b + target.char));
}
