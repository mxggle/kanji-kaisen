import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../kanji_alive_media/language-data/ka_data.csv');
const OUTPUT_FILE = path.join(__dirname, '../lib/kanji-alive-categorized.json');
const RADICAL_MAP_PATH = path.join(__dirname, 'radical_char_map.json');

function parseCSVLine(line) {
    const fields = [];
    let currentField = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (inQuote) {
            if (char === '"') {
                if (nextChar === '"') {
                    currentField += '"';
                    i++; // Skip next quote
                } else {
                    inQuote = false;
                }
            } else {
                currentField += char;
            }
        } else {
            if (char === '"') {
                inQuote = true;
            } else if (char === ',') {
                fields.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }
    fields.push(currentField);
    return fields;
}

function normalizeExamples(exampleString) {
    if (!exampleString) return [];
    try {
        // examples are like "[ [ ""xx"", ""yy"" ], ... ]"
        // We can try to clean it up to be valid JSON or just parse manually if it's messy.
        // The CSV parser inside parseCSVLine handles the outer double quotes.
        // So exampleString here is: [ [ "一年生（いちねんせい）", "first-year student" ], ... ]
        // This looks like valid JSON if we replace single quotes if any? 
        // Actually it seems to be valid JSON format `[[ "str", "str"], ...]`
        return JSON.parse(exampleString);
    } catch (e) {
        // console.warn("Failed to parse examples:", exampleString);
        return [];
    }
}

function main() {
    console.log(`Reading CSV from ${CSV_PATH}...`);
    const radicalMap = JSON.parse(fs.readFileSync(RADICAL_MAP_PATH, 'utf8'));
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = content.split(/\r?\n/);

    // Header: kanji,kname,kstroke,kmeaning,kgrade,kunyomi_ja,kunyomi,onyomi_ja,onyomi,examples,radical,rad_order,rad_stroke,rad_name_ja,rad_name,rad_meaning,rad_position_ja,rad_position
    const headers = parseCSVLine(lines[0]);
    // Map headers to indices
    const h = {};
    headers.forEach((key, index) => h[key] = index);

    const categorized = {};
    const keyMap = {}; // Map "radicalName_radicalChar" -> uniqueKey
    let count = 0;



    // Skip header and empty lines
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const cols = parseCSVLine(lines[i]);
        if (cols.length < headers.length) continue;

        const char = cols[h['kanji']];
        const radicalName = cols[h['rad_name']]; // e.g. "water"
        let radicalChar = cols[h['radical']].trim(); // e.g. "氵"
        const radicalMeaning = cols[h['rad_meaning']];

        // Map variant names to standard parent names when visually identical
        const NAME_NORMALIZATION = {

            'kihen': 'ki', // Tree
            'hihen': 'hi', // Fire (but not Rekka)
            'tsuchihen': 'tsuchi', // Earth
            'kanehen': 'kane', // Metal
            'onnahen': 'onna', // Woman
            'kuchihen': 'kuchi', // Mouth
            'kohen': 'ko', // Child
            'tsukihen': 'tsuki', // Moon
            'katahen': 'kata', // Split wood
            'yumihen': 'yumi', // Bow
            'umahen': 'uma', // Horse
            'kaihen': 'kai', // Shell
            'torihen': 'tori', // Bird
            'kurumahen': 'kuruma', // Car
            'shokuhen': 'shoku', // Eat
            'mehen': 'me', // Eye
            'mimihen': 'mimi', // Ear
            'satohen': 'sato', // Village
            'itohen': 'ito', // Thread
            'komehen': 'kome', // Rice
            'funehen': 'fune', // Boat
            'ishihen': 'ishi', // Stone
            'tsunohen': 'tsuno', // Horn
            'ashihen': 'ashi', // Foot
            'hawa': 'ha', // Tooth? "ha"
            'hahw': 'ha', // Typo check?
            'oogai': 'oogai', // Keep distinct
        };

        if (NAME_NORMALIZATION[radicalName]) {
            // We modify radicalName effectively merging them
            // But we must also ensure we use the same key in the end
            // The key derivation uses `radicalName`.
            // So we can overwrite `radicalName` variable here? 
            // Yes, but `radicalName` is const line 83. We need to change that.
        }


        // Replace known PUA/Kangxi characters with standard CJK Unified Ideographs
        if (radicalMap[radicalChar]) {
            radicalChar = radicalMap[radicalChar];
        }

        const REPLACEMENT_MAP = {
            // Tree (Ki)
            '\uE720': '木',
            '\u2F4A': '木',
            '\u2E8E': '木',

            // Moon (Tsuki)
            '\u2F49': '月',
            '\u2E9D': '月',

            // Fire (Hi)
            // '\uE722': '火', // WAS MAPPED WRONG? E722 appears to be Rice Left in this dataset!
            '\u2F55': '火',

            // Earth (Tsuchi)
            '\u2F1F': '土',

            // Metal/Gold (Kane)
            '\u2F9C': '金',

            // Woman (Onna)
            '\u2F25': '女',

            // Mouth (Kuchi)
            '\u2F1D': '口',

            // Child (Ko)
            '\u2F26': '子',

            // Split Wood (Kata)
            '\u2F5A': '片',
            '\uE718': '片',

            // Meat/Flesh (Nikuzuki)
            '\uE758': '月',
            '\u2F81': '肉',

            // Step (Gyouninben)
            '\u2F3B': '彳',

            // Plow (Raisuki)
            '\u2F7E': '耒',

            // Steam (Kigamae)
            '\u2F53': '气',

            // Table (Kinyou)
            '\u2F0F': '几',

            // Yellow (Ki)
            '\u2EE9': '黄',
            '\u2FCA': '黄',
        };


        if (REPLACEMENT_MAP[radicalChar]) {

            radicalChar = REPLACEMENT_MAP[radicalChar];
        }

        // Normalize Name
        let finalName = radicalName;
        if (NAME_NORMALIZATION[radicalName]) {
            finalName = NAME_NORMALIZATION[radicalName];
        }

        // SAFETY OVERRIDES: Fix known data issues where radical char is wrong
        const CHAR_OVERRIDES = {
            'kome': '米', // Rice
            'kuro': '黒', // Black
            'mizu': '水', // Water (generic)
        };

        if (CHAR_OVERRIDES[finalName]) {
            radicalChar = CHAR_OVERRIDES[finalName];
        }




        if (!char || !finalName) continue;

        const uniqueId = `${finalName}_${radicalChar}`;
        let key = keyMap[uniqueId];


        if (!key) {
            // Determine new key
            if (!categorized[finalName]) {
                key = finalName;
            } else {

                // Collision!
                // If the radical char is the same, reuse the key!
                if (categorized[finalName].radical_char === radicalChar) {
                    key = finalName;
                } else {
                    const suffix = radicalMeaning ? radicalMeaning.split(',')[0].trim().replace(/\s+/g, '_').toLowerCase() : 'alt';
                    key = `${finalName}_${suffix}`;

                    // If even THAT exists (rare), just append char code
                    if (categorized[key] && categorized[key].radical_char !== radicalChar) {
                        key = `${finalName}_${radicalChar}`;
                    } else if (categorized[key] && categorized[key].radical_char === radicalChar) {
                        // Same char, same suffix -> merge
                    }
                }
            }
            keyMap[uniqueId] = key;

            // Initialize if new
            if (!categorized[key]) {
                categorized[key] = {
                    radical_char: radicalChar,
                    radical_meaning: radicalMeaning, // Added meaning
                    kanji: []
                };
            }
        }

        categorized[key].kanji.push({
            char: char,
            stroke: parseInt(cols[h['kstroke']]) || 0,
            meaning: cols[h['kmeaning']],
            grade: parseInt(cols[h['kgrade']]) || null,
            onyomi: cols[h['onyomi_ja']],
            kunyomi: cols[h['kunyomi_ja']],
            examples: normalizeExamples(cols[h['examples']])
        });

        count++;
    }


    console.log(`Processed ${count} kanji.`);
    console.log(`Found ${Object.keys(categorized).length} radical categories.`);

    // Sort categories alphabetically
    const sortedCategorized = {};
    Object.keys(categorized).sort().forEach(key => {
        sortedCategorized[key] = categorized[key];
    });

    console.log(`Writing to ${OUTPUT_FILE}...`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(sortedCategorized, null, 2));
    console.log("Done.");
}

main();
