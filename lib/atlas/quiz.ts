// Meaning multiple-choice options with "plausible" distractors: same theme,
// same JLPT level, similar stroke count and overlapping meaning words rank
// highest. Shared by the classic practice quiz and /study.

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

function overlapCount(a: Set<string>, b: Set<string>): number {
    let count = 0;
    a.forEach((token) => {
        if (b.has(token)) count += 1;
    });
    return count;
}

export function scoreDistractor(target: QuizCandidate, candidate: QuizCandidate): number {
    const targetTokens = tokenizeMeaning(target.meaning);
    const candidateTokens = tokenizeMeaning(candidate.meaning);

    let score = 0;

    // 1) Same category: strongest signal for semantically similar context.
    if (candidate.category === target.category) score += 5;

    // 2) Same JLPT level: similar difficulty band.
    if (candidate.jlpt === target.jlpt) score += 3;

    // 3) Similar stroke complexity: keeps options feeling from same "family".
    const strokeDiff = Math.abs(candidate.strokeCount - target.strokeCount);
    if (strokeDiff <= 2) score += 2;
    else if (strokeDiff <= 4) score += 1;

    // 4) Meaning token overlap: direct semantic closeness.
    score += overlapCount(targetTokens, candidateTokens) * 4;

    return score;
}

/** The target meaning plus `distractorCount` distractor meanings, in a stable per-kanji order. */
export function buildMeaningOptions(target: QuizCandidate, pool: QuizCandidate[], distractorCount = 3): string[] {
    const ranked = pool
        .filter((k) => k.char !== target.char && k.meaning !== target.meaning)
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
