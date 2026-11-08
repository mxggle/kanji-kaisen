// Downloads the raw dictionary sources into the git-ignored data-cache/.
//
//   pnpm data:sources            download whatever is missing
//   pnpm data:sources --force    download everything again
//
// The files are untrusted data: later scripts parse them as text/JSON and
// never execute anything from them. `scripts/build-data-layers.mjs` trims them
// into the committed layer files (lib/core, lib/ja); `pnpm data:atlas` then
// merges the layers. A manifest with URL, size, SHA-256 and download date is
// written to data-cache/sources.json.
//
// Sources and licences:
//   KANJIDIC2         EDRDG, CC BY-SA 4.0            https://www.edrdg.org/edrdg/licence.html
//   JMdict (English)  EDRDG, CC BY-SA 4.0            (same)
//   JmdictFurigana    Doublevil, CC BY-SA 4.0        https://github.com/Doublevil/JmdictFurigana
//   Unihan            Unicode License v3             https://www.unicode.org/license.txt
//   kanjiapi.dev      JLPT lists (the source of lib/kanji-db.json's levels)

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const CACHE = path.join(root, 'data-cache');
const force = process.argv.includes('--force');
const USER_AGENT = 'kanji-kaisen-data-build/1.0 (open-source kanji atlas; one-off dataset download)';

// JmdictFurigana is pinned to a release so the build is reproducible; bump it
// deliberately. EDRDG and Unicode publish only "latest" URLs.
const FURIGANA_RELEASE = '2.3.1%2B2026-10-25';

const SOURCES = [
    { file: 'kanjidic2.xml.gz', url: 'http://ftp.edrdg.org/pub/Nihongo/kanjidic2.xml.gz' },
    { file: 'JMdict_e.gz', url: 'http://ftp.edrdg.org/pub/Nihongo/JMdict_e.gz' },
    { file: 'Unihan.zip', url: 'https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip' },
    { file: 'unicode-license.txt', url: 'https://www.unicode.org/license.txt' },
    {
        file: 'JmdictFurigana.json',
        url: `https://github.com/Doublevil/JmdictFurigana/releases/download/${FURIGANA_RELEASE}/JmdictFurigana.json`,
    },
];

const JLPT_LEVELS = [5, 4, 3, 2, 1];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function download(url) {
    for (let attempt = 1; ; attempt++) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' });
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return Buffer.from(await res.arrayBuffer());
        } catch (err) {
            if (attempt >= 3) throw new Error(`Download failed for ${url}: ${err.message}`);
            console.warn(`   retry ${attempt} for ${url}: ${err.message}`);
            await sleep(1000 * attempt);
        }
    }
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

async function main() {
    fs.mkdirSync(CACHE, { recursive: true });
    const manifestFile = path.join(CACHE, 'sources.json');
    const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : {};

    for (const { file, url } of SOURCES) {
        const dest = path.join(CACHE, file);
        if (!force && fs.existsSync(dest)) {
            console.log(`✓ ${file} (cached)`);
            continue;
        }
        console.log(`↓ ${url}`);
        const buf = await download(url);
        fs.writeFileSync(dest, buf);
        manifest[file] = { url, bytes: buf.length, sha256: sha256(buf), downloaded: new Date().toISOString() };
    }

    // Unihan ships as a zip of tab-separated text files. `unzip` only extracts
    // (it drops "../" path components); nothing in the archive is executed.
    const unihanDir = path.join(CACHE, 'unihan');
    if (force || !fs.existsSync(path.join(unihanDir, 'Unihan_Variants.txt'))) {
        fs.rmSync(unihanDir, { recursive: true, force: true });
        fs.mkdirSync(unihanDir, { recursive: true });
        execFileSync('unzip', ['-q', '-o', path.join(CACHE, 'Unihan.zip'), '-d', unihanDir], { stdio: 'inherit' });
        console.log('✓ Unihan.zip extracted');
    }

    // kanjiapi.dev JLPT lists (the source of lib/kanji-db.json's levels).
    const jlptFile = path.join(CACHE, 'kanjiapi-jlpt.json');
    if (force || !fs.existsSync(jlptFile)) {
        const lists = {};
        for (const level of JLPT_LEVELS) {
            const url = `https://kanjiapi.dev/v1/kanji/jlpt-${level}`;
            console.log(`↓ ${url}`);
            lists[`N${level}`] = JSON.parse((await download(url)).toString('utf8'));
            await sleep(200);
        }
        const buf = Buffer.from(JSON.stringify(lists));
        fs.writeFileSync(jlptFile, buf);
        manifest['kanjiapi-jlpt.json'] = {
            url: 'https://kanjiapi.dev/v1/kanji/jlpt-{1..5}',
            bytes: buf.length,
            sha256: sha256(buf),
            downloaded: new Date().toISOString(),
        };
    } else {
        console.log('✓ kanjiapi-jlpt.json (cached)');
    }

    fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
    console.log(`📝 ${path.relative(root, manifestFile)}`);
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
