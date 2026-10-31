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
