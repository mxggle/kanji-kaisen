// Kanji alive helpers shared by the data scripts.

// "赤外線（せきがいせん）" -> { word, reading }. A leading "*" marks a word whose
// reading is irregular (jukujikun/ateji or a reading outside the kanji's list).
export function parseAliveExample([raw, meaning]) {
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

const SUFFIXES = ['する', 'な', 'に'];

/**
 * Word/reading pairs to try when looking up a Kanji alive example in JMdict
 * data: each "/"-separated reading (行く いく/ゆく), then without a trailing
 * する, な or に (叱責する -> 叱責, 簡潔な -> 簡潔).
 */
export function aliveLookupKeys(word, reading) {
    const keys = [];
    for (const alt of reading.split('/').map((r) => r.trim()).filter(Boolean)) {
        keys.push([word, alt]);
        for (const suffix of SUFFIXES) {
            if (word.length > suffix.length && word.endsWith(suffix) && alt.endsWith(suffix)) {
                keys.push([word.slice(0, -suffix.length), alt.slice(0, -suffix.length)]);
            }
        }
    }
    return keys;
}
