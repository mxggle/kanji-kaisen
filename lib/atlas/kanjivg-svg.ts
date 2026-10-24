// Pure KanjiVG helpers (no fs, no server-only) so they can be unit tested.
// `lib/atlas/kanjivg.ts` reads the files and calls these.

/** KanjiVG file name for a character: 海 -> `06d77.svg`. */
export function kanjivgFileName(char: string): string {
    const codePoint = char.codePointAt(0) ?? 0;
    return `${codePoint.toString(16).padStart(5, "0")}.svg`;
}

export interface StrokeDiagramOptions {
    // Accessible name, e.g. "Stroke order of 海".
    title: string;
    // Unique id for the <title> element (aria-labelledby).
    titleId: string;
}

const escapeXml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Turns a raw KanjiVG file into markup safe to inline in HTML on a dark page:
 * drops the XML prolog, DOCTYPE (with its internal subset), comments, ids and
 * `kvg:*` attributes; strokes use `currentColor` and numbers use the accent.
 * Returns null when the file doesn't look like a KanjiVG stroke file.
 */
export function toInlineStrokeSvg(raw: string, { title, titleId }: StrokeDiagramOptions): string | null {
    if (!/kvg:StrokePaths_/.test(raw) || !/<svg[\s>]/.test(raw)) return null;

    let svg = raw
        .replace(/<\?xml[\s\S]*?\?>/g, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>/g, "");

    // Restyle the two top-level groups before ids are stripped.
    svg = svg
        .replace(
            /<g id="kvg:StrokePaths_[^"]*"[^>]*>/,
            '<g fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">',
        )
        .replace(
            /<g id="kvg:StrokeNumbers_[^"]*"[^>]*>/,
            '<g font-size="8" style="fill:var(--accent)" font-family="sans-serif" aria-hidden="true">',
        );

    svg = svg
        .replace(/\s+kvg:[a-zA-Z]+="[^"]*"/g, "")
        .replace(/\s+id="[^"]*"/g, "")
        .replace(/>\s+</g, "><")
        .trim();

    // A faint dashed guide cross helps read stroke positions.
    const guides =
        '<g stroke="currentColor" stroke-opacity="0.15" stroke-width="0.5" stroke-dasharray="2 2" aria-hidden="true">' +
        '<line x1="54.5" y1="0" x2="54.5" y2="109"/><line x1="0" y1="54.5" x2="109" y2="54.5"/></g>';

    return svg.replace(
        /<svg[^>]*>/,
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 109 109" role="img" aria-labelledby="${escapeXml(titleId)}">` +
            `<title id="${escapeXml(titleId)}">${escapeXml(title)}</title>${guides}`,
    );
}

/** Number of strokes (`<path>` elements) in a raw KanjiVG file. */
export function countStrokes(raw: string): number {
    return (raw.match(/<path\b/g) ?? []).length;
}
