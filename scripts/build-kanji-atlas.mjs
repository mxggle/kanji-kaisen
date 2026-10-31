// Builds the unified atlas dataset used by the browse-first pages.
//
//   lib/atlas/kanji-atlas.json    full records (server-only)
//   public/data/search-index.json slim index for client-side search
//   lib/kanji-db.json             meanings rewritten in KANJIDIC2 order (classic practice)
//
// Inputs are committed files only, so the output is deterministic:
//   language-neutral core  lib/core/unihan.json, lib/core/components.kanjivg.json,
//                          lib/radical-category-map.json, public/kanjivg (radical fallback)
//   Japanese layer         lib/ja/kanjidic2.json, lib/ja/words.jmdict.json,
//                          lib/ja/jlpt.kanjiapi.json, lib/kanji-db.json (kanji set, JLPT levels)
//   stories and examples   lib/kanji-alive-categorized.json, lib/compiled-stories.json
// The layers come from `pnpm data:sources && pnpm data:layers`
// (scripts/build-data-layers.mjs). Re-run with `pnpm data:atlas` and commit.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { expandStrokeRanges, parseStrokeRanges } from '../lib/core/kanjivg-parse.ts';
import { findLookAlikes } from '../lib/core/look-alikes.ts';
import { buildPhoneticSeries, isRegular } from '../lib/core/phonetic.ts';
import { classifyZh, etymonOf } from '../lib/core/zh.ts';
import { alignByEdge, alignKanji, parseFurigana } from '../lib/ja/align.ts';
import { aliveLookupKeys, parseAliveExample } from './lib/kanji-alive.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const kanjiDb = readJson('lib/kanji-db.json');
const kanjiAlive = readJson('lib/kanji-alive-categorized.json');
const stories = readJson('lib/compiled-stories.json').radicals;
const categoryMap = readJson('lib/radical-category-map.json');
const radicalCharMap = readJson('scripts/radical_char_map.json');
const unihan = readJson('lib/core/unihan.json').chars;
const kvgLayer = readJson('lib/core/components.kanjivg.json').kanji;
const kanjidic = readJson('lib/ja/kanjidic2.json').kanji;
const wordsLayer = readJson('lib/ja/words.jmdict.json');
const jlptLayer = readJson('lib/ja/jlpt.kanjiapi.json').levels;

const KANJIVG_DIR = path.join(root, 'public/kanjivg/kanji');
const ATLAS_OUT = path.join(root, 'lib/atlas/kanji-atlas.json');
const INDEX_OUT = path.join(root, 'public/data/search-index.json');
const KANJI_DB_OUT = path.join(root, 'lib/kanji-db.json');

// Kanji Alive group keys that are not radicals.
const NON_RADICAL_GROUPS = new Set(['n/a']);

// KanjiVG writes some side forms with CJK Unified chars, while the radical
// stories use the CJK Radicals Supplement block.
const SIDE_FORM_ALIASES = { '忄': '⺖', '刂': '⺉' };

const normalizeChar = (char) => SIDE_FORM_ALIASES[char] || radicalCharMap[char] || char;
const byCodePoint = (a, b) => a.codePointAt(0) - b.codePointAt(0);

// ---------------------------------------------------------------------------
// Radicals

const radicalKeys = [...new Set([...Object.keys(kanjiAlive), ...Object.keys(stories)])]
    .filter((key) => !NON_RADICAL_GROUPS.has(key))
    .sort();

const radicals = radicalKeys.map((key) => {
    const group = kanjiAlive[key];
    const story = stories[key];
    return {
        key,
        char: normalizeChar(story?.char || group?.radical_char || ''),
        name: story?.name || key,
        meaning: story?.meaning || group?.radical_meaning || '',
        category: categoryMap[key] || null,
        hasStory: Boolean(story),
    };
});
const radicalByKey = new Map(radicals.map((r) => [r.key, r]));

// char -> radical key, for the KanjiVG fallback. Keys with a Kanji Alive group
// win (biggest group first), so e.g. 木 maps to `ki`, not the story-only `kihen`.
const groupSize = (key) => kanjiAlive[key]?.kanji.length || 0;
const charToKey = new Map();
for (const r of [...radicals].sort((a, b) => groupSize(b.key) - groupSize(a.key) || a.key.localeCompare(b.key))) {
    const chars = [r.char, normalizeChar(kanjiAlive[r.key]?.radical_char || ''), normalizeChar(stories[r.key]?.char || '')];
    for (const c of chars) {
        if (c && !charToKey.has(c)) charToKey.set(c, r.key);
    }
}
const radicalKeyFor = (...chars) => {
    for (const c of chars) {
        const key = c && charToKey.get(normalizeChar(c));
        if (key) return key;
    }
    return null;
};

// ---------------------------------------------------------------------------
// Kanji Alive lookups

const aliveByChar = new Map();
for (const [key, group] of Object.entries(kanjiAlive)) {
    for (const k of group.kanji) aliveByChar.set(k.char, { key, kanji: k });
}

// ---------------------------------------------------------------------------
// KanjiVG radical fallback

const kvgFile = (char) => path.join(KANJIVG_DIR, `${char.codePointAt(0).toString(16).padStart(5, '0')}.svg`);
const attr = (tag, name) => tag.match(new RegExp(`kvg:${name}="([^"]*)"`))?.[1];

function radicalFromKanjiVG(char) {
    const file = kvgFile(char);
    if (!fs.existsSync(file)) return null;
    const groups = fs.readFileSync(file, 'utf8').match(/<g [^>]*kvg:radical="[^"]*"[^>]*>/g) || [];
    // Prefer the "general" radical, then the traditional (Kangxi) one.
    for (const type of ['general', 'tradit', 'nelson']) {
        for (const tag of groups.filter((g) => attr(g, 'radical') === type)) {
            const key = radicalKeyFor(attr(tag, 'element'), attr(tag, 'original'));
            if (key) return key;
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Kanji set: kanji-db plus every jōyō kanji it lacks.

const kanjiDbByChar = new Map(kanjiDb.map((k) => [k.char, k]));
const addedJoyo = Object.keys(unihan).filter((c) => unihan[c].joyo === 1 && !kanjiDbByChar.has(c)).sort(byCodePoint);
const allChars = [...kanjiDb.map((k) => k.char), ...addedJoyo];

const jlptOf = new Map();
for (const [level, chars] of Object.entries(jlptLayer)) for (const c of chars) if (!jlptOf.has(c)) jlptOf.set(c, level);

const getUnihan = (c) => unihan[c];

// ---------------------------------------------------------------------------
// Example words

const wordTable = new Map(wordsLayer.words.map(([text, reading, furigana, gloss]) => [`${text}|${reading}`, { text, reading, furigana, gloss }]));
const readingsOf = (c) => (kanjidic[c]?.on || kanjidic[c]?.kun ? { on: kanjidic[c].on ?? [], kun: kanjidic[c].kun ?? [] } : null);

function examplesFor(char) {
    const alive = aliveByChar.get(char);
    const fromAlive = alive ? alive.kanji.examples.map(parseAliveExample).map((e) => ({ ...e, source: 'kanjialive' })) : [];
    const fromJmdict = (wordsLayer.byKanji[char] ?? []).map((i) => {
        const [word, reading, , meaning] = wordsLayer.words[i];
        return { word, reading, meaning, source: 'jmdict' };
    });
    return [...fromAlive, ...fromJmdict];
}

const alignStats = { aligned: 0, special: 0, flipped: 0 };

/**
 * Groups examples by the reading the kanji takes; irregular words get
 * `special: true`. Words are stored as indexes into `examples` (lib/atlas/core.ts
 * turns them back into objects), so the JSON carries each word once.
 */
function groupByReading(char, onyomi, kunyomi, examples) {
    const readings = { on: onyomi, kun: kunyomi };
    const groups = new Map([
        ...onyomi.map((r) => [`on:${r}`, { reading: r, kind: 'on', words: [] }]),
        ...kunyomi.map((r) => [`kun:${r}`, { reading: r, kind: 'kun', words: [] }]),
    ]);
    const special = { reading: '', kind: 'special', words: [] };
    const readingsWith = (c) => (c === char ? readings : readingsOf(c));
    const align = (example) => {
        if (example.special || !example.reading) return null;
        const keys = aliveLookupKeys(example.word, example.reading);
        // Furigana first (any key), then the heuristic, then the digit fallback.
        for (const [word, reading] of keys) {
            const furigana = wordTable.get(`${word}|${reading}`)?.furigana;
            if (furigana?.length) return alignKanji(word, reading, char, readingsWith, parseFurigana(furigana));
        }
        for (const [word, reading] of keys) {
            const match = alignKanji(word, reading, char, readingsWith) ?? alignByEdge(word, reading, char, readings);
            if (match) return match;
        }
        return null;
    };
    examples.forEach((example, index) => {
        const match = align(example);
        if (match) {
            alignStats.aligned++;
            groups.get(`${match.kind}:${match.reading}`).words.push(index);
        } else {
            alignStats.special++;
            if (!example.special) {
                alignStats.flipped++;
                example.special = true;
            }
            special.words.push(index);
        }
    });
    return [...groups.values(), ...(special.words.length ? [special] : [])];
}

// ---------------------------------------------------------------------------
// Kanji records

const LEVEL_ORDER = ['N5', 'N4', 'N3', 'N2', 'N1'];
const stats = { alive: 0, kanjivg: 0, unassigned: [], editorial: [] };

const records = allChars.map((char) => {
    const db = kanjiDbByChar.get(char);
    const kd = kanjidic[char];
    const alive = aliveByChar.get(char);
    let radicalKey = alive && !NON_RADICAL_GROUPS.has(alive.key) ? alive.key : null;
    if (radicalKey) stats.alive++;
    else {
        radicalKey = radicalFromKanjiVG(char);
        if (radicalKey) stats.kanjivg++;
        else stats.unassigned.push(char);
    }
    const radical = radicalKey ? radicalByKey.get(radicalKey) : null;

    // kanjiapi.dev level, else kanji-db's editorial one (0.2 of the atlas pivot), else N1.
    const listed = jlptOf.get(char);
    const jlpt = db?.jlpt ?? listed ?? 'N1';
    if (!listed) stats.editorial.push(char);

    const onyomi = kd?.on ?? db.onyomi;
    const kunyomi = kd?.kun ?? db.kunyomi;
    const examples = examplesFor(char);
    const u = unihan[char];
    const joyo = u?.joyo === 1;

    return {
        char,
        meanings: kd?.m?.length ? kd.m : db.meaning.split(', ').map((m) => m.trim()).filter(Boolean),
        onyomi,
        kunyomi,
        jlpt,
        grade: kd ? kd.g : db.grade ?? null,
        strokeCount: kd?.s ?? db?.strokeCount ?? kvgLayer[char]?.n,
        frequency: kd ? kd.f : db.frequency && db.frequency < 9999 ? db.frequency : null,
        radical: radical ? { key: radical.key, char: radical.char } : null,
        category: radical?.category || null,
        examples,
        wordsByReading: groupByReading(char, onyomi, kunyomi, examples),
        joyo,
        nameKanji: !joyo && Boolean(u?.jinmei),
        jlptEditorial: !listed,
        zh: u ? classifyZh(char, getUnihan) : null,
        etymon: u ? etymonOf(char, getUnihan) : char,
    };
}).sort((a, b) =>
    LEVEL_ORDER.indexOf(a.jlpt) - LEVEL_ORDER.indexOf(b.jlpt) ||
    (a.frequency ?? Infinity) - (b.frequency ?? Infinity) ||
    a.strokeCount - b.strokeCount ||
    a.char.codePointAt(0) - b.char.codePointAt(0)
);
const inAtlas = new Set(records.map((k) => k.char));

// ---------------------------------------------------------------------------
// Components, phonetic series, same on'yomi, look-alikes

function componentsFor(char) {
    const entry = kvgLayer[char];
    if (!entry) return [];
    const hasSound = entry.parts.some((p) => p.ph);
    return entry.parts.map((p) => {
        let role;
        if (p.ph && p.r) role = 'both';
        else if (p.ph) role = 'sound';
        else if (p.r || hasSound) role = 'meaning';
        else role = 'form';
        const component = { char: p.c, role, strokes: parseStrokeRanges(p.s) };
        const key = radicalKeyFor(p.c, p.o);
        if (key) component.radicalKey = key;
        return component;
    });
}

const onOf = (c) => kanjidic[c]?.on ?? [];
const series = buildPhoneticSeries(
    records.map((k) => ({ char: k.char, phon: kvgLayer[k.char]?.phon ?? null })),
    (c) => inAtlas.has(c),
    onOf,
);

const SAME_ON_CAP = 12;
const byOn = new Map();
for (const k of records) for (const r of k.onyomi) byOn.set(r, [...(byOn.get(r) ?? []), k.char]);

const shapes = records.filter((k) => kvgLayer[k.char]).map((k) => {
    const e = kvgLayer[k.char];
    return { char: k.char, strokeCount: e.n, types: e.t, ends: e.g, elements: e.el.map(([c, s]) => ({ char: c, strokes: expandStrokeRanges(s) })) };
});
const shapeByChar = new Map(shapes.map((s) => [s.char, s]));

const kanji = records.map((k) => {
    const phon = kvgLayer[k.char]?.phon;
    const family = phon ? series.get(phon) : null;
    return {
        ...k,
        components: componentsFor(k.char),
        phonetic: family
            ? { char: family.char, series: family.members, reading: family.reading, regular: isRegular(k.onyomi, family.reading) }
            : null,
        sameOn: k.onyomi.map((reading) => {
            const chars = byOn.get(reading).filter((c) => c !== k.char);
            return { reading, chars: chars.slice(0, SAME_ON_CAP), total: chars.length };
        }),
        lookAlikes: shapeByChar.has(k.char) ? findLookAlikes(shapeByChar.get(k.char), shapes) : [],
    };
});

// Only keep radicals that have a story or at least one kanji.
const usedKeys = new Set(kanji.map((k) => k.radical?.key).filter(Boolean));
const radicalsOut = radicals
    .filter((r) => r.hasStory || usedKeys.has(r.key))
    .map((r) => ({ ...r, kanjiCount: kanji.filter((k) => k.radical?.key === r.key).length }));

fs.mkdirSync(path.dirname(ATLAS_OUT), { recursive: true });
fs.writeFileSync(ATLAS_OUT, JSON.stringify({ kanji, radicals: radicalsOut }) + '\n');

// ---------------------------------------------------------------------------
// Slim client index: c=char, m=meanings, on/kun=readings, j=JLPT level number,
// s=strokes, f=frequency (null when unknown), a=other forms typed for this
// kanji (only the popular forms of jōyō's official 𠮟 剝 塡 頰).

const typedFormOf = new Map(Object.entries(unihan).filter(([, e]) => typeof e.joyo === 'string').map(([c, e]) => [e.joyo, c]));
const index = kanji.map((k) => {
    const entry = {
        c: k.char,
        m: k.meanings,
        on: k.onyomi,
        kun: k.kunyomi,
        j: Number(k.jlpt.slice(1)),
        s: k.strokeCount,
        f: k.frequency,
    };
    if (typedFormOf.has(k.char)) entry.a = typedFormOf.get(k.char);
    return entry;
});
fs.mkdirSync(path.dirname(INDEX_OUT), { recursive: true });
fs.writeFileSync(INDEX_OUT, JSON.stringify(index) + '\n');

// ---------------------------------------------------------------------------
// Classic practice reads lib/kanji-db.json: same entries and shape, meanings
// in KANJIDIC2 priority order (土 "soil, earth, …", not "Turkey, earth, …").

const kanjiDbOut = kanjiDb.map((entry) => {
    const meanings = kanjidic[entry.char]?.m;
    return meanings?.length ? { ...entry, meaning: meanings.join(', ') } : entry;
});
fs.writeFileSync(KANJI_DB_OUT, JSON.stringify(kanjiDbOut, null, 2) + '\n');

// ---------------------------------------------------------------------------
// Report

const kb = (file) => `${Math.round(fs.statSync(file).size / 1024)} KB`;
const count = (pred) => kanji.filter(pred).length;
const relations = {};
for (const k of kanji.filter((k) => k.joyo)) relations[k.zh?.relation ?? 'none'] = (relations[k.zh?.relation ?? 'none'] ?? 0) + 1;
const seriesCount = [...series.values()].filter((s) => s.members.length >= 2).length;

console.log(`✅ ${kanji.length} kanji (${addedJoyo.length} jōyō added: ${addedJoyo.join('')}), ${radicalsOut.length} radicals`);
console.log(`   jōyō ${count((k) => k.joyo)}, name kanji ${count((k) => k.nameKanji)}, other ${count((k) => !k.joyo && !k.nameKanji)}`);
console.log(`   radical from Kanji Alive: ${stats.alive}, from KanjiVG: ${stats.kanjivg}, unassigned: ${stats.unassigned.length}`);
if (stats.unassigned.length) console.log(`   unassigned: ${stats.unassigned.join('')}`);
console.log(`   editorial JLPT (not in kanjiapi.dev lists): ${stats.editorial.length}`);
const withWords = count((k) => k.examples.length >= 3);
console.log(`   ≥3 example words: ${withWords}/${kanji.length} (${((withWords / kanji.length) * 100).toFixed(1)}%), none: ${count((k) => !k.examples.length)}`);
console.log(`   reading alignment: ${alignStats.aligned} aligned, ${alignStats.special} special (${alignStats.flipped} newly marked)`);
console.log(`   components: ${count((k) => k.components.length)} kanji, phonetic: ${count((k) => k.phonetic)} kanji in ${seriesCount} series (≥2 members), look-alikes: ${count((k) => k.lookAlikes.length)} kanji`);
console.log(`   zh relations (jōyō): ${JSON.stringify(relations)}`);
console.log(`📝 ${path.relative(root, ATLAS_OUT)} (${kb(ATLAS_OUT)}), ${path.relative(root, INDEX_OUT)} (${kb(INDEX_OUT)}), ${path.relative(root, KANJI_DB_OUT)} (${kb(KANJI_DB_OUT)})`);
