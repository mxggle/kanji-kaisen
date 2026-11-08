// Pure KanjiVG parsing for worksheets and the projector: stroke paths in
// order, plus which strokes belong to the radical. No DOM, so it runs in the
// Node test runner and in the browser.

export interface RadicalGroup {
    /** The component as drawn, e.g. 氵. */
    element: string;
    /** The full form when the element is a variant, e.g. 水 for 氵. */
    original: string | null;
    /** KanjiVG classification: general, tradit or nelson. */
    kind: string;
    /** Stroke indices (0-based). */
    strokes: number[];
}

export interface KanjiStrokes {
    /** SVG path data per stroke, in writing order (viewBox 0 0 109 109). */
    strokes: string[];
    radicals: RadicalGroup[];
}

export const KANJIVG_VIEWBOX = "0 0 109 109";

/** /kanjivg/kanji/06d77.svg for 海 (public, same-origin). */
export function kanjivgUrl(char: string): string {
    const codePoint = char.codePointAt(0) ?? 0;
    return `/kanjivg/kanji/${codePoint.toString(16).padStart(5, "0")}.svg`;
}

const TAG_RE = /<g\b([^>]*)>|<\/g>|<path\b([^>]*?)\/?>/g;
const ATTR_RE = /([\w:.-]+)="([^"]*)"/g;

function attributes(source: string): Record<string, string> {
    const result: Record<string, string> = {};
    for (const match of source.matchAll(ATTR_RE)) result[match[1]] = match[2];
    return result;
}

/** Strokes and radical groups from a raw KanjiVG file, or null if it has no stroke paths. */
export function parseKanjiVg(raw: string): KanjiStrokes | null {
    const start = raw.search(/<g id="kvg:StrokePaths_/);
    if (start === -1) return null;
    const end = raw.indexOf('<g id="kvg:StrokeNumbers_', start);
    const body = raw.slice(start, end === -1 ? undefined : end);

    const strokes: string[] = [];
    const radicals: RadicalGroup[] = [];
    // Open groups; radical groups carry their RadicalGroup entry.
    const stack: (RadicalGroup | null)[] = [];

    for (const match of body.matchAll(TAG_RE)) {
        if (match[0] === "</g>") {
            stack.pop();
        } else if (match[1] !== undefined) {
            const attrs = attributes(match[1]);
            const kind = attrs["kvg:radical"];
            const element = attrs["kvg:element"];
            if (kind && element) {
                // Split components (kvg:part 1, 2…) share one entry.
                let group = radicals.find((r) => r.element === element && r.kind === kind);
                if (!group) {
                    group = { element, original: attrs["kvg:original"] ?? null, kind, strokes: [] };
                    radicals.push(group);
                }
                stack.push(group);
            } else {
                stack.push(null);
            }
        } else {
            const d = attributes(match[2] ?? "").d;
            if (!d) continue;
            const index = strokes.length;
            strokes.push(d);
            for (const group of stack) if (group && !group.strokes.includes(index)) group.strokes.push(index);
        }
    }

    return strokes.length > 0 ? { strokes, radicals } : null;
}

const KIND_ORDER = ["general", "tradit", "nelson"];

/**
 * Stroke indices of the radical. Prefers the group matching the atlas
 * radical (by element or original form), then KanjiVG's general radical.
 */
export function radicalStrokes(parsed: KanjiStrokes | null, radicalChar?: string | null): number[] {
    if (!parsed || parsed.radicals.length === 0) return [];
    const byChar = radicalChar ? parsed.radicals.find((r) => r.element === radicalChar || r.original === radicalChar) : undefined;
    const byKind = [...parsed.radicals].sort((a, b) => rank(a.kind) - rank(b.kind))[0];
    return [...(byChar ?? byKind).strokes].sort((a, b) => a - b);
}

function rank(kind: string): number {
    const index = KIND_ORDER.indexOf(kind);
    return index === -1 ? KIND_ORDER.length : index;
}
