// Pure KanjiVG parser used by scripts/build-data-layers.mjs to derive
// lib/core/components.kanjivg.json (component parts, phonetic marks, stroke
// types). Works on the raw SVG text; only real `<g>` attributes are read, never
// the `<!ATTLIST ... kvg:phon ...>` declarations in the DTD.
//
// KanjiVG (c) Ulrich Apel, CC BY-SA 3.0, https://kanjivg.tagaini.net

export interface KvgNode {
    element?: string;
    original?: string;
    phon?: string;
    radical?: string;
    part?: string;
    /** 1-based stroke numbers of every path in this subtree. */
    strokes: number[];
    children: KvgNode[];
}

export interface KvgKanji {
    /** The kanji's own group (kvg:element is the kanji itself). */
    root: KvgNode;
    /** First character of each stroke's kvg:type, in stroke order. */
    types: string;
    /** Start and end point of each stroke ([x0, y0, x1, y1] in the 109×109 box), in stroke order. */
    ends: [number, number, number, number][];
    strokeCount: number;
}

/** A top-level part of a kanji: what a learner sees as a component. */
export interface KvgPart {
    char: string;
    /** 1-based stroke numbers, ascending. */
    strokes: number[];
    original?: string;
    /** kvg:radical value (general, tradit, nelson) when this part is marked as the radical. */
    radical?: string;
    /** Phonetic key (see phonKey) when KanjiVG marks this part as the sound component. */
    phon?: string;
}

const TAG_RE = /<g\b([^>]*)>|<\/g>|<path\b([^>]*?)\/?>/g;

const attr = (attrs: string, name: string): string | undefined =>
    attrs.match(new RegExp(`kvg:${name}="([^"]*)"`))?.[1];

function strokeNumber(attrs: string, fallback: number): number {
    const id = attrs.match(/\bid="[^"]*-s(\d+)"/)?.[1];
    return id ? Number(id) : fallback;
}

const NUMBER_RE = /-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g;
const ARGS: Record<string, number> = { m: 2, l: 2, c: 6, s: 4, q: 4, t: 2, h: 1, v: 1, z: 0 };

/** First and last point of an SVG path (KanjiVG uses M/m, C/c and S/s). */
export function pathEnds(d: string): [number, number, number, number] | null {
    let x = 0;
    let y = 0;
    let start: [number, number] | null = null;
    for (const [, command, argText] of d.matchAll(/([MmLlCcSsQqTtHhVvZz])([^MmLlCcSsQqTtHhVvZz]*)/g)) {
        const nums = (argText.match(NUMBER_RE) ?? []).map(Number);
        const lower = command.toLowerCase();
        const relative = command === lower;
        const size = ARGS[lower];
        if (size === 0) continue;
        for (let i = 0; i + size <= nums.length; i += size) {
            const args = nums.slice(i, i + size);
            if (lower === "h") x = relative ? x + args[0] : args[0];
            else if (lower === "v") y = relative ? y + args[0] : args[0];
            else {
                const nx = args[size - 2];
                const ny = args[size - 1];
                x = relative ? x + nx : nx;
                y = relative ? y + ny : ny;
            }
            if (!start) start = [x, y];
        }
    }
    return start ? [start[0], start[1], x, y] : null;
}

/** Parses the stroke-path tree of a KanjiVG SVG. Returns null when the file has no stroke paths. */
export function parseKanjiVG(svg: string): KvgKanji | null {
    const start = svg.indexOf('id="kvg:StrokePaths_');
    if (start === -1) return null;
    const end = svg.indexOf('id="kvg:StrokeNumbers_', start);
    const body = svg.slice(svg.lastIndexOf("<g", start), end === -1 ? undefined : svg.lastIndexOf("<g", end));

    const top: KvgNode = { strokes: [], children: [] };
    const stack: KvgNode[] = [top];
    const types: string[] = [];
    const ends: [number, number, number, number][] = [];
    let pathCount = 0;

    for (const match of body.matchAll(TAG_RE)) {
        const [tag, groupAttrs, pathAttrs] = match;
        const parent = stack[stack.length - 1];
        if (groupAttrs !== undefined) {
            const node: KvgNode = { strokes: [], children: [] };
            for (const name of ["element", "original", "phon", "radical", "part"] as const) {
                const value = attr(groupAttrs, name);
                if (value) node[name] = value;
            }
            parent.children.push(node);
            stack.push(node);
        } else if (tag === "</g>") {
            if (stack.length > 1) stack.pop();
        } else if (pathAttrs !== undefined) {
            pathCount++;
            const n = strokeNumber(pathAttrs, pathCount);
            for (const node of stack) node.strokes.push(n);
            types.push([...(attr(pathAttrs, "type") ?? "")][0] ?? "");
            ends.push(pathEnds(pathAttrs.match(/\bd="([^"]*)"/)?.[1] ?? "") ?? [0, 0, 0, 0]);
        }
    }

    // top -> StrokePaths group -> kanji group
    const root = top.children[0]?.children[0];
    if (!root || pathCount === 0) return null;
    return { root, types: types.join(""), ends, strokeCount: pathCount };
}

const HAN_CHAR = /^(\p{Script=Han})(?:[VT]|\d)*$/u;
const SINGLE_HAN = /^\p{Script=Han}$/u;

/**
 * Normalises a kvg:phon value to one phonetic character.
 *
 *   "毎" -> 毎, "叚V/反" -> 叚, "攸1" -> 攸, "⽛V" -> 牙 (Kangxi radical block -> unified)
 *
 * Composite descriptions ("厂+万", "3+6+1", "倍right") fall back to the group's
 * kvg:element when that is a single character, else null.
 */
export function phonKey(phon: string, element?: string): string | null {
    const first = phon.split("/")[0].trim();
    const match = first.match(HAN_CHAR);
    if (match) return match[1].normalize("NFKC");
    if (element && SINGLE_HAN.test(element)) return element.normalize("NFKC");
    return null;
}

function mergeStrokes(a: number[], b: number[]): number[] {
    return [...new Set([...a, ...b])].sort((x, y) => x - y);
}

/**
 * The kanji's top-level parts. Groups without an element are flattened into
 * their children unless they carry a phonetic mark (学's top half is the
 * phonetic 𦥯). Parts split by another part (kvg:part="1"/"2", e.g. 行 around 韋
 * in 衛) are merged into one part with both stroke ranges.
 */
export function topLevelParts(kanji: KvgKanji): KvgPart[] {
    const parts: KvgPart[] = [];
    const visit = (node: KvgNode) => {
        const phon = node.phon ? phonKey(node.phon, node.element) ?? undefined : undefined;
        const char = node.element ?? phon;
        if (!char) {
            node.children.forEach(visit);
            return;
        }
        const previous = node.part && Number(node.part) > 1 ? parts.find((p) => p.char === char) : undefined;
        if (previous) {
            previous.strokes = mergeStrokes(previous.strokes, node.strokes);
            if (node.radical && !previous.radical) previous.radical = node.radical;
            if (phon && !previous.phon) previous.phon = phon;
            return;
        }
        const part: KvgPart = { char, strokes: [...node.strokes].sort((a, b) => a - b) };
        if (node.original) part.original = node.original;
        if (node.radical) part.radical = node.radical;
        if (phon) part.phon = phon;
        parts.push(part);
    };
    kanji.root.children.forEach(visit);
    return parts;
}

/** Every named element below the root (nested included), split parts merged. */
export function allElements(kanji: KvgKanji): { char: string; strokes: number[] }[] {
    const out: { char: string; strokes: number[] }[] = [];
    const visit = (node: KvgNode) => {
        if (node.element) {
            const previous = node.part && Number(node.part) > 1
                ? out.findLast((e) => e.char === node.element)
                : undefined;
            if (previous) previous.strokes = mergeStrokes(previous.strokes, node.strokes);
            else out.push({ char: node.element, strokes: [...node.strokes].sort((a, b) => a - b) });
        }
        node.children.forEach(visit);
    };
    kanji.root.children.forEach(visit);
    return out;
}

/** The outermost phonetic mark (breadth-first, then document order), or null. */
export function phoneticOf(kanji: KvgKanji): string | null {
    let level = kanji.root.children;
    while (level.length) {
        for (const node of level) {
            const key = node.phon ? phonKey(node.phon, node.element) : null;
            if (key) return key;
        }
        level = level.flatMap((n) => n.children);
    }
    return null;
}

/** [1,2,3,7,8] -> "1-3,7-8" */
export function formatStrokeRanges(strokes: number[]): string {
    const ranges: string[] = [];
    let i = 0;
    while (i < strokes.length) {
        let j = i;
        while (j + 1 < strokes.length && strokes[j + 1] === strokes[j] + 1) j++;
        ranges.push(i === j ? `${strokes[i]}` : `${strokes[i]}-${strokes[j]}`);
        i = j + 1;
    }
    return ranges.join(",");
}

/** "1-3,7-8" -> [[1,3],[7,8]] */
export function parseStrokeRanges(text: string): [number, number][] {
    if (!text) return [];
    return text.split(",").map((range) => {
        const [a, b] = range.split("-").map(Number);
        return [a, b ?? a];
    });
}

/** "1-3,7-8" -> [1,2,3,7,8] */
export function expandStrokeRanges(text: string): number[] {
    return parseStrokeRanges(text).flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i));
}
