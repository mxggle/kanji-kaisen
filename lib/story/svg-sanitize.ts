// Sanitises an ancient-form SVG from Wikimedia Commons for self-hosting
// (pure, no DOM). Keeps only plain shapes and groups, drops scripts, event
// handlers, metadata, foreign elements, styles and every external reference,
// makes the viewBox square, rounds numbers and paints ink with currentColor so
// the glyph can be used as a CSS mask or inline in the accent colour.

export interface SanitizedSvg {
    svg: string;
    viewBox: [number, number, number, number];
    shapes: number;
    // Element names that were dropped (with their content), for reporting.
    dropped: string[];
}

export type SanitizeFailure = "not-svg" | "malformed" | "no-shapes" | "white-fill" | "bad-viewbox";

interface Node {
    name: string;
    attrs: Record<string, string>;
    children: Node[];
}

const SHAPES = new Set(["path", "polygon", "polyline", "rect", "circle", "ellipse", "line"]);
const CONTAINERS = new Set(["svg", "g"]);

const GEOMETRY: Record<string, string[]> = {
    path: ["d"],
    polygon: ["points"],
    polyline: ["points"],
    rect: ["x", "y", "width", "height", "rx", "ry"],
    circle: ["cx", "cy", "r"],
    ellipse: ["cx", "cy", "rx", "ry"],
    line: ["x1", "y1", "x2", "y2"],
};

// Paint properties resolved per shape (presentation attribute or style).
const PAINT = [
    "fill",
    "fill-rule",
    "fill-opacity",
    "stroke",
    "stroke-width",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-miterlimit",
    "stroke-opacity",
    "opacity",
    "display",
    "visibility",
] as const;
type Paint = Partial<Record<(typeof PAINT)[number], string>>;
const INHERITED = new Set(PAINT.filter((p) => p !== "opacity" && p !== "display"));

const NUMBER = /^-?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?(px)?$/i;
const SAFE_VALUE = /^[#\w.,%\s()-]*$/;

function decodeEntities(value: string): string {
    return value
        .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
        .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&");
}

function parse(raw: string): Node | null {
    const text = raw
        .replace(/<\?[\s\S]*?\?>/g, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "")
        .replace(/<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>/gi, "");
    const tag = /<(\/?)([A-Za-z_][\w:.-]*)((?:\s+[^\s=/>]+\s*=\s*(?:"[^"]*"|'[^']*'))*)\s*(\/?)>/g;
    const attr = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    const root: Node = { name: "#root", attrs: {}, children: [] };
    const stack: Node[] = [root];
    let last = 0;
    for (const m of text.matchAll(tag)) {
        // Anything between tags other than text means the markup is malformed.
        if (/</.test(text.slice(last, m.index))) return null;
        last = (m.index ?? 0) + m[0].length;
        const [, closing, name, attrText, selfClosing] = m;
        if (closing) {
            const top = stack.pop();
            if (!top || top.name !== name) return null;
            continue;
        }
        const node: Node = { name, attrs: {}, children: [] };
        for (const a of attrText.matchAll(attr)) node.attrs[a[1]] = decodeEntities(a[2] ?? a[3] ?? "");
        stack[stack.length - 1].children.push(node);
        if (!selfClosing) stack.push(node);
    }
    if (stack.length !== 1 || /</.test(text.slice(last))) return null;
    const elements = root.children;
    return elements.length === 1 ? elements[0] : null;
}

function readPaint(node: Node): Paint {
    const paint: Paint = {};
    for (const p of PAINT) if (node.attrs[p] !== undefined) paint[p] = node.attrs[p].trim();
    for (const decl of (node.attrs.style ?? "").split(";")) {
        const i = decl.indexOf(":");
        if (i === -1) continue;
        const prop = decl.slice(0, i).trim().toLowerCase() as (typeof PAINT)[number];
        if ((PAINT as readonly string[]).includes(prop)) paint[prop] = decl.slice(i + 1).trim().replace(/\s*!important$/, "");
    }
    return paint;
}

const NAMED: Record<string, string> = { black: "#000000", white: "#ffffff" };

// "none", "ink" (anything dark or coloured) or "paper" (white or near white).
function tone(value: string | undefined): "none" | "ink" | "paper" | undefined {
    if (value === undefined || value === "inherit") return undefined;
    const v = value.trim().toLowerCase();
    if (v === "none" || v === "transparent") return "none";
    const hex = NAMED[v] ?? v;
    let rgb: number[] | null = null;
    const h = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(hex);
    if (h) {
        const s = h[1].length === 3 ? [...h[1]].map((c) => c + c).join("") : h[1];
        rgb = [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
    }
    const r = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/.exec(v);
    if (r) rgb = [Number(r[1]), Number(r[2]), Number(r[3])];
    if (!rgb) return "ink";
    const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
    return luminance > 0.85 ? "paper" : "ink";
}

function roundTo(n: number, decimals: number): string {
    const s = Number(n.toFixed(decimals)).toString();
    return s === "-0" ? "0" : s.replace(/^(-?)0\./, "$1.");
}

function minifyNumbers(list: string, decimals: number): string | null {
    const nums = list.match(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi);
    if (!nums || list.replace(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?|[\s,]/gi, "") !== "") return null;
    return joinNumbers(nums.map((n) => roundTo(Number(n), decimals)));
}

function joinNumbers(nums: string[]): string {
    let out = "";
    for (const n of nums) {
        if (out === "" || n.startsWith("-") || (n.startsWith(".") && /\.\d*$/.test(out.split(/[\s-]/).pop() ?? ""))) {
            out += n;
        } else {
            out += " " + n;
        }
    }
    return out;
}

/** Rounds and compacts path data; returns null when it isn't valid path data. */
export function minifyPathData(d: string, decimals: number): string | null {
    const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi);
    if (!tokens || d.replace(/[MmLlHhVvCcSsQqTtAaZz]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?|[\s,]/gi, "") !== "") {
        return null;
    }
    if (!/^[Mm]$/.test(tokens[0])) return null;
    // Arc flags may be written without separators ("a5 5 0 011 1"); leave arcs
    // as they are rather than risk misreading them.
    if (tokens.some((t) => /^[Aa]$/.test(t))) return d.replace(/\s+/g, " ").trim();
    let out = "";
    let run: string[] = [];
    const flush = () => {
        if (run.length) out += joinNumbers(run);
        run = [];
    };
    for (const t of tokens) {
        if (/^[A-Za-z]$/.test(t)) {
            flush();
            out += t;
        } else {
            run.push(roundTo(Number(t), decimals));
        }
    }
    flush();
    return out;
}

const TRANSFORM = /^(\s*(matrix|translate|scale|rotate|skewX|skewY)\s*\([-\d.,\se]*\)\s*,?)+$/i;

function minifyTransform(value: string): string | null {
    if (!TRANSFORM.test(value)) return null;
    return value
        .replace(/-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi, (n) => roundTo(Number(n), 4))
        .replace(/\s*,\s*/g, ",")
        .replace(/\s+/g, " ")
        .trim();
}

const escapeAttr = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

interface Context {
    decimals: number;
    viewBox: [number, number, number, number];
    dropped: Set<string>;
    shapes: number;
    paper: boolean;
}

// A white shape covering most of the canvas is a background and can go.
function isBackground(node: Node, ctx: Context): boolean {
    if (node.name !== "rect") return false;
    const [, , w, h] = ctx.viewBox;
    const width = parseFloat(node.attrs.width ?? "");
    const height = parseFloat(node.attrs.height ?? "");
    const percent = (v: string | undefined) => (v ?? "").trim().endsWith("%") && parseFloat(v ?? "") >= 90;
    return (width >= 0.9 * w || percent(node.attrs.width)) && (height >= 0.9 * h || percent(node.attrs.height));
}

function render(node: Node, inherited: Paint, ctx: Context): string {
    const name = node.name;
    if (!SHAPES.has(name) && !CONTAINERS.has(name)) {
        ctx.dropped.add(name);
        return "";
    }
    const own = readPaint(node);
    if (own.display === "none" || own.visibility === "hidden" || own.opacity === "0") return "";
    const paint: Paint = {};
    for (const p of INHERITED) {
        const v = own[p] ?? inherited[p];
        if (v !== undefined && v !== "inherit") paint[p] = v;
    }

    const attrs: string[] = [];
    if (node.attrs.transform !== undefined) {
        const t = minifyTransform(node.attrs.transform);
        if (t === null) return "";
        if (t) attrs.push(`transform="${escapeAttr(t)}"`);
    }
    const opacity = own.opacity && NUMBER.test(own.opacity) ? Number(own.opacity) : 1;
    if (opacity < 1) attrs.push(`opacity="${roundTo(opacity, 2)}"`);

    if (CONTAINERS.has(name)) {
        const inner = node.children.map((child) => render(child, paint, ctx)).join("");
        if (!inner) return "";
        return attrs.length ? `<g ${attrs.join(" ")}>${inner}</g>` : inner;
    }

    for (const key of GEOMETRY[name]) {
        const value = node.attrs[key];
        if (value === undefined) continue;
        let out: string | null;
        if (key === "d") out = minifyPathData(value, ctx.decimals);
        else if (key === "points") out = minifyNumbers(value, ctx.decimals);
        else out = NUMBER.test(value.trim()) ? roundTo(parseFloat(value), ctx.decimals) : null;
        if (out === null) return "";
        attrs.push(`${key}="${out}"`);
    }
    if (name === "path" && !node.attrs.d) return "";

    const fill = tone(paint.fill) ?? "ink";
    const stroke = tone(paint.stroke) ?? "none";
    const strokeWidth = paint["stroke-width"] && NUMBER.test(paint["stroke-width"]) ? parseFloat(paint["stroke-width"]) : 1;
    const strokes = stroke !== "none" && strokeWidth > 0;
    if (fill === "none" && !strokes) return "";
    if (fill === "paper" || (strokes && stroke === "paper")) {
        if (fill === "paper" && !strokes && isBackground(node, ctx)) return "";
        ctx.paper = true;
        return "";
    }

    if (fill === "none") attrs.push('fill="none"');
    else if (paint["fill-rule"] === "evenodd") attrs.push('fill-rule="evenodd"');
    if (fill === "ink" && paint["fill-opacity"] && NUMBER.test(paint["fill-opacity"]) && Number(paint["fill-opacity"]) < 1) {
        attrs.push(`fill-opacity="${roundTo(Number(paint["fill-opacity"]), 2)}"`);
    }
    if (strokes) {
        attrs.push('stroke="currentColor"', `stroke-width="${roundTo(strokeWidth, ctx.decimals)}"`);
        for (const p of ["stroke-linecap", "stroke-linejoin"] as const) {
            const v = paint[p];
            if (v && /^(round|square|butt|miter|bevel)$/.test(v)) attrs.push(`${p}="${v}"`);
        }
        const miter = paint["stroke-miterlimit"];
        if (miter && NUMBER.test(miter) && Number(miter) !== 4) attrs.push(`stroke-miterlimit="${roundTo(Number(miter), 2)}"`);
        const so = paint["stroke-opacity"];
        if (so && NUMBER.test(so) && Number(so) < 1) attrs.push(`stroke-opacity="${roundTo(Number(so), 2)}"`);
    }
    for (const a of attrs) if (!SAFE_VALUE.test(a.replace(/^[\w-]+="|"$/g, "")) && !a.startsWith("d=")) return "";
    ctx.shapes += 1;
    return `<${name} ${attrs.join(" ")}/>`;
}

function readViewBox(svg: Node): [number, number, number, number] | null {
    const vb = svg.attrs.viewBox ?? svg.attrs.viewbox;
    if (vb) {
        const n = vb.trim().split(/[\s,]+/).map(Number);
        if (n.length === 4 && n.every(Number.isFinite) && n[2] > 0 && n[3] > 0) return n as [number, number, number, number];
        return null;
    }
    const w = parseFloat(svg.attrs.width ?? "");
    const h = parseFloat(svg.attrs.height ?? "");
    if (w > 0 && h > 0 && !/%/.test(svg.attrs.width + svg.attrs.height)) return [0, 0, w, h];
    return null;
}

/**
 * Returns the sanitised SVG, or the reason it can't be used. Files that rely
 * on white shapes to cut holes are refused: they can't be drawn in one colour.
 */
export function sanitizeAncientSvg(raw: string): SanitizedSvg | { error: SanitizeFailure } {
    if (!/<svg[\s>]/.test(raw)) return { error: "not-svg" };
    const root = parse(raw);
    if (!root || root.name !== "svg") return { error: "malformed" };
    const box = readViewBox(root);
    if (!box) return { error: "bad-viewbox" };

    // Square viewBox centred on the original, so stages line up.
    const size = Math.max(box[2], box[3]);
    const decimals = Math.max(0, Math.min(3, Math.ceil(Math.log10(1000 / size))));
    const square: [number, number, number, number] = [
        Number(roundTo(box[0] - (size - box[2]) / 2, decimals)),
        Number(roundTo(box[1] - (size - box[3]) / 2, decimals)),
        Number(roundTo(size, decimals)),
        Number(roundTo(size, decimals)),
    ];
    const ctx: Context = { decimals, viewBox: box, dropped: new Set(), shapes: 0, paper: false };
    const rootPaint = readPaint(root);
    const inner = root.children.map((child) => render(child, rootPaint, ctx)).join("");
    if (ctx.paper) return { error: "white-fill" };
    if (!ctx.shapes) return { error: "no-shapes" };
    const viewBox = square.map((n) => roundTo(n, decimals)).join(" ");
    return {
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor">${inner}</svg>`,
        viewBox: square,
        shapes: ctx.shapes,
        dropped: [...ctx.dropped].sort(),
    };
}
