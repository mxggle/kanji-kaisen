// Minimal wikitext helpers (pure, no I/O): strip comments and find template
// calls with their parameters, the way MediaWiki splits them. Used by the
// Commons license filter and the Wiktionary glyph-origin parser.

export interface WikiTemplate {
    // Normalised name: no "Template:" prefix, underscores as spaces, single
    // spaces, first letter lower-cased (MediaWiki ignores its case).
    name: string;
    // Parameters keyed "1", "2", … for positional ones and by name otherwise.
    // Values are trimmed, as `{{#if:}}` and named parameters see them.
    params: Record<string, string>;
    // Offsets of `{{` and just past `}}` in the text that was searched.
    start: number;
    end: number;
}

/** Removes `<!-- … -->` comments (an unclosed one runs to the end). */
export function stripComments(text: string): string {
    return text.replace(/<!--[\s\S]*?(-->|$)/g, "");
}

export function normalizeTemplateName(raw: string): string {
    const name = raw
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^template\s*:\s*/i, "");
    return name.charAt(0).toLowerCase() + name.slice(1);
}

// Index just past the `}}` closing the `{{` at `open`, or -1.
function matchBraces(text: string, open: number): number {
    let depth = 0;
    let i = open;
    while (i < text.length) {
        if (text.startsWith("{{", i)) {
            depth += 1;
            i += 2;
        } else if (text.startsWith("}}", i)) {
            depth -= 1;
            i += 2;
            if (depth === 0) return i;
        } else {
            i += 1;
        }
    }
    return -1;
}

// Splits on `sep` where it is not nested inside {{…}} or [[…]].
function splitTopLevel(text: string, sep: string, limit = Infinity): string[] {
    const parts: string[] = [];
    let braces = 0;
    let links = 0;
    let last = 0;
    for (let i = 0; i < text.length; i++) {
        if (text.startsWith("{{", i)) {
            braces += 1;
            i += 1;
        } else if (text.startsWith("}}", i) && braces > 0) {
            braces -= 1;
            i += 1;
        } else if (text.startsWith("[[", i)) {
            links += 1;
            i += 1;
        } else if (text.startsWith("]]", i) && links > 0) {
            links -= 1;
            i += 1;
        } else if (text[i] === sep && braces === 0 && links === 0 && parts.length < limit) {
            parts.push(text.slice(last, i));
            last = i + 1;
        }
    }
    parts.push(text.slice(last));
    return parts;
}

function parseTemplateBody(body: string, start: number, end: number): WikiTemplate | null {
    const [rawName, ...rest] = splitTopLevel(body, "|");
    if (!rawName || rawName.trimStart().startsWith("#") || rawName.includes("{{")) return null;
    const params: Record<string, string> = {};
    let next = 1;
    for (const part of rest) {
        const [key, value] = splitTopLevel(part, "=", 1);
        if (value !== undefined && key.trim() !== "") {
            params[key.trim()] = value.trim();
        } else {
            params[String(next)] = part.trim();
            next += 1;
        }
    }
    return { name: normalizeTemplateName(rawName), params, start, end };
}

/**
 * Template calls in `text`, in order. Comments are removed first, so offsets
 * refer to the comment-free text. Nested calls are included after their
 * parent when `nested` is true. Parser functions (`{{#if:…}}`) and template
 * parameters (`{{{1}}}`) are skipped.
 */
export function findTemplates(text: string, { nested = false } = {}): WikiTemplate[] {
    const clean = stripComments(text);
    const found: WikiTemplate[] = [];
    let i = 0;
    while (i < clean.length) {
        const open = clean.indexOf("{{", i);
        if (open === -1) break;
        if (clean.startsWith("{{{", open)) {
            i = open + 3;
            continue;
        }
        const end = matchBraces(clean, open);
        if (end === -1) break;
        const body = clean.slice(open + 2, end - 2);
        const template = parseTemplateBody(body, open, end);
        if (template) {
            found.push(template);
            if (nested) {
                for (const value of Object.values(template.params)) {
                    if (value.includes("{{")) found.push(...findTemplates(value, { nested: true }));
                }
            }
        }
        i = end;
    }
    return found;
}

/** True when the template name matches one of `names` (normalised). */
export function isTemplate(template: WikiTemplate, ...names: string[]): boolean {
    return names.some((name) => normalizeTemplateName(name) === template.name);
}
