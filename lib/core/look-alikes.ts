// Pure look-alike detection from KanjiVG structure (lib/core/components.kanjivg.json).
//
// Two kanji look alike when their stroke counts differ by at most 2 and either
//   - they share components covering most of their strokes (待/持 share 寺), or
//   - both are small (6 strokes or fewer) and their stroke-type sequences
//     nearly match (土/士, 人/入, 日/目: KanjiVG does not split these into
//     components, but they are drawn with the same strokes). In bigger kanji a
//     matching stroke sequence is mostly chance, so it only breaks ties.

export interface ShapeInfo {
    char: string;
    strokeCount: number;
    /** First character of each stroke's KanjiVG type (㇐㇑㇒…), in stroke order. */
    types: string;
    /** Named elements at every depth, with their 1-based stroke numbers. */
    elements: { char: string; strokes: number[] }[];
    /** Start/end point of each stroke ([x0, y0, x1, y1], 109-unit box); small kanji only. */
    ends?: number[][];
}

export const MAX_STROKE_DIFFERENCE = 2;
export const MAX_LOOK_ALIKES = 6;
const COMPONENT_THRESHOLD = 0.6;
const LARGEST_SHARED_MIN = 0.4;
const TYPE_THRESHOLD = 0.8;
/** Above this many strokes a matching stroke sequence alone is not a look-alike. */
const TYPE_ONLY_MAX_STROKES = 6;
const GEOMETRY_THRESHOLD = 0.65;

/**
 * Share of strokes covered by components both kanji contain (largest shared
 * elements first, never counting a stroke twice), divided by the larger
 * stroke count. 待/持: 寺 covers 6 of 9 -> 0.67. `largest` is the share of the
 * biggest single shared element.
 */
export function componentOverlap(a: ShapeInfo, b: ShapeInfo): number {
    return sharedComponents(a, b).total;
}

function sharedComponents(a: ShapeInfo, b: ShapeInfo): { total: number; largest: number } {
    const usedA = new Set<number>();
    const usedB = new Set<number>();
    const candidates = a.elements
        .filter((e) => b.elements.some((f) => f.char === e.char))
        .sort((x, y) => y.strokes.length - x.strokes.length);
    let shared = 0;
    let largest = 0;
    for (const e of candidates) {
        if (e.strokes.some((s) => usedA.has(s))) continue;
        const match = b.elements.find((f) => f.char === e.char && !f.strokes.some((s) => usedB.has(s)));
        if (!match) continue;
        e.strokes.forEach((s) => usedA.add(s));
        match.strokes.forEach((s) => usedB.add(s));
        const size = Math.min(e.strokes.length, match.strokes.length);
        shared += size;
        largest = Math.max(largest, size);
    }
    const max = Math.max(a.strokeCount, b.strokeCount, 1);
    return { total: shared / max, largest: largest / max };
}

/**
 * Stroke-type similarity: the mean of the longest common subsequence (order
 * matters) and the multiset overlap (order ignored, so 右/石, which start with
 * different strokes, still match), each over the longer length.
 */
export function strokeTypeSimilarity(a: ShapeInfo, b: ShapeInfo): number {
    const x = [...a.types];
    const y = [...b.types];
    if (!x.length || !y.length) return 0;
    let previous = new Array<number>(y.length + 1).fill(0);
    for (let i = 1; i <= x.length; i++) {
        const row = new Array<number>(y.length + 1).fill(0);
        for (let j = 1; j <= y.length; j++) {
            row[j] = x[i - 1] === y[j - 1] ? previous[j - 1] + 1 : Math.max(previous[j], row[j - 1]);
        }
        previous = row;
    }
    const counts = new Map<string, number>();
    x.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1));
    let bag = 0;
    for (const t of y) {
        const n = counts.get(t) ?? 0;
        if (n > 0) {
            bag++;
            counts.set(t, n - 1);
        }
    }
    const longer = Math.max(x.length, y.length);
    return (previous[y.length] / longer + bag / longer) / 2;
}

const UNMATCHED_STROKE_COST = 40;
const OTHER_TYPE_COST = 15;

/** Stroke end points scaled to the glyph's own bounding box (0..100), so 日 and the taller 目 line up. */
function normalizedEnds(ends: number[][]): number[][] {
    const xs = ends.flatMap((p) => [p[0], p[2]]);
    const ys = ends.flatMap((p) => [p[1], p[3]]);
    const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
    const width = Math.max(Math.max(...xs) - minX, 1);
    const height = Math.max(Math.max(...ys) - minY, 1);
    return ends.map(([x0, y0, x1, y1]) => [
        ((x0 - minX) / width) * 100,
        ((y0 - minY) / height) * 100,
        ((x1 - minX) / width) * 100,
        ((y1 - minY) / height) * 100,
    ]);
}

/**
 * How closely the strokes sit, 0..1: strokes are paired greedily by distance
 * (mean start/end offset within the glyph's bounding box, plus a penalty for a
 * different stroke type); unpaired strokes cost the maximum. 1 when either has
 * no points.
 */
export function geometrySimilarity(a: ShapeInfo, b: ShapeInfo): number {
    if (!a.ends?.length || !b.ends?.length) return 1;
    const ta = [...a.types];
    const tb = [...b.types];
    const ea = normalizedEnds(a.ends);
    const eb = normalizedEnds(b.ends);
    const pairs: { i: number; j: number; cost: number }[] = [];
    ea.forEach((p, i) =>
        eb.forEach((q, j) => {
            const offset = (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) + Math.abs(p[2] - q[2]) + Math.abs(p[3] - q[3])) / 4;
            pairs.push({ i, j, cost: offset + (ta[i] === tb[j] ? 0 : OTHER_TYPE_COST) });
        }),
    );
    pairs.sort((x, y) => x.cost - y.cost || x.i - y.i || x.j - y.j);
    const usedA = new Set<number>();
    const usedB = new Set<number>();
    let total = 0;
    for (const { i, j, cost } of pairs) {
        if (usedA.has(i) || usedB.has(j)) continue;
        usedA.add(i);
        usedB.add(j);
        total += Math.min(cost, UNMATCHED_STROKE_COST);
    }
    const longer = Math.max(ea.length, eb.length);
    total += (longer - usedA.size) * UNMATCHED_STROKE_COST;
    return Math.max(0, 1 - total / longer / UNMATCHED_STROKE_COST);
}

/** 0 when the two are not look-alikes, else a similarity in (0, 1]. */
export function lookAlikeScore(a: ShapeInfo, b: ShapeInfo): number {
    if (a.char === b.char) return 0;
    const diff = Math.abs(a.strokeCount - b.strokeCount);
    if (diff > MAX_STROKE_DIFFERENCE) return 0;
    const { total: components, largest } = sharedComponents(a, b);
    // One kanji sitting whole inside a bigger one (木 in 休) is a building
    // block, not a look-alike, unless they differ by a single stroke (大/犬).
    const smaller = Math.min(a.strokeCount, b.strokeCount);
    const contained = components * Math.max(a.strokeCount, b.strokeCount) >= smaller;
    if (contained && diff >= 2) return 0;
    const types = strokeTypeSimilarity(a, b);
    // Shared components first (one of them big: 日 + 大 in 俺 and 春 is not a
    // look-alike); a matching stroke sequence adds a little.
    const componentMatch = components >= COMPONENT_THRESHOLD && largest > LARGEST_SHARED_MIN;
    let score = componentMatch ? Math.min(1, components + 0.1 * types) : 0;
    if (types >= TYPE_THRESHOLD && Math.max(a.strokeCount, b.strokeCount) <= TYPE_ONLY_MAX_STROKES) {
        const geometry = geometrySimilarity(a, b);
        if (geometry >= GEOMETRY_THRESHOLD) score = Math.max(score, ((types + geometry) / 2) * 0.95);
    }
    return score;
}

/**
 * Up to `limit` look-alikes for `target`, best first. `pool` is in the order
 * ties should keep (the atlas order: JLPT, then frequency).
 */
export function findLookAlikes(target: ShapeInfo, pool: ShapeInfo[], limit = MAX_LOOK_ALIKES): string[] {
    return pool
        .map((candidate, index) => ({ char: candidate.char, index, score: lookAlikeScore(target, candidate) }))
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .slice(0, limit)
        .map((c) => c.char);
}
