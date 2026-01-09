import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../lib/kanji-db.json');

const BASE_URL = 'https://kanjiapi.dev/v1/kanji';
const BATCH_SIZE = 20; // Increased to speed up fetching
const DELAY_MS = 100;

const JLPT_LEVELS = ['jlpt-5', 'jlpt-4', 'jlpt-3', 'jlpt-2', 'jlpt-1'];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJLPTList(level) {
    console.log(`Fetching ${level} kanji list...`);
    const response = await fetch(`${BASE_URL}/${level}`);
    if (!response.ok) throw new Error(`Failed to fetch ${level} list: ${response.statusText}`);
    return await response.json();
}

async function fetchAllJLPTKanji() {
    const allKanji = new Set();
    for (const level of JLPT_LEVELS) {
        const list = await fetchJLPTList(level);
        console.log(`Found ${list.length} kanji in ${level}`);
        list.forEach(k => allKanji.add(k));
        await sleep(DELAY_MS);
    }
    return Array.from(allKanji);
}

async function fetchKanjiDetails(char) {
    try {
        const response = await fetch(`${BASE_URL}/${encodeURIComponent(char)}`);
        if (!response.ok) {
            console.error(`Failed to fetch details for ${char}: ${response.statusText}`);
            return null;
        }
        return await response.json();
    } catch (e) {
        console.error(`Error fetching ${char}:`, e);
        return null;
    }
}

function normalizeKanjiData(apiData) {
    // JLPT level from API is a number (1-5), our app uses "N1"-"N5" string
    // Freq from API (mainichi_shinbun) can be null.
    // Our app expects:
    // char: string;
    // meaning: string;
    // onyomi: string[];
    // kunyomi: string[];
    // jlpt: JLPTRank;
    // strokeCount: number;
    // frequency: number;
    // grade?: number;

    const jlpt = apiData.jlpt ? `N${apiData.jlpt}` : "N1"; // Default to N1/Hardest if unknown? Or filter them out? 
    // Joyo kanji should have levels usually.

    // Meanings: array to single string
    const meaning = apiData.meanings.join(", ");

    return {
        char: apiData.kanji,
        meaning: meaning,
        onyomi: apiData.on_readings,
        kunyomi: apiData.kun_readings,
        jlpt: jlpt,
        strokeCount: apiData.stroke_count,
        frequency: apiData.freq_mainichi_shinbun || 9999, // Fallback for sort
        grade: apiData.grade
    };
}

async function main() {
    try {
        const fullList = await fetchAllJLPTKanji();
        console.log(`Total unique kanji to process: ${fullList.length}`);

        const results = [];
        // Process in batches
        for (let i = 0; i < fullList.length; i += BATCH_SIZE) {
            const batch = fullList.slice(i, i + BATCH_SIZE);
            if (i % 100 === 0) { // Log less frequently to reduce noise
                console.log(`Processing batch ${i / BATCH_SIZE + 1}/${Math.ceil(fullList.length / BATCH_SIZE)}: ${batch.join('')}`);
            }

            const promises = batch.map(char => fetchKanjiDetails(char));
            const batchData = await Promise.all(promises);

            for (const data of batchData) {
                if (data) {
                    results.push(normalizeKanjiData(data));
                }
            }

            await sleep(DELAY_MS);
        }

        // Sort by frequency (asc) so the default view is logical
        results.sort((a, b) => a.frequency - b.frequency);

        console.log(`Writing ${results.length} kanji to ${OUTPUT_FILE}...`);
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
        console.log('Done!');

    } catch (error) {
        console.error('Script failed:', error);
        process.exit(1);
    }
}

main();
