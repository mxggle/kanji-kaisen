#!/usr/bin/env node
// Fetches glyph origins from English Wiktionary for the atlas's radical chars,
// the top 600 kanji by frequency and the example kanji named in the radical
// stories (the "What 木 grows into" rows, e.g. 休), and writes
//   lib/core/etymology.wiktionary.json   (CC BY-SA 4.0, see the .NOTICE.txt beside it)
//
// For each char the pages of its etymon candidates are tried in order
// (学 -> 學, 氵 -> 氵 then 水; lib/story/etymon.ts). The "Glyph origin" section
// under Chinese, Translingual or Japanese is parsed by lib/story/wiktionary.ts:
// formation type, components (with semantic/phonetic roles) and at most two
// plain sentences. Entries keep the page URL and revision ID. Nothing is
// written from memory: when no page parses cleanly, the char is skipped.
//
// Usage: pnpm data:etymology [--refresh] [--offline]

import fs from "node:fs";
import path from "node:path";
import { parseGlyphOriginPage } from "../lib/story/wiktionary.ts";
import { etymonCandidates } from "../lib/story/etymon.ts";
import { buildScope, loadUnicode } from "./fetch-ancient-forms.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const CACHE = path.join(ROOT, "data-cache", "wiktionary");
const OUT_JSON = path.join(ROOT, "lib", "core", "etymology.wiktionary.json");

const API = "https://en.wiktionary.org/w/api.php";
const UA = "KanjiKaisen-data/1.0 (https://github.com/mxggle/kanji-kaisen)";
const API_DELAY_MS = 500;
const BATCH = 50;

const args = new Set(process.argv.slice(2));
const REFRESH = args.has("--refresh");
const OFFLINE = args.has("--offline");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const readJson = (file, fallback) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : fallback);
const writeJson = (file, data) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(`${file}.tmp`, JSON.stringify(data, null, 1) + "\n");
    fs.renameSync(`${file}.tmp`, file);
};

let lastCall = 0;
async function api(params) {
    const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", maxlag: "5", ...params })}`;
    for (let attempt = 0; ; attempt++) {
        const wait = lastCall + API_DELAY_MS - Date.now();
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
            if (attempt >= 8) throw new Error(`${res.status} after retries`);
            const backoff = Math.max((Number(res.headers.get("retry-after")) || 0) * 1000, 2000 * 2 ** attempt);
            console.warn(`  ${res.status}; backing off ${Math.round(backoff / 1000)} s`);
            await sleep(backoff);
            continue;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json.error?.code === "maxlag" && attempt < 8) {
            await sleep(5000 * (attempt + 1));
            continue;
        }
        if (json.error) throw new Error(`API error ${json.error.code}: ${json.error.info}`);
        return json;
    }
}

const cache = readJson(path.join(CACHE, "pages.json"), {});

async function fetchPages(titles) {
    const todo = [...new Set(titles)].filter((t) => REFRESH || !(t in cache));
    if (OFFLINE && todo.length) throw new Error(`${todo.length} pages not cached (offline)`);
    for (let i = 0; i < todo.length; i += BATCH) {
        const batch = todo.slice(i, i + BATCH);
        const pages = new Map();
        const normalized = new Map();
        let cont = {};
        for (;;) {
            const json = await api({
                action: "query",
                titles: batch.join("|"),
                prop: "revisions",
                rvprop: "ids|content",
                rvslots: "main",
                ...cont,
            });
            for (const n of json.query?.normalized ?? []) normalized.set(n.from, n.to);
            for (const p of json.query?.pages ?? []) if (p.revisions?.length) pages.set(p.title, p);
                else if (!pages.has(p.title)) pages.set(p.title, p);
            if (!json.continue) break;
            cont = json.continue;
        }
        for (const title of batch) {
            const p = pages.get(normalized.get(title) ?? title);
            const rev = p?.revisions?.[0];
            cache[title] = rev ? { title: p.title, revid: rev.revid, content: rev.slots.main.content } : { missing: true };
        }
        writeJson(path.join(CACHE, "pages.json"), cache);
        console.log(`  pages ${Math.min(i + BATCH, todo.length)}/${todo.length}`);
    }
}

const pageUrl = (title) => `https://en.wiktionary.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

async function main() {
    const unicode = loadUnicode();
    const { tiers, radicalOverrides } = buildScope(unicode, "top600");
    const stories = JSON.parse(fs.readFileSync(path.join(ROOT, "lib", "compiled-stories.json"), "utf8"));
    const atlas = JSON.parse(fs.readFileSync(path.join(ROOT, "lib", "atlas", "kanji-atlas.json"), "utf8"));
    const inAtlas = new Set(atlas.kanji.map((k) => k.char));
    for (const r of Object.values(stories.radicals)) {
        for (const { char } of r.exampleKanji ?? []) if (inAtlas.has(char) && !tiers.has(char)) tiers.set(char, "examples");
    }

    const lookups = [];
    for (const char of tiers.keys()) lookups.push({ kind: "char", key: char, candidates: etymonCandidates(char, unicode.data).candidates });
    for (const [key, main] of Object.entries(radicalOverrides)) lookups.push({ kind: "radical", key, candidates: [main] });

    await fetchPages(lookups.flatMap((l) => l.candidates));

    // First candidate page with a formation wins; otherwise the first with
    // components or text.
    const parsed = new Map();
    const parse = (title) => {
        if (!parsed.has(title)) {
            const page = cache[title];
            parsed.set(title, page && !page.missing ? parseGlyphOriginPage(page.content) : null);
        }
        return parsed.get(title);
    };
    const entries = {};
    const radicals = {};
    const skipped = [];
    for (const lookup of [...lookups].sort((a, b) => a.key.localeCompare(b.key))) {
        const options = lookup.candidates.map((title) => ({ title, origin: parse(title) })).filter((o) => o.origin);
        const best = options.find((o) => o.origin.formation) ?? options.find((o) => o.origin.components.length || o.origin.text);
        if (!best) {
            skipped.push(lookup.key);
            continue;
        }
        const page = cache[best.title];
        const entry = { page: page.title, url: pageUrl(page.title), revid: page.revid, ...best.origin };
        if (lookup.kind === "char") entries[lookup.key] = entry;
        else radicals[lookup.key] = entry;
    }

    writeJson(OUT_JSON, {
        about: {
            source: "English Wiktionary, “Glyph origin” sections",
            license: "CC BY-SA 4.0",
            licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
            note: "Each entry links its page and revision. `page` differs from the key when the origin is that of the traditional or radical form (学 -> 學).",
            generatedBy: "scripts/fetch-etymology.mjs",
        },
        entries,
        radicals,
    });

    const all = [...Object.values(entries), ...Object.values(radicals)];
    const byFormation = {};
    for (const e of Object.values(entries)) byFormation[e.formation ?? "none"] = (byFormation[e.formation ?? "none"] ?? 0) + 1;
    const charsIn = (tier) => [...tiers].filter(([, t]) => t === tier).map(([c]) => c);
    console.log(`Entries: ${Object.keys(entries).length} chars + ${Object.keys(radicals).length} radical keys`);
    console.log(`Radical chars: ${charsIn("radicals").filter((c) => entries[c]).length}/${charsIn("radicals").length}`);
    console.log(`Top-600 kanji: ${charsIn("top600").filter((c) => entries[c]).length}/${charsIn("top600").length}`);
    console.log(`Story example kanji: ${charsIn("examples").filter((c) => entries[c]).length}/${charsIn("examples").length}`);
    console.log("By formation:", byFormation);
    console.log(`With text: ${all.filter((e) => e.text).length}, with components: ${all.filter((e) => e.components.length).length}`);
    console.log(`Skipped (${skipped.length}): ${skipped.join("")}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
