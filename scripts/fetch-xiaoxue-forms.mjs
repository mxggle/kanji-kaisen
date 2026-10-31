#!/usr/bin/env node
// Fills ancient-form stages (oracle bone, bronze, seal) that Wikimedia Commons
// leaves empty with glyphs taken directly from Academia Sinica 小學堂, and
// writes them into
//   lib/core/ancient-forms.json        files with provider "xiaoxue", plus stage slots
//   public/ancient/<hex>-<stage>.png   black-on-transparent glyph images
//
// Licence: glyph images (any resolution) and glyph attributes obtained through
// 小學堂's query interface are CC0 1.0, https://xiaoxue.iis.sinica.edu.tw/License/License.
// Commons files keep precedence: only empty shown stages are filled. Run after
// pnpm data:ancient (which keeps these fills when it rebuilds).
//
// Query interface: the 字形演變 (yanbian) viewer's own form,
//   POST https://xiaoxue.iis.sinica.edu.tw/yanbian/PageResult/PageResult  (EudcFontChar=<char>)
// returns an HTML fragment listing the char's glyphs in the site's order, each
// with its Sinica code (alt="&42.EA66;"), catalogue label and era, and an image
//   /ImageText2/ShowImage.ashx?text=<code point>&font=<font>&size=<pt>…
// which is requested at size IMAGE_SIZE. A person can open the same result at
//   https://xiaoxue.iis.sinica.edu.tw/yanbian?kaiOrder=<n>  (the site's own link form).
//
// Selection rule (deterministic; lib/story/xiaoxue.ts pickGlyphs):
//   oracle  the first glyph listed in a 甲骨文 font (中研院甲骨文重文…)
//   bronze  the first glyph listed in a 金文 font (中研院金文重文…)
//   seal    the 說文 small seal headword (北師大說文小篆, label 說文‧X部), else
//           說文篆文; 說文古文 and 籀文 are never used
// The glyph's Sinica code is recorded as `source`, its label and era as `ref`.
// The site may answer with a different 字頭 (亻 -> 人): the answer is used only
// when that 字頭 is one of the char's etymon candidates, or a private-use 字頭
// the site matched to the query (冫, 丨). A private-use 字頭 that another etymon
// candidate also maps to is recorded under that candidate (辶 -> 辵, 攵 -> 攴).
//
// Image processing is mechanical only (lib/story/xiaoxue.ts processGlyph):
// crop to the ink, alpha from luminance, scale down to ≤ 256 px on the long
// side, black on transparent, PNG. Nothing is redrawn, traced or invented. A
// glyph that looks empty or broken (tiny, almost no ink, or over 12 KB, which
// at 256 px only speckled rubbing scans reach) is dropped and the stage stays
// empty; the next listed glyph is not tried.
//
// Scope and lookups follow scripts/fetch-ancient-forms.mjs: the radical display
// chars by default, each under its etymon candidates (学 -> 學, 氵 -> 水) and the
// etymon Commons resolved, plus radical keys whose kanji belong to another
// Kangxi radical (月 nikuzuki -> 肉).
//
// Usage: pnpm data:xiaoxue [--scope radicals|top600|joyo] [--chars 木林] [--refresh] [--offline]
//   --chars    only (re)fill these display chars; other 小學堂 fills are kept
//   --refresh  re-query 小學堂 instead of using data-cache/xiaoxue
//   --offline  rebuild from data-cache only (no network)
// Raw responses are cached in the git-ignored data-cache/xiaoxue/. Downloaded
// content is treated as data: parsed, never executed.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { pathToFileURL } from "node:url";
import { buildScope, loadUnicode } from "./fetch-ancient-forms.mjs";
import { codePointHex, etymonCandidates } from "../lib/story/etymon.ts";
import {
    XIAOXUE_ABOUT,
    XIAOXUE_AUTHOR,
    XIAOXUE_ORIGIN,
    ANCIENT_RULE,
    ANCIENT_STAGES_NOTE,
    acceptedChar,
    applyFills,
    eraPeriod,
    glyphImageUrl,
    glyphProblem,
    glyphRef,
    hasStage,
    parseYanbian,
    pickGlyphs,
    processGlyph,
    providerFills,
    samePixels,
    samePrivateHead,
    stripProvider,
    xiaoxueFileName,
    yanbianPageUrl,
} from "../lib/story/xiaoxue.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, "data-cache", "xiaoxue");
const OUT_JSON = path.join(ROOT, "lib", "core", "ancient-forms.json");
const OUT_DIR = path.join(ROOT, "public", "ancient");
const ATLAS = path.join(ROOT, "lib", "atlas", "kanji-atlas.json");

const QUERY_URL = `${XIAOXUE_ORIGIN}/yanbian/PageResult/PageResult`;
const UA = "KanjiKaisen-data/1.0 (https://github.com/mxggle/kanji-kaisen)";
// At least a second between requests to the site.
const DELAY_MS = 1200;
// Point size the glyph image is requested at (≈ 512 px canvas), so the
// cropped glyph is scaled down, never up, to MAX_SIDE.
const IMAGE_SIZE = 384;
const MAX_SIDE = 256;
const SHOWN = ["oracle", "bronze", "seal"];

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const option = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : undefined);
const SCOPE = option("--scope") ?? "radicals";
const ONLY = option("--chars") ? new Set([...option("--chars")]) : null;
const REFRESH = flag("--refresh");
const OFFLINE = flag("--offline");

const today = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (file, fallback) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback);
const writeJson = (file, data) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 1) + "\n");
    fs.renameSync(`${file}.tmp`, file);
};
const sha1 = (buf) => crypto.createHash("sha1").update(buf).digest("hex");

// ---------------------------------------------------------------- network

let lastCall = 0;
let requests = 0;
async function politeFetch(url, init = {}) {
    for (let attempt = 0; ; attempt++) {
        const wait = lastCall + DELAY_MS - Date.now();
        if (wait > 0) await sleep(wait);
        lastCall = Date.now();
        requests++;
        let res;
        try {
            res = await fetch(url, { ...init, headers: { "User-Agent": UA, ...init.headers }, redirect: "error" });
        } catch (err) {
            if (attempt >= 5) throw err;
            console.warn(`  ${err.message}; retrying in ${2 * 2 ** attempt} s`);
            await sleep(2000 * 2 ** attempt);
            continue;
        }
        if (res.status === 429 || res.status >= 500) {
            if (attempt >= 6) throw new Error(`HTTP ${res.status} after retries: ${url}`);
            const retryAfter = Number(res.headers.get("retry-after")) || 0;
            const backoff = Math.max(retryAfter * 1000, 3000 * 2 ** attempt);
            console.warn(`  HTTP ${res.status}; backing off ${Math.round(backoff / 1000)} s`);
            await sleep(backoff);
            continue;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
        return res;
    }
}

const queryCacheFile = (char) => path.join(CACHE, "yanbian", `${codePointHex(char)}.html`);

/** The 字形演變 result for a char (cached raw HTML), parsed. */
const results = new Map();
async function query(char) {
    if (results.has(char)) return results.get(char);
    const file = queryCacheFile(char);
    if (REFRESH || !fs.existsSync(file)) {
        if (OFFLINE) throw new Error(`${char}: 小學堂 result not cached (offline)`);
        const body = new URLSearchParams({ ZiOrder: "", EudcFontChar: char, ImageSize: "36" });
        const res = await politeFetch(QUERY_URL, {
            method: "POST",
            body,
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
        });
        const html = await res.text();
        parseYanbian(html); // fail before caching a page we can't read
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, html);
    }
    const result = parseYanbian(fs.readFileSync(file, "utf8"));
    results.set(char, result);
    return result;
}

/** The glyph image as served (cached raw PNG). */
async function glyphImage(glyph) {
    const file = path.join(CACHE, "glyph", `${glyph.code}-${IMAGE_SIZE}.png`);
    if (REFRESH || !fs.existsSync(file)) {
        if (OFFLINE) throw new Error(`${glyph.code}: glyph image not cached (offline)`);
        const res = await politeFetch(glyphImageUrl(glyph.src, IMAGE_SIZE));
        const type = res.headers.get("content-type") ?? "";
        if (!type.startsWith("image/png")) throw new Error(`${glyph.code}: expected image/png, got ${type}`);
        const buf = Buffer.from(await res.arrayBuffer());
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, buf);
    }
    return fs.readFileSync(file);
}

// ---------------------------------------------------------------- main

async function main() {
    const previous = readJson(OUT_JSON);
    const base = stripProvider(previous, "xiaoxue");
    const unicode = loadUnicode();
    const { tiers, radicalOverrides, radicalChars } = buildScope(unicode, SCOPE);

    // Lookups as in fetch-ancient-forms.mjs; candidates also include the etymon
    // Commons resolved for the entry (冫 -> 仌 through a file redirect).
    const lookups = [];
    for (const char of tiers.keys()) {
        const c = etymonCandidates(char, unicode.data);
        if (c.ambiguous) continue;
        const candidates = [...new Set([...c.candidates, base.chars[char]?.etymon].filter(Boolean))];
        lookups.push({ table: "chars", key: char, display: char, candidates });
    }
    for (const [key, main] of Object.entries(radicalOverrides)) {
        const candidates = [...new Set([main, base.radicals[key]?.etymon].filter(Boolean))];
        lookups.push({ table: "radicals", key, display: main, candidates });
    }
    const selected = (l) => !ONLY || ONLY.has(l.display) || ONLY.has(l.key);

    const fills = [];
    const files = {};
    const srcOwner = new Map(); // src -> file name
    const dropped = []; // { code, char, stage, why }
    const rejectedHeads = new Map(); // query -> head code
    const processed = new Map(); // code -> { png, entry } | null

    async function fileFor(glyph, stage, char, result) {
        if (processed.has(glyph.code)) return processed.get(glyph.code);
        const served = await glyphImage(glyph);
        let out = null;
        let why;
        try {
            const g = processGlyph(served, MAX_SIDE);
            why = glyphProblem(g, served.length);
            if (!why) out = g;
        } catch (err) {
            why = err.message;
        }
        if (!out) {
            dropped.push({ code: glyph.code, char, stage, why });
            processed.set(glyph.code, null);
            return null;
        }
        const name = xiaoxueFileName(glyph.code);
        const src = `/ancient/${codePointHex(char)}-${stage}.png`;
        if (srcOwner.has(src) && srcOwner.get(src) !== name) {
            dropped.push({ code: glyph.code, char, stage, why: `${src} already holds ${srcOwner.get(src)}` });
            processed.set(glyph.code, null);
            return null;
        }
        srcOwner.set(src, name);
        const hash = sha1(served);
        const prev = previous.files[name];
        const entry = {
            stage,
            char,
            url: yanbianPageUrl(result.kaiOrder),
            imageUrl: glyphImageUrl(glyph.src, IMAGE_SIZE),
            author: XIAOXUE_AUTHOR,
            license: "CC0",
            source: `Academia Sinica 小學堂 ${glyph.code}`,
        };
        const ref = glyphRef(glyph);
        if (ref) entry.ref = ref;
        const period = stage === "seal" ? undefined : eraPeriod(glyph.era);
        if (period) entry.period = period;
        entry.provider = "xiaoxue";
        entry.fetched = prev?.provider === "xiaoxue" && prev.sha1 === hash ? prev.fetched : today;
        entry.sha1 = hash;
        entry.src = src;
        const value = { name, png: out.png, entry, size: `${out.width}×${out.height}` };
        processed.set(glyph.code, value);
        return value;
    }

    for (const lookup of lookups.filter(selected)) {
        for (const stage of SHOWN) {
            if (hasStage(base, lookup.table, lookup.key, stage)) continue;
            for (const candidate of lookup.candidates) {
                const result = await query(candidate);
                let char = acceptedChar(result, candidate, lookup.candidates);
                if (!char) {
                    if (result.head) rejectedHeads.set(candidate, result.head.code);
                    continue;
                }
                if (result.head.char === null) {
                    const heads = new Map();
                    for (const c of lookup.candidates) if (c !== candidate) heads.set(c, (await query(c)).head);
                    char = samePrivateHead(result, candidate, lookup.candidates, (c) => heads.get(c)) ?? char;
                }
                const glyph = pickGlyphs(result.glyphs)[stage];
                if (!glyph) continue;
                const file = await fileFor(glyph, stage, char, result);
                if (file) {
                    files[file.name] = file.entry;
                    fills.push({ table: lookup.table, key: lookup.key, stage, file: file.name });
                }
                break; // the first candidate with a glyph for the stage decides
            }
        }
    }

    // With --chars, keep the previous fills of every other lookup.
    if (ONLY) {
        for (const f of providerFills(previous, "xiaoxue")) {
            const lookup = lookups.find((l) => l.table === f.table && l.key === f.key);
            if (lookup && selected(lookup)) continue;
            files[f.file] = previous.files[f.file];
            fills.push(f);
        }
    }

    const manifest = applyFills(base, files, fills);
    manifest.about = { ...manifest.about, rule: ANCIENT_RULE, stages: ANCIENT_STAGES_NOTE, ...XIAOXUE_ABOUT };
    writeJson(OUT_JSON, manifest);

    // PNGs: write the used ones (unless the pixels are unchanged), remove stale ones.
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const keep = new Set();
    for (const value of processed.values()) {
        if (!value || !manifest.files[value.name]) continue;
        const out = path.join(ROOT, "public", value.entry.src);
        keep.add(path.basename(out));
        if (!fs.existsSync(out) || !samePixels(fs.readFileSync(out), value.png)) fs.writeFileSync(out, value.png);
    }
    for (const f of Object.values(manifest.files)) if (f.provider === "xiaoxue") keep.add(path.basename(f.src));
    for (const f of fs.readdirSync(OUT_DIR)) if (f.endsWith(".png") && !keep.has(f)) fs.unlinkSync(path.join(OUT_DIR, f));

    report({ base, manifest, radicalChars, processed, dropped, rejectedHeads, keep });
}

// ---------------------------------------------------------------- report

function coverage(manifest, radicalChars) {
    const atlas = readJson(ATLAS);
    const rows = [];
    const count = (name, list) => {
        const has = (l, s) => hasStage(manifest, l.table, l.key, s);
        rows.push({
            group: name,
            n: list.length,
            oracle: list.filter((l) => has(l, "oracle")).length,
            bronze: list.filter((l) => has(l, "bronze")).length,
            seal: list.filter((l) => has(l, "seal")).length,
            any: list.filter((l) => SHOWN.some((s) => has(l, s))).length,
            all3: list.filter((l) => SHOWN.every((s) => has(l, s))).length,
        });
    };
    count("radical chars", radicalChars.map((c) => ({ table: "chars", key: c })));
    count(
        "radical keys",
        atlas.radicals.map((r) => (manifest.radicals[r.key] ? { table: "radicals", key: r.key } : { table: "chars", key: r.char })),
    );
    return rows;
}

function report({ base, manifest, radicalChars, processed, dropped, rejectedHeads, keep }) {
    const before = coverage(base, radicalChars);
    const after = coverage(manifest, radicalChars);
    console.log("Before (Commons only):");
    console.table(before);
    console.log("After (Commons + 小學堂):");
    console.table(after);
    const used = [...processed.values()].filter((v) => v && manifest.files[v.name]);
    const bytes = [...keep].reduce((n, f) => n + fs.statSync(path.join(OUT_DIR, f)).size, 0);
    const largest = used.map((v) => [v.entry.src, fs.statSync(path.join(ROOT, "public", v.entry.src)).size]).sort((a, b) => b[1] - a[1])[0];
    console.log(`小學堂 files: ${keep.size} PNGs, ${(bytes / 1024).toFixed(1)} KiB${largest ? `; largest ${largest[0]} ${(largest[1] / 1024).toFixed(1)} KiB` : ""}`);
    if (dropped.length) console.log("Dropped (empty or broken):", dropped);
    if (rejectedHeads.size) console.log("Answered with another 字頭, not used:", Object.fromEntries(rejectedHeads));
    console.log(`Requests this run: ${requests}`);
    writeJson(path.join(CACHE, "report.json"), { before, after, dropped, rejectedHeads: Object.fromEntries(rejectedHeads), bytes, files: keep.size });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
