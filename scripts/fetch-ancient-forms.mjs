#!/usr/bin/env node
// Fetches sourced ancient forms (oracle bone, bronze, seal) from the Wikimedia
// Commons "Ancient Chinese characters project" and writes
//   lib/core/ancient-forms.json   per-file manifest (title, URL, author, license, source)
//   public/ancient/<hex>-<stage>.svg   sanitised SVGs for the shown stages
//
// Only files that pass lib/story/acc-license.ts are kept: {{ACClicense}}
// without the Richard Sears parameter (public domain), or CC0 files traced
// from Academia Sinica 小學堂. Nothing is drawn or invented: a stage with no
// passing file is left out.
//
// Scope, in order: the atlas's radical display chars, the top 600 kanji by
// frequency, then the rest of jōyō (Unihan kJoyoKanji). Each char is looked
// up under its etymon candidates (学 -> 學, 氵 -> 水; lib/story/etymon.ts).
//
// Usage: pnpm data:ancient [--scope radicals|top600|joyo] [--refresh] [--offline]
//   --refresh  re-query Commons instead of using data-cache/commons
//   --offline  rebuild from data-cache only (no network)
// Raw downloads live in the git-ignored data-cache/.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { classifyAccWikitext, normalizePeriod } from "../lib/story/acc-license.ts";
import { sanitizeAncientSvg } from "../lib/story/svg-sanitize.ts";
import {
    codePointHex,
    etymonCandidates,
    parseCjkRadicals,
    parseEquivalentUnified,
    parseRadicalStrokes,
    parseUnihanVariants,
} from "../lib/story/etymon.ts";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA_CACHE = path.join(ROOT, "data-cache");
const CACHE = path.join(DATA_CACHE, "commons");
const OUT_JSON = path.join(ROOT, "lib", "core", "ancient-forms.json");
const OUT_DIR = path.join(ROOT, "public", "ancient");
const ATLAS = path.join(ROOT, "lib", "atlas", "kanji-atlas.json");

const API = "https://commons.wikimedia.org/w/api.php";
const UA = "KanjiKaisen-data/1.0 (https://github.com/mxggle/kanji-kaisen)";
const API_DELAY_MS = 400;
// Raised whenever upload.wikimedia.org answers 429.
let downloadDelayMs = 400;
const BATCH = 50;

const args = new Set(process.argv.slice(2));
const scopeArg = process.argv.includes("--scope") ? process.argv[process.argv.indexOf("--scope") + 1] : "joyo";
const REFRESH = args.has("--refresh");
const OFFLINE = args.has("--offline");
const TIERS = ["radicals", "top600", "joyo"];
if (!TIERS.includes(scopeArg)) throw new Error(`--scope must be one of ${TIERS.join(", ")}`);

// Shown stages first, in display order; the rest are recorded, not downloaded.
const SHOWN = ["oracle", "bronze", "seal"];
const SUFFIXES = {
    oracle: ["oracle", "oracle-2", "oracle-3", "oracle-4"],
    bronze: ["bronze", "bronze-2", "bronze-3", "bronze-shang", "bronze-spring", "bronze-spring-2", "bronze-warring"],
    seal: ["seal", "seal-2"],
    bigseal: ["bigseal"],
    slip: ["slip"],
    silk: ["silk"],
};
const STAGES = Object.keys(SUFFIXES);

const today = new Date().toISOString().slice(0, 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (file, fallback) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback);
const writeJson = (file, data) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 1) + "\n");
    fs.renameSync(`${file}.tmp`, file);
};

// ---------------------------------------------------------------- Unicode data

function download(url, file) {
    if (OFFLINE) throw new Error(`Missing ${file} (offline)`);
    console.log(`Downloading ${url}`);
    execFileSync("curl", ["-sSfL", "-A", UA, "-o", file, url]);
}

export function loadUnicode() {
    const unihanDir = path.join(DATA_CACHE, "unihan");
    const variantsFile = path.join(unihanDir, "Unihan_Variants.txt");
    if (!fs.existsSync(variantsFile)) {
        fs.mkdirSync(unihanDir, { recursive: true });
        const zip = path.join(DATA_CACHE, "Unihan.zip");
        if (!fs.existsSync(zip)) download("https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip", zip);
        execFileSync("unzip", ["-o", "-q", zip, "-d", unihanDir]);
    }
    for (const name of ["CJKRadicals.txt", "EquivalentUnifiedIdeograph.txt"]) {
        const file = path.join(DATA_CACHE, name);
        if (!fs.existsSync(file)) download(`https://www.unicode.org/Public/UCD/latest/ucd/${name}`, file);
    }
    const read = (f) => fs.readFileSync(f, "utf8");
    const joyo = read(path.join(unihanDir, "Unihan_OtherMappings.txt"))
        .split("\n")
        .filter((l) => l.includes("\tkJoyoKanji\t2010"))
        .map((l) => String.fromCodePoint(parseInt(l.split("\t")[0].slice(2), 16)));
    return {
        data: {
            variants: parseUnihanVariants(read(variantsFile)),
            radicalStrokes: parseRadicalStrokes(read(path.join(unihanDir, "Unihan_IRGSources.txt"))),
            radicalChars: parseCjkRadicals(read(path.join(DATA_CACHE, "CJKRadicals.txt"))),
            equivalent: parseEquivalentUnified(read(path.join(DATA_CACHE, "EquivalentUnifiedIdeograph.txt"))),
        },
        joyo,
    };
}

// ---------------------------------------------------------------- Scope

export function buildScope(unicode, scope = scopeArg) {
    const atlas = readJson(ATLAS);
    const radicalChars = [...new Set(atlas.radicals.map((r) => r.char))];

    // A radical whose kanji mostly sit under a different Kangxi radical than
    // its display char suggests (月 nikuzuki: 35 of 38 are radical 130 肉) gets
    // that radical's forms. kRSUnicode decides; nothing is hand-mapped.
    const radicalOverrides = {};
    for (const r of atlas.radicals) {
        const counts = new Map();
        let total = 0;
        for (const k of atlas.kanji) {
            if (k.radical?.key !== r.key) continue;
            const rs = unicode.data.radicalStrokes.get(k.char);
            if (!rs) continue;
            total += 1;
            counts.set(rs.radical, (counts.get(rs.radical) ?? 0) + 1);
        }
        const [top, n] = [...counts].sort((a, b) => b[1] - a[1])[0] ?? [];
        if (!top || total < 5 || n / total < 0.75) continue;
        const main = unicode.data.radicalChars.get(top);
        if (main && !etymonCandidates(r.char, unicode.data).candidates.includes(main)) radicalOverrides[r.key] = main;
    }

    const top600 = atlas.kanji
        .filter((k) => typeof k.frequency === "number")
        .sort((a, b) => a.frequency - b.frequency || a.char.localeCompare(b.char))
        .slice(0, 600)
        .map((k) => k.char);

    const tiers = new Map();
    const add = (char, tier) => {
        if (!tiers.has(char)) tiers.set(char, tier);
    };
    for (const c of radicalChars) add(c, "radicals");
    for (const c of Object.values(radicalOverrides)) add(c, "radicals");
    if (scope !== "radicals") for (const c of top600) add(c, "top600");
    if (scope === "joyo") for (const c of unicode.joyo) add(c, "joyo");
    return { tiers, radicalOverrides, radicalChars, top600 };
}

// ---------------------------------------------------------------- Commons API


let lastCall = 0;
async function politeFetch(url, delay, onThrottle) {
    for (let attempt = 0; ; attempt++) {
        const wait = lastCall + delay() - Date.now();
        if (wait > 0) await sleep(wait);
        lastCall = Date.now();
        let res;
        try {
            res = await fetch(url, { headers: { "User-Agent": UA, "Api-User-Agent": UA } });
        } catch (err) {
            if (attempt >= 5) throw err;
            await sleep(2000 * 2 ** attempt);
            continue;
        }
        if (res.status === 429 || res.status === 503 || res.status === 502) {
            if (attempt >= 8) throw new Error(`${res.status} after retries: ${url}`);
            onThrottle?.();
            const retryAfter = Number(res.headers.get("retry-after")) || 0;
            const backoff = Math.max(retryAfter * 1000, 2000 * 2 ** attempt);
            console.warn(`  ${res.status}; backing off ${Math.round(backoff / 1000)} s`);
            await sleep(backoff);
            continue;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
        return res;
    }
}

async function api(params) {
    const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", maxlag: "5", ...params })}`;
    for (let attempt = 0; ; attempt++) {
        const json = await (await politeFetch(url, () => API_DELAY_MS)).json();
        if (json.error?.code === "maxlag" && attempt < 8) {
            console.warn(`  maxlag; waiting`);
            await sleep(5000 * (attempt + 1));
            continue;
        }
        if (json.error) throw new Error(`API error ${json.error.code}: ${json.error.info}`);
        return json;
    }
}

// Runs a query with continuation and merges pages by title.
async function queryPages(params) {
    const pages = new Map();
    const normalized = new Map();
    let cont = {};
    for (;;) {
        const json = await api({ action: "query", ...params, ...cont });
        for (const n of json.query?.normalized ?? []) normalized.set(n.from, n.to);
        for (const p of json.query?.pages ?? []) {
            const prev = pages.get(p.title) ?? {};
            pages.set(p.title, {
                ...prev,
                ...p,
                revisions: [...(prev.revisions ?? []), ...(p.revisions ?? [])],
                imageinfo: [...(prev.imageinfo ?? []), ...(p.imageinfo ?? [])],
            });
        }
        if (!json.continue) break;
        cont = json.continue;
    }
    return { pages, normalized };
}

const fileTitle = (char, suffix) => `File:${char}-${suffix}.svg`;
// Loaded in main(), so importing this module (fetch-etymology does) is cheap.
let pagesCache = {};

async function fetchPages(titles) {
    const todo = [...new Set(titles)].filter((t) => REFRESH || !(t in pagesCache));
    if (OFFLINE && todo.length) throw new Error(`${todo.length} titles not cached (offline)`);
    for (let i = 0; i < todo.length; i += BATCH) {
        const batch = todo.slice(i, i + BATCH);
        const { pages, normalized } = await queryPages({
            titles: batch.join("|"),
            prop: "revisions|imageinfo",
            rvprop: "ids|timestamp|content",
            rvslots: "main",
            iiprop: "url|size|sha1|user|timestamp",
        });
        for (const title of batch) {
            const p = pages.get(normalized.get(title) ?? title);
            if (!p || p.missing || p.invalid) {
                pagesCache[title] = { missing: true };
                continue;
            }
            const rev = p.revisions[0];
            const ii = p.imageinfo[0];
            pagesCache[title] = {
                revid: rev?.revid ?? null,
                content: rev?.slots?.main?.content ?? "",
                image: ii ? { url: ii.url.split("?")[0], size: ii.size, sha1: ii.sha1, user: ii.user, timestamp: ii.timestamp } : null,
            };
        }
        writeJson(path.join(CACHE, "pages.json"), pagesCache);
        const done = Math.min(i + BATCH, todo.length);
        if (done % 2000 < BATCH || done === todo.length) console.log(`  pages ${done}/${todo.length}`);
    }
}

const redirectTarget = (page) => {
    const m = /^#redirect\s*:?\s*\[\[\s*(?:file|image)\s*:\s*([^\]|#]+)/i.exec(page?.content?.trim() ?? "");
    return m ? `File:${m[1].replace(/_/g, " ").trim()}` : null;
};

// Follows file redirects (冫-oracle.svg -> 仌-oracle.svg), fetching targets.
async function fetchWithRedirects(titles) {
    let todo = titles;
    for (let hop = 0; hop < 3 && todo.length; hop++) {
        await fetchPages(todo);
        todo = todo.map((t) => redirectTarget(pagesCache[t])).filter((t) => t && !(t in pagesCache));
    }
}

function resolve(title) {
    let t = title;
    for (let hop = 0; hop < 4; hop++) {
        const page = pagesCache[t];
        if (!page || page.missing) return null;
        const next = redirectTarget(page);
        if (!next) return t;
        t = next;
    }
    return null;
}

// "File:學-bronze-2.svg" -> { char: "學", suffix: "bronze-2" }, or null for
// files outside the ACC naming scheme.
function accName(title) {
    const m = /^File:(.+?)-([a-z]+(?:-[a-z0-9]+)*)\.svg$/u.exec(title);
    if (!m || [...m[1]].length !== 1) return null;
    return { char: m[1], suffix: m[2] };
}
const stageOf = (suffix) => STAGES.find((s) => SUFFIXES[s].includes(suffix)) ?? suffix.split("-")[0];

// Distinct uploaders of every version, oldest first.
async function fetchUploaders(titles, cache) {
    const todo = titles.filter((t) => REFRESH || !cache[t] || cache[t].sha1 !== pagesCache[t].image?.sha1);
    if (OFFLINE && todo.length) throw new Error(`${todo.length} histories not cached (offline)`);
    for (let i = 0; i < todo.length; i += BATCH) {
        const batch = todo.slice(i, i + BATCH);
        const { pages, normalized } = await queryPages({
            titles: batch.join("|"),
            prop: "imageinfo",
            iiprop: "user|timestamp",
            iilimit: "50",
        });
        for (const title of batch) {
            const p = pages.get(normalized.get(title) ?? title);
            const users = [...(p?.imageinfo ?? [])]
                .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
                .map((ii) => ii.user)
                .filter(Boolean);
            cache[title] = { sha1: pagesCache[title].image?.sha1, users: [...new Set(users)] };
        }
        writeJson(path.join(CACHE, "history.json"), cache);
    }
}

async function downloadSvg(title) {
    const image = pagesCache[title].image;
    const file = path.join(CACHE, "svg", `${image.sha1}.svg`);
    if (!fs.existsSync(file)) {
        if (OFFLINE) throw new Error(`${title} not cached (offline)`);
        const res = await politeFetch(
            image.url,
            () => downloadDelayMs,
            () => (downloadDelayMs = Math.min(3000, downloadDelayMs * 1.5)),
        );
        const buf = Buffer.from(await res.arrayBuffer());
        const sha1 = crypto.createHash("sha1").update(buf).digest("hex");
        if (sha1 !== image.sha1) throw new Error(`SHA-1 mismatch for ${title}`);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, buf);
    }
    return fs.readFileSync(file, "utf8");
}

// ---------------------------------------------------------------- Main

async function main() {
    fs.mkdirSync(CACHE, { recursive: true });
    pagesCache = readJson(path.join(CACHE, "pages.json"), {});
    const unicode = loadUnicode();
    const { tiers, radicalOverrides, radicalChars } = buildScope(unicode);

    // What to look up: every display char under its etymon candidates, plus
    // each overridden radical under its Kangxi radical char alone.
    const lookups = [];
    const ambiguous = [];
    for (const char of tiers.keys()) {
        const c = etymonCandidates(char, unicode.data);
        if (c.ambiguous) ambiguous.push(`${char}→${c.ambiguous.join("")}`);
        lookups.push({ kind: "char", key: char, candidates: c.candidates });
    }
    for (const [key, main] of Object.entries(radicalOverrides)) lookups.push({ kind: "radical", key, candidates: [main] });

    const etyma = [...new Set(lookups.flatMap((l) => l.candidates))];
    const titles = etyma.flatMap((c) => STAGES.flatMap((s) => SUFFIXES[s].map((suffix) => fileTitle(c, suffix))));
    console.log(`${tiers.size} chars, ${etyma.length} etyma, ${titles.length} candidate titles`);
    await fetchWithRedirects(titles);

    // Classify each candidate by the file it finally points to.
    const verdicts = new Map(); // candidate title -> { file, verdict }
    const reasons = {};
    const seenFiles = new Set();
    for (const title of titles) {
        const file = resolve(title);
        if (!file) continue;
        const page = pagesCache[file];
        const target = accName(file);
        // A redirect to a file of another script (…-oracle -> …-seal) is not used.
        if (target && stageOf(target.suffix) !== stageOf(accName(title).suffix)) continue;
        const verdict = page.image ? classifyAccWikitext(page.content) : { keep: false, reason: "unclear" };
        verdicts.set(title, { file, verdict });
        if (!seenFiles.has(file)) {
            seenFiles.add(file);
            reasons[verdict.reason] = (reasons[verdict.reason] ?? 0) + 1;
        }
    }

    // Pick a file per stage: first candidate etymon, then first suffix, whose
    // file passes the license filter and (for shown stages) sanitises.
    const svgCache = new Map();
    const sanitizeFailures = {};
    const outputs = new Map(); // public src -> file title
    const fileInfo = new Map(); // file title -> { stage, char, via, src }
    async function usable(candidateTitle, file, stage) {
        const char = accName(file)?.char ?? accName(candidateTitle).char;
        const info = { stage, char };
        if (file !== candidateTitle) info.via = candidateTitle.slice(5);
        if (SHOWN.includes(stage)) {
            if (!svgCache.has(file)) {
                const out = sanitizeAncientSvg(await downloadSvg(file));
                if ("error" in out) (sanitizeFailures[out.error] ??= []).push(file);
                svgCache.set(file, "error" in out ? null : out.svg);
            }
            if (!svgCache.get(file)) return false;
            const src = `/ancient/${codePointHex(char)}-${stage}.svg`;
            const owner = outputs.get(src);
            if (owner && owner !== file) return false; // another file of this char already holds the slot
            outputs.set(src, file);
            info.src = src;
        }
        if (!fileInfo.has(file)) fileInfo.set(file, info);
        return true;
    }

    const picks = new Map(); // lookup -> { stage -> file }
    const preFilter = new Map(); // lookup -> Set(stage) with any file before filtering
    for (const lookup of lookups) {
        const chosen = {};
        const before = new Set();
        for (const stage of STAGES) {
            for (const etymon of lookup.candidates) {
                for (const suffix of SUFFIXES[stage]) {
                    const candidate = fileTitle(etymon, suffix);
                    const v = verdicts.get(candidate);
                    if (!v) continue;
                    before.add(stage);
                    if (chosen[stage] || !v.verdict.keep) continue;
                    if (await usable(candidate, v.file, stage)) chosen[stage] = v.file;
                }
            }
        }
        preFilter.set(lookup, before);
        picks.set(lookup, chosen);
    }

    const usedFiles = [...new Set([...picks.values()].flatMap((p) => Object.values(p)))].sort();
    const historyCache = readJson(path.join(CACHE, "history.json"), {});
    await fetchUploaders(usedFiles, historyCache);

    // Manifest. Keep the previous fetch date for files that haven't changed.
    const previous = readJson(OUT_JSON, { files: {} });
    const files = {};
    for (const file of usedFiles) {
        const name = file.slice(5);
        const page = pagesCache[file];
        const { verdict } = [...verdicts.values()].find((v) => v.file === file);
        const info = fileInfo.get(file);
        const suffix = accName(file)?.suffix ?? "";
        const period = verdict.period ?? normalizePeriod(suffix.split("-")[1]);
        const prev = previous.files?.[name];
        const entry = {
            stage: info.stage,
            char: info.char,
            url: `https://commons.wikimedia.org/wiki/${file.replace(/ /g, "_")}`,
            author: (historyCache[file]?.users ?? [page.image.user]).join(", "),
            license: verdict.license,
        };
        if (verdict.sinicaCode) entry.source = `Academia Sinica 小學堂 ${verdict.sinicaCode}`;
        if (verdict.ref) entry.ref = verdict.ref;
        if (period) entry.period = period;
        if (info.via) entry.via = info.via;
        entry.revid = page.revid;
        entry.sha1 = page.image.sha1;
        entry.fetched = prev && prev.revid === page.revid && prev.sha1 === page.image.sha1 ? prev.fetched : today;
        if (info.src) entry.src = info.src;
        files[name] = entry;
    }

    const toEntry = (chosen) => {
        const shown = SHOWN.filter((s) => chosen[s]);
        const other = STAGES.filter((s) => !SHOWN.includes(s) && chosen[s]);
        if (!shown.length && !other.length) return null;
        const entry = { etymon: files[chosen[shown[0] ?? other[0]].slice(5)].char };
        for (const s of shown) entry[s] = chosen[s].slice(5);
        if (other.length) entry.other = other.map((s) => chosen[s].slice(5));
        return entry;
    };
    const chars = {};
    const radicals = {};
    for (const lookup of [...lookups].sort((a, b) => a.key.localeCompare(b.key))) {
        const entry = toEntry(picks.get(lookup));
        if (!entry) continue;
        if (lookup.kind === "char") chars[lookup.key] = entry;
        else radicals[lookup.key] = entry;
    }

    writeJson(OUT_JSON, {
        about: {
            source: "Wikimedia Commons, Ancient Chinese characters project",
            sourceUrl: "https://commons.wikimedia.org/wiki/Commons:Ancient_Chinese_characters_project",
            rule:
                "Only files under {{ACClicense}} without the Richard Sears parameter (public domain), or CC0 files traced from Academia Sinica 小學堂. Files are never redrawn; a stage without such a file is left out.",
            stages: "oracle, bronze and seal are shown and self-hosted under /ancient; `other` lists big seal, slip and silk files that pass the same filter (recorded, not downloaded).",
            radicals:
                "Radicals whose kanji mostly belong to another Kangxi radical than the display char suggests (Unihan kRSUnicode), e.g. 月 nikuzuki -> 肉.",
            generatedBy: "scripts/fetch-ancient-forms.mjs",
        },
        files,
        chars,
        radicals,
    });

    // SVGs: write the used ones, remove stale ones.
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const keep = new Set();
    for (const [src, file] of outputs) {
        if (!files[file.slice(5)]?.src) continue;
        const out = path.join(ROOT, "public", src);
        keep.add(path.basename(out));
        const svg = svgCache.get(file);
        if (!fs.existsSync(out) || fs.readFileSync(out, "utf8") !== svg) fs.writeFileSync(out, svg);
    }
    for (const f of fs.readdirSync(OUT_DIR)) if (f.endsWith(".svg") && !keep.has(f)) fs.unlinkSync(path.join(OUT_DIR, f));

    report({ tiers, lookups, picks, preFilter, reasons, verdicts, ambiguous, sanitizeFailures, radicals, radicalChars, keep });
}

function report({ tiers, lookups, picks, preFilter, reasons, verdicts, ambiguous, sanitizeFailures, radicals, keep }) {
    const charLookups = new Map(lookups.filter((l) => l.kind === "char").map((l) => [l.key, l]));
    const atlas = readJson(ATLAS);
    const radicalKeyLookup = (r) => lookups.find((l) => l.kind === "radical" && l.key === r.key) ?? charLookups.get(r.char);
    const groups = {
        "radical chars": [...tiers].filter(([, t]) => t === "radicals").map(([c]) => charLookups.get(c)),
        "radical keys": atlas.radicals.map(radicalKeyLookup),
        "top-600 kanji": [...tiers].filter(([, t]) => t === "top600").map(([c]) => charLookups.get(c)),
        "rest of jōyō": [...tiers].filter(([, t]) => t === "joyo").map(([c]) => charLookups.get(c)),
    };
    const rows = [];
    for (const [group, list] of Object.entries(groups)) {
        if (!list.length) continue;
        const has = (s) => list.filter((l) => picks.get(l)?.[s]).length;
        rows.push({
            group,
            n: list.length,
            oracle: has("oracle"),
            bronze: has("bronze"),
            seal: has("seal"),
            any: list.filter((l) => SHOWN.some((s) => picks.get(l)?.[s])).length,
            all3: list.filter((l) => SHOWN.every((s) => picks.get(l)?.[s])).length,
            anyBeforeFilter: list.filter((l) => SHOWN.some((s) => preFilter.get(l)?.has(s))).length,
        });
    }
    console.table(rows);
    const shown = new Map();
    for (const [title, v] of verdicts) if (SHOWN.includes(stageOf(accName(title).suffix))) shown.set(v.file, v.verdict);
    const searsShown = [...shown.values()].filter((v) => v.reason === "sears").length;
    console.log("Verdicts over distinct candidate files:", reasons);
    console.log(`Sears filter removed ${searsShown} of ${shown.size} distinct oracle/bronze/seal files`);
    console.log("Sanitise failures:", Object.fromEntries(Object.entries(sanitizeFailures).map(([k, v]) => [k, v])));
    if (ambiguous.length) console.log(`Ambiguous etymon, skipped: ${ambiguous.join(" ")}`);
    console.log("Radical overrides:", Object.fromEntries(Object.entries(radicals).map(([k, v]) => [k, v.etymon])));
    const bytes = [...keep].reduce((n, f) => n + fs.statSync(path.join(OUT_DIR, f)).size, 0);
    console.log(`public/ancient: ${keep.size} files, ${(bytes / 1024).toFixed(0)} KiB`);
    writeJson(path.join(CACHE, "report.json"), { rows, reasons, searsShown, shownFiles: shown.size, sanitizeFailures, ambiguous, bytes });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
