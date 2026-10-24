import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const kanjiAlive = JSON.parse(readFileSync(new URL("./kanji-alive-categorized.json", import.meta.url), "utf8"));
const kanjiDb = JSON.parse(readFileSync(new URL("./kanji-db.json", import.meta.url), "utf8"));

// Checkpoints are generated from kanji-alive groups; LearningModal looks each
// kanji up in KANJI_DATA (kanji-db), so every one of them must exist there.
test("every checkpoint kanji exists in KANJI_DATA", () => {
    const known = new Set(kanjiDb.map((k) => k.char));
    const missing = [];

    for (const group of Object.values(kanjiAlive)) {
        for (const kanji of group.kanji) {
            if (!known.has(kanji.char)) missing.push(kanji.char);
        }
    }

    assert.deepEqual(missing, []);
});

test("kanji-db has no duplicate characters", () => {
    const chars = kanjiDb.map((k) => k.char);
    assert.equal(new Set(chars).size, chars.length);
});
