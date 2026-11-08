// Pure KanjiVG stroke helpers for the kanji page and the #learn layer
// (client-safe, no fs). Coordinates are KanjiVG's 109×109 box.

export interface Stroke {
    /** SVG path data. */
    d: string;
    /** KanjiVG stroke type (kvg:type), e.g. "㇔", "㇑a", "㇔/㇀"; "" when absent. */
    type: string;
}

const attr = (tag: string, name: string) => {
    const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`));
    return m ? m[1] : null;
};

/** The strokes of a raw KanjiVG file, in stroke order. [] when the file has none. */
export function extractStrokes(raw: string): Stroke[] {
    const found: { n: number; stroke: Stroke }[] = [];
    let order = 0;
    for (const m of raw.matchAll(/<path\b[^>]*>/g)) {
        const tag = m[0];
        const d = attr(tag, "d");
        if (!d) continue;
        const id = attr(tag, "id") ?? "";
        const n = Number(id.match(/-s(\d+)$/)?.[1] ?? NaN);
        order += 1;
        found.push({ n: Number.isFinite(n) ? n : order, stroke: { d: d.trim(), type: attr(tag, "kvg:type") ?? "" } });
    }
    return found.sort((a, b) => a.n - b.n).map((f) => f.stroke);
}

/**
 * Where KanjiVG puts each stroke's number (the text's left baseline, in its
 * 109 box), in stroke order. [] when the file has no numbers.
 */
export function extractStrokeNumbers(raw: string): { x: number; y: number }[] {
    const found: { n: number; x: number; y: number }[] = [];
    for (const m of raw.matchAll(/<text\b[^>]*transform="matrix\(1 0 0 1 (-?[\d.]+) (-?[\d.]+)\)"[^>]*>\s*(\d+)\s*<\/text>/g)) {
        found.push({ n: Number(m[3]), x: Number(m[1]), y: Number(m[2]) });
    }
    return found.sort((a, b) => a.n - b.n).map(({ x, y }) => ({ x, y }));
}

/** 1-based inclusive ranges ([[1, 3], [8, 8]]) -> 0-based indexes ([0, 1, 2, 7]). */
export function rangeIndexes(ranges: readonly (readonly [number, number])[], count = Infinity): number[] {
    const out = new Set<number>();
    for (const [from, to] of ranges) {
        for (let i = from; i <= to; i += 1) if (i >= 1 && i <= count) out.add(i - 1);
    }
    return [...out].sort((a, b) => a - b);
}

/** For each stroke, the index of the part that owns it (first wins), or null. */
export function strokeOwners(count: number, parts: readonly (readonly number[])[]): (number | null)[] {
    const owners: (number | null)[] = Array.from({ length: count }, () => null);
    parts.forEach((indexes, part) => {
        for (const i of indexes) if (i >= 0 && i < count && owners[i] === null) owners[i] = part;
    });
    return owners;
}

export interface Point {
    x: number;
    y: number;
}

/** End points (and control points) of a path, absolute. Enough for centroids and boxes. */
export function pathPoints(d: string): Point[] {
    const tokens = d.match(/[MmLlHhVvCcSsQqTtZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g) ?? [];
    const points: Point[] = [];
    let x = 0;
    let y = 0;
    let startX = 0;
    let startY = 0;
    let cmd = "";
    let i = 0;
    const num = () => Number(tokens[i++]);
    const isNum = () => i < tokens.length && !/^[A-Za-z]$/.test(tokens[i]);
    while (i < tokens.length) {
        if (/^[A-Za-z]$/.test(tokens[i])) cmd = tokens[i++];
        const rel = cmd === cmd.toLowerCase();
        switch (cmd.toUpperCase()) {
            case "M":
            case "L":
            case "T": {
                if (!isNum()) break;
                const nx = num();
                const ny = num();
                x = rel ? x + nx : nx;
                y = rel ? y + ny : ny;
                if (cmd.toUpperCase() === "M") {
                    startX = x;
                    startY = y;
                    // Further pairs after a moveto are linetos.
                    cmd = rel ? "l" : "L";
                }
                points.push({ x, y });
                continue;
            }
            case "H": {
                if (!isNum()) break;
                const n = num();
                x = rel ? x + n : n;
                points.push({ x, y });
                continue;
            }
            case "V": {
                if (!isNum()) break;
                const n = num();
                y = rel ? y + n : n;
                points.push({ x, y });
                continue;
            }
            case "C":
            case "S":
            case "Q": {
                if (!isNum()) break;
                const pairs = cmd.toUpperCase() === "C" ? 3 : 2;
                const bx = x;
                const by = y;
                for (let p = 0; p < pairs; p += 1) {
                    const px = num();
                    const py = num();
                    const ax = rel ? bx + px : px;
                    const ay = rel ? by + py : py;
                    points.push({ x: ax, y: ay });
                    if (p === pairs - 1) {
                        x = ax;
                        y = ay;
                    }
                }
                continue;
            }
            case "Z":
                x = startX;
                y = startY;
                break;
            default:
                break;
        }
        // Unknown command or stray token: skip it.
        if (i < tokens.length && !/^[A-Za-z]$/.test(tokens[i])) i += 1;
    }
    return points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

function centroid(points: readonly Point[]): Point | null {
    if (!points.length) return null;
    let sx = 0;
    let sy = 0;
    for (const p of points) {
        sx += p.x;
        sy += p.y;
    }
    return { x: sx / points.length, y: sy / points.length };
}

/**
 * How far to pull each part away from the whole for the "parts" stage of the
 * build animation: along the line from the glyph's centre to the part's
 * centre, `distance` units long. Parts that sit in the middle (囗 around 玉)
 * are spread side by side instead.
 */
export function partOffsets(paths: readonly string[], parts: readonly (readonly number[])[], distance = 16): Point[] {
    const all = centroid(paths.flatMap(pathPoints)) ?? { x: 54.5, y: 54.5 };
    const raw = parts.map((indexes) => {
        const c = centroid(indexes.flatMap((i) => (paths[i] ? pathPoints(paths[i]) : [])));
        return c ? { x: c.x - all.x, y: c.y - all.y } : { x: 0, y: 0 };
    });
    const spread = Math.max(...raw.map((p) => Math.hypot(p.x, p.y)), 0);
    if (spread < 6) {
        const mid = (parts.length - 1) / 2;
        return parts.map((_, k) => ({ x: Math.round((k - mid) * distance * 1.6), y: 0 }));
    }
    return raw.map((p) => {
        const len = Math.hypot(p.x, p.y);
        if (len < 1) return { x: 0, y: 0 };
        return { x: Math.round((p.x / len) * distance), y: Math.round((p.y / len) * distance) };
    });
}

// Plain-English names for the CJK strokes KanjiVG uses (Unicode CJK Strokes block).
const STROKE_NAMES: Record<string, string> = {
    "㇀": "a rising flick",
    "㇁": "a curved hook",
    "㇂": "a slanting hook",
    "㇃": "a long curve with a hook",
    "㇄": "down, then across",
    "㇅": "across, down, then across",
    "㇆": "across, then down with a hook",
    "㇇": "across, then a sweep left",
    "㇈": "across, down and round with a hook",
    "㇉": "down, across, down with a hook",
    "㇊": "across, down, then a flick up",
    "㇋": "across, down, across, then a sweep left",
    "㇌": "across, a sweep left, then a curved hook",
    "㇍": "across, then down and round",
    "㇎": "a zigzag",
    "㇏": "a sweep down to the right",
    "㇐": "a line across",
    "㇑": "a line down",
    "㇒": "a sweep down to the left",
    "㇓": "down, then a sweep left",
    "㇔": "a dot",
    "㇕": "across, then down",
    "㇖": "across with a hook",
    "㇗": "down, then across",
    "㇘": "down, a turn, then across",
    "㇙": "down, then a flick up",
    "㇚": "down with a hook",
    "㇛": "a sweep left that turns right",
    "㇜": "a sweep left, then across",
    "㇝": "a flat sweep to the right",
    "㇞": "down, across, then down",
    "㇟": "down, round, then a hook up",
    "㇠": "across, then a long curve with a hook",
    "㇡": "a zigzag with a hook",
    "㇢": "a sweep left with a hook",
    "㇣": "a circle",
};

/** "㇔/㇀" -> "a dot"; "" when unknown. */
export function strokeTypeName(type: string): string {
    const first = Array.from(type.trim())[0] ?? "";
    return STROKE_NAMES[first] ?? "";
}
