// Draws a share card (lib/share-card.ts model) on a 1080×1350 canvas and
// encodes it as PNG. Browser only; loaded with import() when the dialog opens.
// Everything drawn is same-origin (KanjiVG files, theme art), so the canvas
// is never tainted and toBlob works.

import { kanjivgFileName } from "@/lib/atlas/kanjivg-svg";
import {
    CARD_HEIGHT,
    CARD_PALETTE,
    CARD_WIDTH,
    MAX_CARD_BYTES,
    fitBounds,
    fitLines,
    fitList,
    fitText,
    inkWash,
    parseStrokePaths,
    posterize,
    partColor,
    partDashed,
    pathBounds,
    strokeIndexes,
    strokeStyles,
    type CardModel,
    type CardPart,
    type CardSkin,
    type Measure,
    type StrokeStyle,
} from "@/lib/share-card";

type Ctx = CanvasRenderingContext2D;
type Palette = (typeof CARD_PALETTE)[CardSkin];

interface Fonts {
    disp: string;
    jp: string;
    ui: string;
}

interface Assets {
    fonts: Fonts;
    /** The kanji's KanjiVG stroke paths, empty when the file is missing. */
    glyph: string[];
    /** Each equation part's own KanjiVG paths, or null to use its strokes from the glyph. */
    parts: (string[] | null)[];
    art: HTMLImageElement | null;
}

// Layout (px on the 1080×1350 card), after the Share-Card board.
const PAD = 80;
const RIGHT = CARD_WIDTH - PAD;
const GLYPH = { x: (CARD_WIDTH - 620) / 2, y: 170, size: 620, stroke: 4.4 };
const ROW_BOTTOM = 1150;
const FOOTER_LINE = 1200;
const FOOTER_MID = 1254;
const OP_WIDTH = 30;
const GAP = 22;
const MEANING_MIN_WIDTH = 280;
const PART_STROKE_PX = 5;

// Background darkening, top to bottom. It reaches full cover at 86% so the
// footer sits on flat colour, which also keeps the PNG small.
const SHADE_STOPS: [number, number][] = [
    [0, 0.55],
    [0.3, 0.2],
    [0.62, 0.75],
    [0.86, 1],
    [1, 1],
];

// Art per attempt: resolution, opacity (×0.6 in 墨, so ink strokes stay
// clear on paper) and posterize step. Each later attempt compresses better.
const ART_LEVELS = [
    { scale: 0.5, alpha: 0.62, step: 4 },
    { scale: 0.5, alpha: 0.55, step: 6 },
    { scale: 0.33, alpha: 0.45, step: 8 },
];
const INK_ART_ALPHA = 0.6;

const font = (style: string, size: number, family: string) => `${style} ${size}px ${family}`;

function readFonts(): Fonts {
    const css = getComputedStyle(document.documentElement);
    const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    return {
        disp: `${v("--font-disp", "'Cormorant Garamond'")}, Georgia, serif`,
        jp: `${v("--font-jp", "'Shippori Mincho B1'")}, "Hiragino Mincho ProN", "Yu Mincho", serif`,
        ui: `${v("--font-ui", "'Zen Kaku Gothic New'")}, "Hiragino Sans", "Yu Gothic", system-ui, sans-serif`,
    };
}

function timeout(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Loads the exact faces and unicode-range slices the card uses, then waits for document.fonts. */
async function loadFonts(fonts: Fonts, model: CardModel): Promise<void> {
    if (!("fonts" in document)) return;
    const parts = model.equation;
    const jpText = `${model.char}解${model.readings.join("")}${parts.map((p) => p.char).join("")}`;
    const uiText = `${parts.map((p) => p.gloss).join("")}${model.urlLabel}+=…`;
    const loads = [
        document.fonts.load(font("500", 40, fonts.disp), `${model.question.before}${model.question.after}meaning sound`),
        document.fonts.load(font("700", 92, fonts.disp), `${model.meaning}Kanji Kaisen`),
        document.fonts.load(font("800", 36, fonts.jp), jpText),
        document.fonts.load(font("600", 40, fonts.jp), model.char),
        document.fonts.load(font("400", 26, fonts.ui), uiText),
    ];
    // A slow or blocked font must not stop the card: fall back after 6 s.
    await Promise.race([Promise.allSettled(loads).then(() => document.fonts.ready), timeout(6000)]);
}

async function fetchPaths(char: string): Promise<string[] | null> {
    try {
        const res = await fetch(`/kanjivg/kanji/${kanjivgFileName(char)}`);
        if (!res.ok) return null;
        const paths = parseStrokePaths(await res.text());
        return paths.length ? paths : null;
    } catch {
        return null;
    }
}

async function loadImage(src: string): Promise<HTMLImageElement | null> {
    try {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        await img.decode();
        return img;
    } catch {
        return null;
    }
}

async function loadAssets(model: CardModel): Promise<Assets> {
    const fonts = readFonts();
    const [glyph, parts, art] = await Promise.all([
        fetchPaths(model.char),
        Promise.all(model.equation.map((p) => fetchPaths(p.char))),
        loadImage(model.art),
        loadFonts(fonts, model),
    ]);
    return { fonts, glyph: glyph ?? [], parts, art };
}

// --- Background ------------------------------------------------------------------

function drawBackground(ctx: Ctx, skin: CardSkin, pal: Palette, art: HTMLImageElement | null, level: (typeof ART_LEVELS)[number]) {
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    if (art && art.naturalWidth) {
        // object-fit: cover, drawn small first: a softer layer behind the text that compresses well.
        const w = Math.round(CARD_WIDTH * level.scale);
        const h = Math.round(CARD_HEIGHT * level.scale);
        const layer = document.createElement("canvas");
        layer.width = w;
        layer.height = h;
        const lctx = layer.getContext("2d");
        if (lctx) {
            const scale = Math.max(w / art.naturalWidth, h / art.naturalHeight);
            const sw = w / scale;
            const sh = h / scale;
            lctx.imageSmoothingQuality = "high";
            lctx.drawImage(art, (art.naturalWidth - sw) / 2, (art.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);
            if (skin === "ink") {
                const pixels = lctx.getImageData(0, 0, w, h);
                inkWash(pixels.data);
                lctx.putImageData(pixels, 0, 0);
            }
            ctx.save();
            ctx.globalAlpha = skin === "ink" ? level.alpha * INK_ART_ALPHA : level.alpha;
            // 墨: ink wash on paper, as `ink-art` does on the site.
            if (skin === "ink") ctx.globalCompositeOperation = "multiply";
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(layer, 0, 0, CARD_WIDTH, CARD_HEIGHT);
            ctx.restore();
        }
    }

    const shade = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
    for (const [stop, alpha] of SHADE_STOPS) shade.addColorStop(stop, `rgba(${pal.shade}, ${alpha})`);
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    const pixels = ctx.getImageData(0, 0, CARD_WIDTH, CARD_HEIGHT);
    posterize(pixels.data, level.step, pal.shade.split(",").map(Number) as [number, number, number]);
    ctx.putImageData(pixels, 0, 0);
}

// --- Strokes ---------------------------------------------------------------------

/**
 * Strokes KanjiVG paths (109×109 units) with the current transform, grouped
 * by style. Sound parts are dashed (rule 2); nothing glows (rule 5).
 */
function strokePaths(ctx: Ctx, paths: string[], styles: StrokeStyle[], lineWidth: number) {
    const groups = new Map<string, { style: StrokeStyle; paths: Path2D[] }>();
    paths.forEach((d, i) => {
        const style = styles[i] ?? styles[0];
        const key = `${style.color}|${style.dashed}`;
        const group = groups.get(key) ?? { style, paths: [] };
        group.paths.push(new Path2D(d));
        groups.set(key, group);
    });
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const { style, paths: list } of groups.values()) {
        ctx.strokeStyle = style.color;
        ctx.setLineDash(style.dashed ? [lineWidth * 1.6, lineWidth * 1.4] : []);
        for (const path of list) ctx.stroke(path);
    }
    ctx.setLineDash([]);
}

function drawGlyph(ctx: Ctx, model: CardModel, skin: CardSkin, pal: Palette, assets: Assets) {
    if (!assets.glyph.length) {
        // No KanjiVG file: set the kanji in the Japanese face instead.
        ctx.save();
        ctx.font = font("800", 520, assets.fonts.jp);
        ctx.fillStyle = skin === "night" ? model.color : pal.ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(model.char, CARD_WIDTH / 2, GLYPH.y + GLYPH.size / 2);
        ctx.restore();
        return;
    }
    const styles = strokeStyles(model, skin, assets.glyph.length);
    ctx.save();
    ctx.translate(GLYPH.x, GLYPH.y);
    ctx.scale(GLYPH.size / 109, GLYPH.size / 109);
    strokePaths(ctx, assets.glyph, styles, GLYPH.stroke);
    ctx.restore();
}

function drawPart(ctx: Ctx, part: CardPart, own: string[] | null, assets: Assets, skin: CardSkin, x: number, y: number, box: number) {
    const color = partColor(part, skin);
    const paths = own ?? strokeIndexes(part.strokes).map((i) => assets.glyph[i]).filter(Boolean);
    const bounds = pathBounds(paths);
    if (!bounds) {
        ctx.save();
        ctx.font = font("800", Math.round(box * 0.8), assets.fonts.jp);
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(part.char, x + box / 2, y + box / 2);
        ctx.restore();
        return;
    }
    const fit = fitBounds(bounds, box, { padding: PART_STROKE_PX, minExtent: 72 });
    ctx.save();
    ctx.translate(x + fit.x, y + fit.y);
    ctx.scale(fit.scale, fit.scale);
    strokePaths(ctx, paths, [{ color, dashed: partDashed(part) }], PART_STROKE_PX / fit.scale);
    ctx.restore();
}

// --- Text ------------------------------------------------------------------------

function measurer(ctx: Ctx, style: string, family: string): Measure {
    return (text, size) => {
        ctx.font = font(style, size, family);
        return ctx.measureText(text).width;
    };
}

function drawQuestion(ctx: Ctx, model: CardModel, pal: Palette, fonts: Fonts) {
    const { before, after } = model.question;
    const latin = measurer(ctx, "500", fonts.disp);
    const jp = measurer(ctx, "600", fonts.jp);
    const width = (size: number) => latin(before, size) + jp(model.char, size) + latin(after, size);
    let size = 40;
    while (size > 28 && width(size) > RIGHT - PAD) size -= 2;
    ctx.fillStyle = pal.ink2;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    let x = PAD;
    const y = 72 + size;
    for (const [text, measure, style, family] of [
        [before, latin, "500", fonts.disp],
        [model.char, jp, "600", fonts.jp],
        [after, latin, "500", fonts.disp],
    ] as const) {
        ctx.font = font(style, size, family);
        ctx.fillText(text, x, y);
        x += measure(text, size);
    }
}

/** The meaning (one or two lines) with the readings under it, in a box `width` wide. */
function drawAnswer(
    ctx: Ctx,
    model: CardModel,
    pal: Palette,
    fonts: Fonts,
    box: { x: number; width: number; center: number | null; meaning: [number, number]; readings: [number, number]; minTop: number },
) {
    const meaning = model.meaning
        ? fitLines(model.meaning, box.width, measurer(ctx, "700", fonts.disp), { max: box.meaning[0], min: box.meaning[1], maxLines: 2 })
        : { lines: [], size: 0 };
    const readings = model.readings.length
        ? fitList(model.readings, box.width, measurer(ctx, "800", fonts.jp), { max: box.readings[0], min: box.readings[1] })
        : null;

    const lineHeight = meaning.size * 0.92;
    const gap = meaning.lines.length && readings ? Math.round(meaning.size * 0.18) + 6 : 0;
    const height = meaning.lines.length * lineHeight + gap + (readings ? readings.size * 1.1 : 0);
    const preferred = box.center === null ? ROW_BOTTOM - height : box.center - height / 2;
    const top = Math.max(box.minTop, Math.min(preferred, ROW_BOTTOM + 10 - height));

    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = pal.ink;
    ctx.font = font("700", meaning.size, fonts.disp);
    meaning.lines.forEach((line, i) => ctx.fillText(line, box.x, top + i * lineHeight + meaning.size * 0.78));
    if (readings) {
        ctx.font = font("800", readings.size, fonts.jp);
        ctx.fillText(readings.text, box.x, top + meaning.lines.length * lineHeight + gap + readings.size * 0.92);
    }
}

function drawOperator(ctx: Ctx, text: string, x: number, y: number, pal: Palette, fonts: Fonts) {
    ctx.font = font("400", 48, fonts.ui);
    ctx.fillStyle = pal.ink3;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + OP_WIDTH / 2, y);
}

/** Parts + … = meaning, readings. */
function drawEquation(ctx: Ctx, model: CardModel, skin: CardSkin, pal: Palette, assets: Assets) {
    const { fonts } = assets;
    const parts = model.equation;
    const n = parts.length;
    const box = n >= 3 ? 104 : 120;
    const more = model.hiddenParts > 0;
    // Items in the row: parts, the pluses between them, "+ …" for hidden parts, then "=".
    const ops = n - 1 + (more ? 2 : 0) + 1;
    const items = n + ops;
    const colMax = Math.max(box, Math.min(190, Math.floor((RIGHT - PAD - MEANING_MIN_WIDTH - ops * OP_WIDTH - items * GAP) / n)));

    const glossMeasure = measurer(ctx, "400", fonts.ui);
    const labelMeasure = measurer(ctx, "500", fonts.disp);
    const columns = parts.map((part) => {
        const gloss = part.gloss ? fitText(part.gloss, colMax, glossMeasure, { max: 26, min: 18 }) : null;
        const label = part.roleLabel ? fitText(part.roleLabel, colMax, labelMeasure, { max: 24, min: 18 }) : null;
        const width = Math.min(
            colMax,
            Math.max(box, gloss ? glossMeasure(gloss.text, gloss.size) : 0, label ? labelMeasure(label.text, label.size) : 0),
        );
        return { part, gloss, label, width };
    });

    const hasLabels = columns.some((c) => c.label);
    const height = box + 12 + 32 + (hasLabels ? 30 : 0);
    const top = ROW_BOTTOM - height;
    const center = top + box / 2;
    const glossY = top + box + 12 + 24;
    const labelY = glossY + 32;

    let x = PAD;
    columns.forEach((col, i) => {
        if (i > 0) {
            drawOperator(ctx, "+", x, center, pal, fonts);
            x += OP_WIDTH + GAP;
        }
        drawPart(ctx, col.part, assets.parts[i], assets, skin, x + (col.width - box) / 2, top, box);
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        if (col.gloss) {
            ctx.font = font("400", col.gloss.size, fonts.ui);
            ctx.fillStyle = pal.ink2;
            ctx.fillText(col.gloss.text, x + col.width / 2, glossY);
        }
        if (col.label) {
            ctx.font = font("500", col.label.size, fonts.disp);
            ctx.fillStyle = partColor(col.part, skin);
            ctx.fillText(col.label.text, x + col.width / 2, labelY);
        }
        x += col.width + GAP;
    });
    if (more) {
        drawOperator(ctx, "+", x, center, pal, fonts);
        x += OP_WIDTH + GAP;
        drawOperator(ctx, "…", x, center, pal, fonts);
        x += OP_WIDTH + GAP;
    }
    drawOperator(ctx, "=", x, center, pal, fonts);
    x += OP_WIDTH + GAP;

    drawAnswer(ctx, model, pal, fonts, {
        x,
        width: RIGHT - x,
        center,
        meaning: [92, 44],
        readings: [36, 24],
        minTop: top - 60,
    });
}

function drawFooter(ctx: Ctx, model: CardModel, pal: Palette, fonts: Fonts) {
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, FOOTER_LINE + 0.5);
    ctx.lineTo(RIGHT, FOOTER_LINE + 0.5);
    ctx.stroke();

    // 解 seal, as in the header.
    const seal = 52;
    const sealTop = FOOTER_MID - seal / 2;
    ctx.strokeStyle = pal.ink2;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(PAD + 0.75, sealTop + 0.75, seal - 1.5, seal - 1.5);
    ctx.fillStyle = pal.ink;
    ctx.font = font("800", 30, fonts.jp);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("解", PAD + seal / 2, FOOTER_MID + 1);

    const brandX = PAD + seal + 16;
    ctx.font = font("700", 36, fonts.disp);
    ctx.textAlign = "left";
    ctx.fillText("Kanji Kaisen", brandX, FOOTER_MID);
    const brandWidth = ctx.measureText("Kanji Kaisen").width;

    const url = fitText(model.urlLabel, RIGHT - (brandX + brandWidth + 32), measurer(ctx, "400", fonts.ui), { max: 24, min: 18 });
    ctx.font = font("400", url.size, fonts.ui);
    ctx.fillStyle = pal.ink2;
    ctx.textAlign = "right";
    ctx.fillText(url.text, RIGHT, FOOTER_MID);
}

function draw(ctx: Ctx, model: CardModel, skin: CardSkin, assets: Assets, level: (typeof ART_LEVELS)[number]) {
    const pal = CARD_PALETTE[skin];
    ctx.save();
    drawBackground(ctx, skin, pal, assets.art, level);
    drawQuestion(ctx, model, pal, assets.fonts);
    drawGlyph(ctx, model, skin, pal, assets);
    if (model.equation.length) {
        drawEquation(ctx, model, skin, pal, assets);
    } else {
        drawAnswer(ctx, model, pal, assets.fonts, {
            x: PAD,
            width: RIGHT - PAD,
            center: null,
            meaning: [120, 56],
            readings: [48, 28],
            minTop: GLYPH.y + GLYPH.size + 10,
        });
    }
    drawFooter(ctx, model, pal, assets.fonts);
    ctx.restore();
}

function toPng(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The card could not be encoded."))), "image/png");
    });
}

/**
 * Draws the card and returns it as a PNG under MAX_CARD_BYTES when possible
 * (each retry softens the art, which is what costs bytes).
 */
export async function renderShareCard(model: CardModel, skin: CardSkin): Promise<Blob> {
    const assets = await loadAssets(model);
    const canvas = document.createElement("canvas");
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available.");

    let blob: Blob | null = null;
    for (const level of ART_LEVELS) {
        ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
        draw(ctx, model, skin, assets, level);
        blob = await toPng(canvas);
        if (blob.size <= MAX_CARD_BYTES) break;
    }
    return blob as Blob;
}
