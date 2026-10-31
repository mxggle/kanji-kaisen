// Trims the raw sources in data-cache/ (see scripts/fetch-data-sources.mjs)
// into the committed layer files that `pnpm data:atlas` merges:
//
//   lib/core/unihan.json             Unihan (Unicode License v3)
//   lib/core/components.kanjivg.json KanjiVG parts, phonetic marks, stroke types (CC BY-SA 3.0)
//   lib/ja/kanjidic2.json            KANJIDIC2 meanings, readings, grade, strokes, frequency (EDRDG, CC BY-SA 4.0)
//   lib/ja/words.jmdict.json         JMdict example words + JmdictFurigana (EDRDG / Doublevil, CC BY-SA 4.0)
//   lib/ja/jlpt.kanjiapi.json        kanjiapi.dev JLPT lists (the levels lib/kanji-db.json was seeded from)
//
// Kanji set: lib/kanji-db.json plus every jōyō kanji (Unihan kJoyoKanji).
// Run: pnpm data:sources && pnpm data:layers && pnpm data:atlas
// Raw files are parsed as text; nothing in them is executed.

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

import { parseKanjiVG, topLevelParts, allElements, phoneticOf, formatStrokeRanges } from '../lib/core/kanjivg-parse.ts';
import { isCompatibilityIdeograph } from '../lib/core/zh.ts';
import { alignKanji, formatFurigana, isKana } from '../lib/ja/align.ts';
import { parseAliveExample } from './lib/kanji-alive.mjs';
import { writeLayer } from './lib/write-layer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const CACHE = path.join(root, 'data-cache');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const cached = (file) => {
    const full = path.join(CACHE, file);
    if (!fs.existsSync(full)) {
        console.error(`Missing ${path.relative(root, full)}: run \`pnpm data:sources\` first.`);
        process.exit(1);
    }
    return full;
};

const byCodePoint = (a, b) => a.codePointAt(0) - b.codePointAt(0);
const kanjiDb = readJson('lib/kanji-db.json');
const kanjiAlive = readJson('lib/kanji-alive-categorized.json');
const sources = fs.existsSync(path.join(CACHE, 'sources.json')) ? JSON.parse(fs.readFileSync(path.join(CACHE, 'sources.json'), 'utf8')) : {};

// ---------------------------------------------------------------------------
// Unihan

const UNIHAN_FIELDS = new Set([
    'kMandarin', 'kSimplifiedVariant', 'kTraditionalVariant', 'kJapaneseOldVariant',
    'kSemanticVariant', 'kZVariant', 'kTGH', 'kJoyoKanji', 'kJinmeiyoKanji', 'kIRG_TSource',
]);
const fromCodePoint = (u) => String.fromCodePoint(parseInt(u.slice(2), 16));
const variantChars = (value) => value.split(' ').map((v) => v.split('<')[0]).filter((v) => v.startsWith('U+')).map(fromCodePoint);

const unihanRaw = new Map();
for (const file of fs.readdirSync(cached('unihan')).filter((f) => f.endsWith('.txt')).sort()) {
    for (const line of fs.readFileSync(path.join(CACHE, 'unihan', file), 'utf8').split('\n')) {
        if (!line.startsWith('U+')) continue;
        const [cp, field, value] = line.split('\t');
        if (!UNIHAN_FIELDS.has(field)) continue;
        const char = fromCodePoint(cp);
        const entry = unihanRaw.get(char) ?? {};
        entry[field] = value;
        unihanRaw.set(char, entry);
    }
}
const unihanVersion = fs.readFileSync(path.join(CACHE, 'unihan', 'Unihan_Variants.txt'), 'utf8').match(/Unicode Version ([\d.]+)/)?.[1];

const joyoOfficial = [...unihanRaw].filter(([, e]) => e.kJoyoKanji === '2010').map(([c]) => c);

// ---------------------------------------------------------------------------
// Kanji set

const kanjiSet = [...new Set([...kanjiDb.map((k) => k.char), ...joyoOfficial])].sort(byCodePoint);
const inSet = new Set(kanjiSet);
console.log(`Kanji set: ${kanjiSet.length} (${kanjiDb.length} in kanji-db + ${kanjiSet.length - kanjiDb.length} jōyō added)`);

// ---------------------------------------------------------------------------
// lib/core/unihan.json: the kanji set plus the variant forms the zh
// classification looks at (traditional forms, their simplified forms).

function trimUnihan(char) {
    const raw = unihanRaw.get(char);
    if (!raw) return null;
    const out = {};
    if (raw.kMandarin) out.m = raw.kMandarin.split(' ');
    if (raw.kSimplifiedVariant) out.s = variantChars(raw.kSimplifiedVariant);
    if (raw.kTraditionalVariant) out.t = variantChars(raw.kTraditionalVariant);
    if (raw.kJapaneseOldVariant) {
        const old = variantChars(raw.kJapaneseOldVariant).filter((c) => !isCompatibilityIdeograph(c));
        if (old.length) out.jo = old;
    }
    if (raw.kZVariant) out.z = variantChars(raw.kZVariant).filter((c) => c !== char);
    if (raw.kSemanticVariant) out.sv = variantChars(raw.kSemanticVariant).filter((c) => c !== char);
    if (raw.kTGH) out.tgh = 1;
    // Taiwan standard (CNS 11643 planes 1-2).
    if (/^T[12]-/.test(raw.kIRG_TSource ?? '')) out.tw = 1;
    if (raw.kJoyoKanji) out.joyo = raw.kJoyoKanji === '2010' ? 1 : variantChars(raw.kJoyoKanji)[0];
    if (raw.kJinmeiyoKanji) out.jinmei = 1;
    return out;
}

const unihanChars = new Set(kanjiSet);
for (const char of kanjiSet) {
    const e = trimUnihan(char);
    if (!e) continue;
    const near = (x) => [...(x?.jo ?? []), ...(x?.t ?? []), ...(x?.s ?? []), ...(x?.z ?? []), ...(x?.sv ?? [])];
    for (const v of near(e)) {
        unihanChars.add(v);
        const ve = trimUnihan(v);
        for (const w of [...(ve?.s ?? []), ...(ve?.z ?? []), ...(ve?.sv ?? [])]) {
            unihanChars.add(w);
            for (const x of trimUnihan(w)?.s ?? []) unihanChars.add(x);
        }
    }
}
const unihanOut = {};
for (const char of [...unihanChars].sort(byCodePoint)) {
    const e = trimUnihan(char);
    if (!e || !Object.keys(e).length) continue;
    // Related forms only need what the classifier reads.
    if (!inSet.has(char)) {
        delete e.t;
        delete e.jo;
        delete e.joyo;
        delete e.jinmei;
    }
    unihanOut[char] = e;
}

fs.copyFileSync(cached('unicode-license.txt'), path.join(root, 'lib/core/UNICODE-LICENSE.txt'));
writeLayer('lib/core/unihan.json', {
    source: `Unihan database, Unicode ${unihanVersion}, https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip`,
    license: 'Unicode License v3 (see lib/core/UNICODE-LICENSE.txt)',
    note: 'Trimmed by scripts/build-data-layers.mjs. Keys: m kMandarin, s kSimplifiedVariant, t kTraditionalVariant, jo kJapaneseOldVariant (compatibility ideographs removed), z kZVariant, sv kSemanticVariant (source tags dropped), tgh in kTGH (PRC 通用规范汉字表), tw kIRG_TSource in CNS 11643 plane 1 or 2, joyo kJoyoKanji (1 or the official form), jinmei kJinmeiyoKanji. Characters outside the atlas set are variant forms and keep only m, s, z, sv, tgh, tw.',
}, 'chars', unihanOut);

// ---------------------------------------------------------------------------
// KANJIDIC2

const decodeXml = (text) => text
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const all = (block, re) => [...block.matchAll(re)].map((m) => decodeXml(m[1]));

const kanjidicXml = zlib.gunzipSync(fs.readFileSync(cached('kanjidic2.xml.gz'))).toString('utf8');
const kanjidicVersion = {
    database: kanjidicXml.match(/<database_version>(.*?)<\/database_version>/)?.[1],
    created: kanjidicXml.match(/<date_of_creation>(.*?)<\/date_of_creation>/)?.[1],
};
const kanjidic = new Map();
for (const [, block] of kanjidicXml.matchAll(/<character>([\s\S]*?)<\/character>/g)) {
    const char = block.match(/<literal>(.*?)<\/literal>/)[1];
    const grade = block.match(/<grade>(\d+)<\/grade>/)?.[1];
    const strokes = block.match(/<stroke_count>(\d+)<\/stroke_count>/)?.[1];
    const freq = block.match(/<freq>(\d+)<\/freq>/)?.[1];
    kanjidic.set(char, {
        m: all(block, /<meaning>([^<]*)<\/meaning>/g),
        on: all(block, /<reading r_type="ja_on">([^<]*)<\/reading>/g),
        kun: all(block, /<reading r_type="ja_kun">([^<]*)<\/reading>/g),
        g: grade ? Number(grade) : null,
        s: strokes ? Number(strokes) : null,
        f: freq ? Number(freq) : null,
    });
}
const readingsOf = (char) => {
    const k = kanjidic.get(char);
    return k ? { on: k.on, kun: k.kun } : null;
};

// ---------------------------------------------------------------------------
// lib/core/components.kanjivg.json

const KANJIVG_DIR = path.join(root, 'public/kanjivg/kanji');
const kvgFile = (char) => path.join(KANJIVG_DIR, `${char.codePointAt(0).toString(16).padStart(5, '0')}.svg`);
const componentsOut = {};
const SMALL_KANJI_STROKES = 6;
const phonHeads = new Set();
let phonCount = 0;
for (const char of kanjiSet) {
    if (!fs.existsSync(kvgFile(char))) continue;
    const tree = parseKanjiVG(fs.readFileSync(kvgFile(char), 'utf8'));
    if (!tree) continue;
    const entry = {
        n: tree.strokeCount,
        t: tree.types,
        parts: topLevelParts(tree).map((p) => {
            const part = { c: p.char, s: formatStrokeRanges(p.strokes) };
            if (p.original) part.o = p.original;
            if (p.radical) part.r = p.radical;
            if (p.phon) part.ph = p.phon;
            return part;
        }),
        el: allElements(tree).map((e) => [e.char, formatStrokeRanges(e.strokes)]),
    };
    // Stroke start/end points of small kanji, for look-alikes like 土/士 that
    // KanjiVG does not split into components.
    if (tree.strokeCount <= SMALL_KANJI_STROKES) entry.g = tree.ends.map((p) => p.map(Math.round));
    const phon = phoneticOf(tree);
    if (phon) {
        entry.phon = phon;
        phonHeads.add(phon);
        phonCount++;
    }
    componentsOut[char] = entry;
}
writeLayer('lib/core/components.kanjivg.json', {
    source: 'KanjiVG (c) Ulrich Apel, https://kanjivg.tagaini.net; derived from public/kanjivg/kanji/*.svg',
    license: 'CC BY-SA 3.0 (see public/kanjivg/COPYING)',
    note: 'Derived by scripts/build-data-layers.mjs. n stroke count, t first char of each kvg:type, parts = top-level components (c char, s 1-based stroke ranges, o kvg:original, r kvg:radical, ph phonetic from a real kvg:phon attribute), el = every named element [char, stroke ranges], phon = outermost phonetic, g = [x0, y0, x1, y1] start/end point of each stroke in the 109-unit box (kanji of 6 strokes or fewer).',
}, 'kanji', componentsOut);
console.log(`KanjiVG: ${Object.keys(componentsOut).length} kanji, ${phonCount} with a phonetic mark, ${phonHeads.size} distinct phonetics`);

// ---------------------------------------------------------------------------
// lib/ja/kanjidic2.json: the kanji set, plus on'yomi of phonetics outside it
// (used for the shared reading of a phonetic series).

const kanjidicOut = {};
for (const char of [...new Set([...kanjiSet, ...phonHeads])].sort(byCodePoint)) {
    const k = kanjidic.get(char);
    if (!k) continue;
    if (inSet.has(char)) kanjidicOut[char] = k;
    else if (k.on.length) kanjidicOut[char] = { on: k.on };
}
writeLayer('lib/ja/kanjidic2.json', {
    source: `KANJIDIC2 (database ${kanjidicVersion.database}, ${kanjidicVersion.created}), Electronic Dictionary Research and Development Group, http://www.edrdg.org/wiki/index.php/KANJIDIC_Project`,
    license: 'CC BY-SA 4.0, https://www.edrdg.org/edrdg/licence.html',
    note: 'Trimmed by scripts/build-data-layers.mjs. m English meanings in KANJIDIC2 order, on/kun readings in KANJIDIC2 order, g grade, s stroke count, f Mainichi frequency rank. Characters outside the atlas set keep only on (phonetic series readings).',
}, 'kanji', kanjidicOut);

// ---------------------------------------------------------------------------
// lib/ja/jlpt.kanjiapi.json

const jlptLists = JSON.parse(fs.readFileSync(cached('kanjiapi-jlpt.json'), 'utf8'));
const jlptOut = {};
for (const level of ['N5', 'N4', 'N3', 'N2', 'N1']) jlptOut[level] = [...jlptLists[level]].sort(byCodePoint).join('');
writeLayer('lib/ja/jlpt.kanjiapi.json', {
    source: 'kanjiapi.dev /v1/kanji/jlpt-{5..1} (based on Jonathan Waller\'s JLPT lists; unofficial, there is no official post-2010 list)',
    license: 'kanjiapi.dev data is from KANJIDIC2 (EDRDG, CC BY-SA 4.0) and Waller\'s lists (CC BY)',
    note: 'Kanji per level, concatenated. Kanji not listed get an editorial level in the atlas (jlptEditorial).',
}, 'levels', jlptOut);

// ---------------------------------------------------------------------------
// JMdict + JmdictFurigana -> lib/ja/words.jmdict.json

const furiganaText = fs.readFileSync(cached('JmdictFurigana.json'), 'utf8').replace(/^﻿/, '');
const furigana = new Map();
for (const { text, reading, furigana: segments } of JSON.parse(furiganaText)) {
    furigana.set(`${text}|${reading}`, segments.map((s) => (s.rt ? { ruby: s.ruby, rt: s.rt } : { ruby: s.ruby })));
}

const PRIMARY_PRI = new Set(['news1', 'ichi1', 'spec1']);
const SECONDARY_PRI = new Set(['news2', 'ichi2', 'spec2', 'gai1', 'gai2']);
const BAD_KANJI_INF = new Set(['iK', 'oK', 'rK', 'sK', 'io']);
const BAD_KANA_INF = new Set(['ik', 'ok', 'rk', 'sk']);
const NEVER_MISC = new Set(['vulg', 'X', 'derog', 'sens', 'arch', 'obs']);
// Example words are shown to learners and in classrooms.
const UNSUITABLE_GLOSS = /\b(erotic\w*|sex|sexual\w*|porn\w*|prostitut\w*|brothel\w*|genital\w*|penis|vagina\w*|masturbat\w*|whore\w*)\b/i;
// Jōyō's official forms (剝 𠮟 塡 頰) are tagged rK in JMdict, where the
// popular forms (剥 叱 填 頬) carry the priority tags. Accept an official-form
// spelling with the priority of its popular-form twin.
const OFFICIAL_FORM = new Map([...unihanRaw].filter(([, e]) => e.kJoyoKanji?.startsWith('U+')).map(([c, e]) => [c, variantChars(e.kJoyoKanji)[0]]));
const toPopular = (text) => [...text].map((c) => [...OFFICIAL_FORM].find(([, o]) => o === c)?.[0] ?? c).join('');
const ent = (text) => text.replace(/^&|;$/g, '');

const jmdictXml = zlib.gunzipSync(fs.readFileSync(cached('JMdict_e.gz'))).toString('utf8');
const jmdictDate = jmdictXml.match(/<!-- JMdict created: ([\d-]+) -->/)?.[1];

// kanji -> candidate words
const candidates = new Map(kanjiSet.map((c) => [c, []]));
let entryCount = 0;
for (const [, block] of jmdictXml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    entryCount++;
    const seq = Number(block.match(/<ent_seq>(\d+)<\/ent_seq>/)[1]);
    const kEles = [...block.matchAll(/<k_ele>([\s\S]*?)<\/k_ele>/g)].map(([, k]) => ({
        keb: decodeXml(k.match(/<keb>([^<]*)<\/keb>/)[1]),
        inf: all(k, /<ke_inf>([^<]*)<\/ke_inf>/g).map(ent),
        pri: all(k, /<ke_pri>([^<]*)<\/ke_pri>/g),
    }));
    if (!kEles.length) continue;
    const rEles = [...block.matchAll(/<r_ele>([\s\S]*?)<\/r_ele>/g)].map(([, r]) => ({
        reb: decodeXml(r.match(/<reb>([^<]*)<\/reb>/)[1]),
        nokanji: r.includes('<re_nokanji'),
        restr: all(r, /<re_restr>([^<]*)<\/re_restr>/g),
        inf: all(r, /<re_inf>([^<]*)<\/re_inf>/g).map(ent),
    }));
    const senses = [...block.matchAll(/<sense>([\s\S]*?)<\/sense>/g)].map(([, s]) => ({
        stagk: all(s, /<stagk>([^<]*)<\/stagk>/g),
        stagr: all(s, /<stagr>([^<]*)<\/stagr>/g),
        misc: all(s, /<misc>([^<]*)<\/misc>/g).map(ent),
        gloss: all(s, /<gloss(?: [^>]*)?>([^<]*)<\/gloss>/g),
    }));

    const seenKeb = new Set();
    for (const k of kEles) {
        if (seenKeb.has(k.keb)) continue;
        const popularTwin = toPopular(k.keb) !== k.keb ? kEles.find((o) => o.keb === toPopular(k.keb)) : undefined;
        const pri = popularTwin ? popularTwin.pri : k.pri;
        const badInf = k.inf.filter((i) => BAD_KANJI_INF.has(i) && !(popularTwin && i === 'rK'));
        if (badInf.length) continue;
        seenKeb.add(k.keb);
        const kanjiInWord = [...new Set([...k.keb].filter((c) => inSet.has(c)))];
        if (!kanjiInWord.length) continue;
        const r = rEles.find((re) => !re.nokanji && (!re.restr.length || re.restr.includes(k.keb)) && !re.inf.some((i) => BAD_KANA_INF.has(i)));
        if (!r) continue;
        const sense = senses.find((s) => (!s.stagk.length || s.stagk.includes(k.keb)) && (!s.stagr.length || s.stagr.includes(r.reb)));
        if (!sense || !sense.gloss.length || sense.misc.some((m) => NEVER_MISC.has(m))) continue;
        if (sense.gloss.some((g) => UNSUITABLE_GLOSS.test(g))) continue;
        const tier = pri.some((p) => PRIMARY_PRI.has(p)) ? 1 : pri.some((p) => SECONDARY_PRI.has(p)) ? 2 : 3;
        const nf = Number(pri.find((p) => p.startsWith('nf'))?.slice(2) ?? 99);
        const word = {
            seq,
            text: k.keb,
            reading: r.reb,
            gloss: sense.gloss.slice(0, 3).join('; '),
            tier,
            nf,
            length: [...k.keb].length,
            usuallyKana: sense.misc.includes('uk'),
            rare: sense.misc.includes('rare'),
            irregular: k.inf.includes('ateji') || r.inf.includes('gikun'),
            // Every other kanji in the word is one the atlas teaches.
            clean: [...k.keb].every((c) => isKana(c) || inSet.has(c) || c === '々'),
        };
        for (const char of kanjiInWord) candidates.get(char).push(word);
    }
}
console.log(`JMdict: ${entryCount} entries (${jmdictDate})`);

const rank = (a, b) => a.tier - b.tier || a.length - b.length || a.nf - b.nf || a.seq - b.seq;

const aliveByChar = new Map();
for (const [key, group] of Object.entries(kanjiAlive)) {
    if (key === 'n/a') continue;
    for (const k of group.kanji) aliveByChar.set(k.char, k.examples.map(parseAliveExample));
}

const align = (word, char) => {
    if (word.irregular) return null;
    return alignKanji(word.text, word.reading, char, readingsOf, furigana.get(`${word.text}|${word.reading}`));
};

const MAX_WORDS = 8;
const ALIVE_ENOUGH = 6;
const MIN_WORDS = 3;
const SECONDARY_FILL = 6;
const wordTable = new Map(); // "text|reading" -> [text, reading, furigana, gloss?]
const wordKey = (text, reading) => `${text}|${reading}`;
const addWord = (text, reading, gloss) => {
    const key = wordKey(text, reading);
    if (!wordTable.has(key)) {
        const segments = furigana.get(key);
        wordTable.set(key, [text, reading, segments ? formatFurigana(segments) : [], gloss ?? '']);
    }
    return key;
};

const picksByKanji = {};
const stats = { kanji: 0, withMin: 0, secondary: 0, fallback: 0, words: 0, short: [] };
for (const char of kanjiSet) {
    const alive = aliveByChar.get(char) ?? [];
    // Alive words need furigana in the table so the atlas can align them.
    alive.forEach((e) => e.reading && addWord(e.word, e.reading));
    stats.kanji++;
    const aliveWords = new Set(alive.map((e) => e.word));
    const readings = readingsOf(char);
    const picks = [];
    if (alive.length < ALIVE_ENOUGH) {
        const target = MAX_WORDS - alive.length;
        const pool = candidates.get(char).filter((w) => !aliveWords.has(w.text)).sort(rank);
        // One spelling per JMdict entry (俺ら and 俺等 are the same word).
        const used = new Set();
        const isUsed = (w) => used.has(w.text) || used.has(w.seq);
        const take = (w, limit = target) => {
            if (picks.length >= limit || isUsed(w)) return;
            used.add(w.text);
            used.add(w.seq);
            picks.push(w);
        };
        const covered = new Set(
            alive.map((e) => (e.special ? null : alignKanji(e.word, e.reading, char, readingsOf, furigana.get(wordKey(e.word, e.reading)))?.reading)).filter(Boolean),
        );
        // Words usually written in kana (𠮟る) go after the others.
        const kanaLast = (a, b) => (a.usuallyKana ? 1 : 0) - (b.usuallyKana ? 1 : 0) || rank(a, b);
        const primary = pool.filter((w) => w.tier === 1 && w.clean && !w.rare).sort(kanaLast);
        // 1. One word for each reading the Kanji alive words don't show yet.
        for (const reading of readings ? [...readings.on, ...readings.kun] : []) {
            if (covered.has(reading)) continue;
            const hit = primary.find((w) => !isUsed(w) && align(w, char)?.reading === reading);
            if (hit) take(hit);
        }
        // 2. Fill with the shortest, most common words.
        primary.forEach((w) => take(w));
        // 3. Few primary words: secondary priority words (news2, ichi2, spec2, gai) up to SECONDARY_FILL.
        const secondaryLimit = Math.min(target, SECONDARY_FILL - alive.length);
        if (picks.length < secondaryLimit) {
            const before = picks.length;
            pool.filter((w) => w.tier === 2 && w.clean && !w.rare).sort(kanaLast).forEach((w) => take(w, secondaryLimit));
            if (picks.length > before) stats.secondary++;
        }
        // 4. Rare kanji: fall back to any other word until there are MIN_WORDS.
        if (alive.length + picks.length < MIN_WORDS) {
            const before = picks.length;
            const fallback = pool.filter((w) => !isUsed(w) && !w.rare).sort((a, b) => (a.clean ? 0 : 1) - (b.clean ? 0 : 1) || kanaLast(a, b));
            for (const w of fallback) take(w, MIN_WORDS - alive.length);
            if (picks.length > before) stats.fallback++;
        }
        picks.sort(rank);
    }
    picksByKanji[char] = picks.map((w) => addWord(w.text, w.reading, w.gloss));
    stats.words += picks.length;
    if (alive.length + picks.length >= MIN_WORDS) stats.withMin++;
    else stats.short.push(char);
}

const keys = [...wordTable.keys()].sort();
const indexOf = new Map(keys.map((k, i) => [k, i]));
writeLayer('lib/ja/words.jmdict.json', {
    source: `JMdict (${jmdictDate}), Electronic Dictionary Research and Development Group, https://www.edrdg.org/jmdict/j_jmdict.html; furigana from JmdictFurigana ${decodeURIComponent('2.3.1%2B2026-10-25')} (Doublevil), https://github.com/Doublevil/JmdictFurigana`,
    license: 'CC BY-SA 4.0 (JMdict: https://www.edrdg.org/edrdg/licence.html; JmdictFurigana: https://github.com/Doublevil/JmdictFurigana)',
    note: 'Built by scripts/build-data-layers.mjs. words = [text, reading, furigana segments ("ruby:rt" or plain kana), English gloss ("" for Kanji alive words, which carry their own)]. byKanji = indexes into words of the JMdict words added after the Kanji alive examples: priority words (news1/ichi1/spec1) only, one per reading not yet shown, then shortest and most common first, up to 8 words in all; when those run out, secondary priority words (news2/ichi2/spec2/gai) up to 6 in all, and untagged words until a kanji has 3.',
}, 'words', keys.map((k) => wordTable.get(k)), {
    byKanji: Object.fromEntries(Object.entries(picksByKanji).filter(([, v]) => v.length).map(([c, v]) => [c, v.map((k) => indexOf.get(k))])),
});
console.log(`Words: ${stats.words} JMdict words added, ${wordTable.size} in the table; ${stats.withMin}/${stats.kanji} kanji have ≥${MIN_WORDS} words (secondary words for ${stats.secondary}, fallback for ${stats.fallback})`);
console.log(`   fewer than ${MIN_WORDS}: ${stats.short.join('')}`);
if (sources['JMdict_e.gz']) console.log(`Sources downloaded ${sources['JMdict_e.gz'].downloaded}`);
