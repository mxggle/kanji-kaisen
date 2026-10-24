// Builds the unified atlas dataset used by the browse-first pages.
//
//   lib/atlas/kanji-atlas.json   full records (server-only)
//   public/data/search-index.json slim index for client-side search
//
// Sources: lib/kanji-db.json (canonical kanji set), lib/kanji-alive-categorized.json
// (radical groups + example words), lib/compiled-stories.json (radical stories),
// lib/radical-category-map.json (themes) and public/kanjivg (radical fallback).
// Output is deterministic; re-run with `pnpm data:atlas` and commit the result.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

const kanjiDb = readJson('lib/kanji-db.json');
const kanjiAlive = readJson('lib/kanji-alive-categorized.json');
const stories = readJson('lib/compiled-stories.json').radicals;
const categoryMap = readJson('lib/radical-category-map.json');
const radicalCharMap = readJson('scripts/radical_char_map.json');

const KANJIVG_DIR = path.join(root, 'public/kanjivg/kanji');
const ATLAS_OUT = path.join(root, 'lib/atlas/kanji-atlas.json');
const INDEX_OUT = path.join(root, 'public/data/search-index.json');

// Kanji Alive group keys that are not radicals.
const NON_RADICAL_GROUPS = new Set(['n/a']);

// Story front matter describes a different character than the group it belongs to.
const DISPLAY_CHAR_OVERRIDES = { gen: '言', hoko: '戈' };

const normalizeChar = (char) => radicalCharMap[char] || char;

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
        char: DISPLAY_CHAR_OVERRIDES[key] || normalizeChar(story?.char || group?.radical_char || ''),
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

// ---------------------------------------------------------------------------
// Kanji Alive lookups

const aliveByChar = new Map();
for (const [key, group] of Object.entries(kanjiAlive)) {
    for (const k of group.kanji) aliveByChar.set(k.char, { key, kanji: k });
}

// "赤外線（せきがいせん）" -> { word, reading }. A leading "*" marks a word whose
// reading is irregular (jukujikun/ateji or a reading outside the kanji's list).
function parseExample([raw, meaning]) {
    const special = raw.startsWith('*');
    const text = special ? raw.slice(1) : raw;
    const match = text.match(/^(.*?)（(.*)）$/);
    const example = {
        word: (match ? match[1] : text).trim(),
        reading: (match ? match[2] : '').trim(),
        meaning: meaning.trim(),
    };
    if (special) example.special = true;
    return example;
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
            for (const c of [attr(tag, 'element'), attr(tag, 'original')]) {
                const key = c && charToKey.get(normalizeChar(c));
                if (key) return key;
            }
        }
    }
    return null;
}

// ---------------------------------------------------------------------------
// Kanji records

const LEVEL_ORDER = ['N5', 'N4', 'N3', 'N2', 'N1'];
const stats = { alive: 0, kanjivg: 0, unassigned: [] };

const kanji = kanjiDb.map((entry) => {
    const alive = aliveByChar.get(entry.char);
    let radicalKey = alive && !NON_RADICAL_GROUPS.has(alive.key) ? alive.key : null;
    if (radicalKey) stats.alive++;
    else {
        radicalKey = radicalFromKanjiVG(entry.char);
        if (radicalKey) stats.kanjivg++;
        else stats.unassigned.push(entry.char);
    }
    const radical = radicalKey ? radicalByKey.get(radicalKey) : null;

    return {
        char: entry.char,
        meanings: entry.meaning.split(', ').map((m) => m.trim()).filter(Boolean),
        onyomi: entry.onyomi,
        kunyomi: entry.kunyomi,
        jlpt: entry.jlpt,
        grade: entry.grade ?? null,
        strokeCount: entry.strokeCount,
        frequency: entry.frequency && entry.frequency < 9999 ? entry.frequency : null,
        radical: radical ? { key: radical.key, char: radical.char } : null,
        category: radical?.category || null,
        examples: alive ? alive.kanji.examples.map(parseExample) : [],
    };
}).sort((a, b) =>
    LEVEL_ORDER.indexOf(a.jlpt) - LEVEL_ORDER.indexOf(b.jlpt) ||
    (a.frequency ?? Infinity) - (b.frequency ?? Infinity) ||
    a.strokeCount - b.strokeCount ||
    a.char.codePointAt(0) - b.char.codePointAt(0)
);

// Only keep radicals that have a story or at least one kanji.
const usedKeys = new Set(kanji.map((k) => k.radical?.key).filter(Boolean));
const radicalsOut = radicals
    .filter((r) => r.hasStory || usedKeys.has(r.key))
    .map((r) => ({ ...r, kanjiCount: kanji.filter((k) => k.radical?.key === r.key).length }));

fs.mkdirSync(path.dirname(ATLAS_OUT), { recursive: true });
fs.writeFileSync(ATLAS_OUT, JSON.stringify({ kanji, radicals: radicalsOut }) + '\n');

// Slim client index: c=char, m=meanings, on/kun=readings, j=JLPT level number,
// s=strokes, f=frequency (null when unknown).
const index = kanji.map((k) => ({
    c: k.char,
    m: k.meanings,
    on: k.onyomi,
    kun: k.kunyomi,
    j: Number(k.jlpt.slice(1)),
    s: k.strokeCount,
    f: k.frequency,
}));
fs.mkdirSync(path.dirname(INDEX_OUT), { recursive: true });
fs.writeFileSync(INDEX_OUT, JSON.stringify(index) + '\n');

const kb = (file) => `${Math.round(fs.statSync(file).size / 1024)} KB`;
console.log(`✅ ${kanji.length} kanji, ${radicalsOut.length} radicals`);
console.log(`   radical from Kanji Alive: ${stats.alive}, from KanjiVG: ${stats.kanjivg}, unassigned: ${stats.unassigned.length}`);
if (stats.unassigned.length) console.log(`   unassigned: ${stats.unassigned.join('')}`);
console.log(`📝 ${path.relative(root, ATLAS_OUT)} (${kb(ATLAS_OUT)}), ${path.relative(root, INDEX_OUT)} (${kb(INDEX_OUT)})`);
