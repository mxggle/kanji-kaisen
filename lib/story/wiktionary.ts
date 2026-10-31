// Parses the "Glyph origin" section of an English Wiktionary page (pure, no
// I/O). Finds the section under Chinese, Translingual or Japanese, reads the
// formation type and components from {{Han compound}} / {{liushu}}, and
// renders at most two plain sentences. Anything it can't render cleanly is
// left out rather than guessed. Content is CC BY-SA 4.0 (Wiktionary).

import { findTemplates, isTemplate, stripComments, type WikiTemplate } from "./wikitext.ts";

export type Formation = "pictogram" | "ideogram" | "ideogrammic-compound" | "phono-semantic-compound" | "other";

export interface EtymologyComponent {
    char: string;
    // The shape shown in the compound when it differs (水 is shown as 氵).
    form?: string;
    role?: "semantic" | "phonetic";
    gloss?: string;
}

export interface GlyphOrigin {
    section: "Chinese" | "Translingual" | "Japanese";
    formation: Formation | null;
    components: EtymologyComponent[];
    // At most two plain-English sentences, markup removed.
    text?: string;
}

export const FORMATION_LABELS: Record<Formation, { en: string; zh: string }> = {
    pictogram: { en: "Pictogram", zh: "象形" },
    ideogram: { en: "Ideogram", zh: "指事" },
    "ideogrammic-compound": { en: "Ideogrammic compound", zh: "會意" },
    "phono-semantic-compound": { en: "Phono-semantic compound", zh: "形聲" },
    other: { en: "Other", zh: "" },
};

const LIUSHU: Record<string, Formation> = {
    "1": "pictogram",
    p: "pictogram",
    "2": "ideogram",
    i: "ideogram",
    "3": "ideogrammic-compound",
    ic: "ideogrammic-compound",
    "4": "phono-semantic-compound",
    psc: "phono-semantic-compound",
    "5": "other",
    j: "other",
};

const LIUSHU_TEXT: Record<Formation, string> = {
    pictogram: "Pictogram (象形)",
    ideogram: "Ideogram (指事)",
    "ideogrammic-compound": "Ideogrammic compound (會意)",
    "phono-semantic-compound": "Phono-semantic compound (形聲)",
    other: "Jiajie (假借)",
};

const SECTION_ORDER = ["Chinese", "Translingual", "Japanese"] as const;

/** Bodies of the "Glyph origin" sections, in language preference order. */
export function findGlyphOriginSections(wikitext: string): { section: GlyphOrigin["section"]; body: string }[] {
    const text = stripComments(wikitext);
    const languages = new Map<string, string>();
    const heads = [...text.matchAll(/^==\s*([^=][^\n]*?)\s*==\s*$/gm)];
    heads.forEach((m, i) => {
        const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
        if (!languages.has(m[1])) languages.set(m[1], text.slice((m.index ?? 0) + m[0].length, end));
    });
    const found: { section: GlyphOrigin["section"]; body: string }[] = [];
    for (const section of SECTION_ORDER) {
        const body = languages.get(section);
        if (!body) continue;
        const m = /^(={3,})\s*Glyph origin\s*\1\s*$/m.exec(body);
        if (!m) continue;
        const rest = body.slice((m.index ?? 0) + m[0].length);
        const next = /^=+[^=\n].*=+\s*$/m.exec(rest);
        found.push({ section, body: (next ? rest.slice(0, next.index) : rest).trim() });
    }
    return found;
}

// ------------------------------------------------------------- rendering

class Unrenderable extends Error {}

const cleanTerm = (term: string) =>
    term
        .replace(/^\*|\*$/g, "")
        .split("/")[0]
        .replace(/\[\[|\]\]/g, "")
        .trim();

const quoteGloss = (gloss: string | undefined) => (gloss ? ` (“${gloss}”)` : "");

// Templates rendered as nothing: tables of forms, references, maintenance.
const SILENT = [
    "Han etym",
    "Han etyl",
    "zh-forms",
    "och-pron",
    "rfe",
    "rfv-etym",
    "attention",
    "zh-ref",
    "zh-cat",
    "ref",
    "multiple images",
    "Han ref",
    "zh-see",
    "-",
    "nbsp",
    "R:zh:Schuessler",
    "character info",
    "also",
];

const LANGUAGE_NAMES: Record<string, string> = { ja: "Japanese", ko: "Korean", vi: "Vietnamese" };

function renderComponent(t: WikiTemplate, i: number): string {
    const role = t.params[`c${i}`] === "p" ? "phonetic " : t.params[`c${i}`] === "s" ? "semantic " : "";
    const abbreviated = t.params[`abb${i}`] ? "abbreviated " : "";
    const shown = cleanTerm(t.params[`alt${i}`] || t.params[String(i)]);
    return `${abbreviated}${role}${shown}${quoteGloss(t.params[`t${i}`])}`;
}

function liushuText(code: string | undefined, nocap: boolean): string {
    const formation = LIUSHU[(code ?? "").trim()];
    if (!formation) throw new Unrenderable("liushu");
    const label = LIUSHU_TEXT[formation];
    return nocap ? label.charAt(0).toLowerCase() + label.slice(1) : label;
}

function renderTemplate(t: WikiTemplate): string {
    const p = t.params;
    if (SILENT.some((name) => isTemplate(t, name)) || /^(r|cite)[:-]/i.test(t.name)) return "";
    if (isTemplate(t, "liushu")) return liushuText(p["1"], !!p.nocap);
    if (isTemplate(t, "Han compound")) {
        const parts = [1, 2, 3, 4, 5].filter((i) => p[String(i)]).map((i) => renderComponent(t, i));
        let head = "";
        if (p.ls) {
            head = liushuText(p.ls, !!p.nocap);
            if (p.ls2) head += ` and ${liushuText(p.ls2, true)}`;
            head += ": ";
        }
        return head + parts.join(" + ");
    }
    if (isTemplate(t, "zh-l", "zh-m", "zh-l-lite")) {
        const term = cleanTerm(p["1"] ?? "");
        if (!term) throw new Unrenderable(t.name);
        return term + quoteGloss(p.gloss || p.t || p["2"]);
    }
    if (isTemplate(t, "zh-etym-double", "zh-etym-triple")) {
        const term = cleanTerm(p["1"] ?? "");
        if (!term) throw new Unrenderable(t.name);
        const word = t.name === "zh-etym-double" ? "duplication" : "triplication";
        const label = p.nocap ? word : word.charAt(0).toUpperCase() + word.slice(1);
        return `${label} of ${term}${quoteGloss(p["2"])}`;
    }
    if (isTemplate(t, "och-l")) {
        const term = cleanTerm(p["1"] ?? "");
        if (!term) throw new Unrenderable(t.name);
        return term + quoteGloss(p.t || p.gloss || p["2"]);
    }
    if (isTemplate(t, "obor", "bor", "der")) {
        const from = LANGUAGE_NAMES[p["2"] ?? ""];
        const term = cleanTerm(p["3"] ?? "");
        if (!from || !term) throw new Unrenderable(t.name);
        const verb = t.name === "obor" ? "Orthographic borrowing from" : t.name === "bor" ? "Borrowed from" : "From";
        return `${verb} ${from} ${term}`;
    }
    if (isTemplate(t, "m", "l", "mention", "link", "m-self", "l-self", "ll", "l-lite", "m-lite")) {
        const term = cleanTerm(p["3"] || p["2"] || "");
        if (!term) throw new Unrenderable(t.name);
        return term + quoteGloss(p.t || p.gloss || p["4"]);
    }
    if (isTemplate(t, "w", "wikipedia", "wp")) return p["2"] || p["1"] || "";
    if (isTemplate(t, "gloss", "gl")) return `(${p["1"] ?? ""})`;
    if (isTemplate(t, "lang", "q", "qualifier", "i")) return t.name === "lang" ? p["2"] ?? "" : `(${p["1"] ?? ""})`;
    if (isTemplate(t, "Han simp")) return `Simplified from ${cleanTerm(p["1"] ?? "")}`;
    throw new Unrenderable(t.name);
}

const renderSafe = (line: string) => {
    try {
        return renderInline(line);
    } catch {
        return null;
    }
};

/** Renders a line of wikitext to plain text; throws Unrenderable on unknown markup. */
function renderInline(line: string): string {
    let out = "";
    let last = 0;
    for (const t of findTemplates(line)) {
        out += line.slice(last, t.start) + renderTemplate(t);
        last = t.end;
    }
    out += line.slice(last);
    out = out
        .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
        .replace(/\[(?:https?:)?\/\/\S+\s+([^\]]+)\]/g, "$1")
        .replace(/'''?/g, "")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Old Chinese reconstructions ("(OC *mɯːʔ)", "*mɯːʔ") are left out.
        .replace(/\s*\((?:OC|Old Chinese)\s+\*[^)]*\)/g, "")
        .replace(/,\s*OC\s+\*[^,)]*/g, "")
        .replace(/\(\s*\)/g, "")
        .replace(/\s+([,.;:])/g, "$1")
        .replace(/\s{2,}/g, " ")
        .trim();
    if (/[{}[\]|<>=]|\*\S/.test(out)) throw new Unrenderable("markup left");
    return out;
}

// Splits after ". " (or "! ", "? ") when the next sentence starts with a
// capital, a quote or a CJK char; keeps "c." and "e.g." inside sentences.
function sentences(text: string): string[] {
    const out: string[] = [];
    let start = 0;
    const re = /[.!?](?=\s+["“(]?[A-Z㐀-鿿])/g;
    for (const m of text.matchAll(re)) {
        const end = (m.index ?? 0) + 1;
        const piece = text.slice(start, end).trim();
        if (/\b(c|ca|cf|e\.g|i\.e|lit|vol|no|ed|approx)\.$/i.test(piece)) continue;
        out.push(piece);
        start = end;
    }
    const tail = text.slice(start).trim();
    if (tail) out.push(tail);
    return out;
}

const MAX_TEXT = 320;

/** Parses a glyph-origin section body into formation, components and text. */
export function parseGlyphOrigin(body: string, section: GlyphOrigin["section"] = "Chinese"): GlyphOrigin | null {
    const clean = stripComments(body)
        .replace(/<ref[^>]*\/>/g, "")
        .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, "")
        .replace(/\{\|[\s\S]*?\|\}/g, "");

    const templates = findTemplates(clean);
    const compound = templates.find((t) => isTemplate(t, "Han compound"));
    const liushu = templates.find((t) => isTemplate(t, "liushu"));
    let formation: Formation | null = null;
    if (compound?.params.ls) formation = LIUSHU[compound.params.ls.trim()] ?? null;
    else if (liushu) formation = LIUSHU[(liushu.params["1"] ?? "").trim()] ?? null;

    const components: EtymologyComponent[] = [];
    const repeated = templates.find((t) => isTemplate(t, "zh-etym-double", "zh-etym-triple"));
    if (!compound && repeated && cleanTerm(repeated.params["1"] ?? "")) {
        const c: EtymologyComponent = { char: cleanTerm(repeated.params["1"]) };
        if (repeated.params["2"]) c.gloss = repeated.params["2"];
        const n = repeated.name === "zh-etym-double" ? 2 : 3;
        for (let i = 0; i < n; i++) components.push({ ...c });
    }
    if (compound && !compound.params.lang) {
        for (const i of [1, 2, 3, 4, 5]) {
            const raw = compound.params[String(i)];
            if (!raw) continue;
            const c: EtymologyComponent = { char: cleanTerm(raw) };
            const alt = cleanTerm(compound.params[`alt${i}`] ?? "");
            if (alt && alt !== c.char) c.form = alt;
            const role = compound.params[`c${i}`];
            if (role === "s") c.role = "semantic";
            if (role === "p") c.role = "phonetic";
            const gloss = compound.params[`t${i}`] ? renderSafe(compound.params[`t${i}`]) : null;
            if (gloss) c.gloss = gloss;
            components.push(c);
        }
    }
    // Every component must be one character; otherwise none are kept.
    const oneChar = (x: string | undefined) => x === undefined || [...x].length === 1;
    if (!components.every((c) => oneChar(c.char) && oneChar(c.form))) components.length = 0;

    // Text: the opening paragraph of prose (lists, tables, images and "See
    // also" lines end it). When it opens with the {{liushu}} / {{Han
    // compound}} call, that part is already in formation and components, so
    // only the description after it is kept: "{{liushu|p}} – a tree: …" -> "A tree: …".
    const lines: string[] = [];
    for (const raw of clean.split("\n")) {
        const line = raw.trim();
        const onlySilent = line !== "" && findTemplates(line).length > 0 && renderSafe(line) === "";
        if (!line || onlySilent || /^\[\[(file|image):/i.test(line)) {
            if (lines.length && !onlySilent) break;
            continue;
        }
        if (/^([*#:;]|\{\|)|^see also\b/i.test(line)) {
            if (lines.length) break;
            continue;
        }
        lines.push(line);
    }
    let text: string | undefined;
    try {
        let paragraph = lines.join(" ");
        const lead = findTemplates(paragraph)[0];
        // Only when a dash, colon or full stop follows; "{{Han compound|…}},
        // which …" stays whole, or the remainder wouldn't be a sentence.
        if (
            lead &&
            lead.start === 0 &&
            (isTemplate(lead, "liushu") || isTemplate(lead, "Han compound")) &&
            /^\s*([–—:.-]|$)/.test(paragraph.slice(lead.end))
        ) {
            paragraph = paragraph.slice(lead.end);
        }
        const rendered = renderInline(paragraph)
            .replace(/^[\s–—:;,.-]+/, "")
            .replace(/\s+[–—]\s+/g, " – ");
        const kept = sentences(rendered)
            .filter((x) => !/^(see also|compare|cf\.)/i.test(x))
            .slice(0, 2);
        let joined = kept.join(" ");
        if (joined.length > MAX_TEXT) joined = kept[0] ?? "";
        if (joined && joined.length <= MAX_TEXT && /[A-Za-z]{3}/.test(joined)) {
            joined = joined.charAt(0).toUpperCase() + joined.slice(1);
            text = /[.!?)”]$/.test(joined) ? joined : `${joined}.`;
        }
    } catch (err) {
        if (!(err instanceof Unrenderable)) throw err;
    }

    if (!formation && !components.length && !text) return null;
    const out: GlyphOrigin = { section, formation, components };
    if (text) out.text = text;
    return out;
}

/**
 * Finds and parses the glyph origin of a page: the first section (Chinese,
 * Translingual, Japanese) that names a formation type, else the first that
 * gives anything clean; null when there is nothing.
 */
export function parseGlyphOriginPage(wikitext: string): GlyphOrigin | null {
    const parsed = findGlyphOriginSections(wikitext)
        .map(({ section, body }) => parseGlyphOrigin(body, section))
        .filter((o): o is GlyphOrigin => o !== null);
    return parsed.find((o) => o.formation) ?? parsed[0] ?? null;
}
