import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { byteCapacity, dataCodewords, encodeQr, qrPath, reedSolomonDivisor, reedSolomonRemainder } from "./qr.ts";

const rows = (qr) => qr.modules.map((r) => r.map((dark) => (dark ? "1" : "0")).join(""));
const hash = (qr) => createHash("sha256").update(rows(qr).join("\n")).digest("hex");

// Reference symbols were produced by Apple CoreImage's CIQRCodeGenerator
// (level M, byte mode), with its 1-module margin removed.
const SEA_V1_MASK2 = [
    "111111100110101111111",
    "100000100011101000001",
    "101110101001101011101",
    "101110101110101011101",
    "101110101110101011101",
    "100000101111001000001",
    "111111101010101111111",
    "000000001000000000000",
    "101111100111001111100",
    "001000010001111001111",
    "010101101010101101101",
    "100111001101111000001",
    "011010111100100101010",
    "000000001010100101101",
    "111111100111010011011",
    "100000101100000110111",
    "101110101011010010100",
    "101110101011111001000",
    "101110101100101100000",
    "100000100011111001000",
    "111111101100100100110",
];

const KANJI = "海泳流港湖波洗深休体住作使便信借働億優仕他付代令以仲件任伝似位低何余価例供依係保個候修倒値停側偉偏傷像僕";

test("Reed–Solomon matches the 1-M HELLO WORLD example", () => {
    const data = [32, 91, 11, 120, 209, 114, 220, 77, 67, 64, 236, 17, 236, 17, 236, 17];
    assert.deepEqual(reedSolomonRemainder(data, reedSolomonDivisor(10)), [196, 35, 39, 119, 235, 215, 231, 226, 93, 23]);
});

test("level M capacities match the standard tables", () => {
    assert.equal(dataCodewords(1), 16);
    assert.equal(dataCodewords(10), 216);
    assert.equal(dataCodewords(40), 2334);
    assert.equal(byteCapacity(1), 14);
    assert.equal(byteCapacity(9), 180);
    assert.equal(byteCapacity(10), 213);
    assert.equal(byteCapacity(40), 2331);
});

test("encodes a version 1 symbol identical to a known matrix", () => {
    const qr = encodeQr("海");
    assert.equal(qr.version, 1);
    assert.equal(qr.size, 21);
    assert.equal(qr.mask, 2, "lowest-penalty mask agrees with the reference");
    assert.deepEqual(rows(qr), SEA_V1_MASK2);
});

test("larger versions (version info, 16-bit counts, mixed block sizes) match known matrices", () => {
    const v8 = encodeQr(`kanji kaisen: ${KANJI.slice(0, 40)} ok`);
    assert.equal(v8.version, 8);
    assert.equal(v8.mask, 2);
    assert.equal(hash(v8), "02b2f09bef6c3e94dd71ff4734e811f7b0680ea306fafeaf26960ee80dd9e529");

    // The reference picked mask 6 here (penalty implementations differ; both are valid).
    const v11 = encodeQr(`set of kanji: ${KANJI.slice(0, 60)}; ${KANJI.slice(0, 20)} end`, { mask: 6 });
    assert.equal(v11.version, 11);
    assert.equal(hash(v11), "90a1af03f898ddaae69eb817853f1b272256fd496b94d5d488507db5cb4bb413");

    const v19 = encodeQr(`long set: ${KANJI.repeat(4).slice(0, 190)} fin`);
    assert.equal(v19.version, 19);
    assert.equal(v19.size, 93);
    assert.equal(hash(v19), "9987d9c8ee2949c4f399bdfadefe36bfdba8ae5e8b9f696a0f9c2c5f2ab8b8a6");
});

test("a 60-kanji share link fits, and oversize input returns null", () => {
    const url = `https://kanjikaisen.app/set?k=${encodeURIComponent(KANJI.slice(0, 60))}&t=${encodeURIComponent("x".repeat(80))}`;
    const qr = encodeQr(url);
    assert.ok(qr && qr.version <= 20, `version ${qr?.version}`);
    assert.equal(encodeQr("x".repeat(2332)), null);
    assert.equal(encodeQr("x".repeat(300), { maxVersion: 10 }), null);
    assert.equal(encodeQr("x", { minVersion: 3 }).version, 3);
});

test("builds SVG path data with a quiet zone", () => {
    const qr = encodeQr("海");
    const path = qrPath(qr);
    // The top-left finder's first row is a 7-module run at (4, 4).
    assert.ok(path.startsWith("M4 4h7v1h-7z"));
    const darkModules = qr.modules.flat().filter(Boolean).length;
    const covered = [...path.matchAll(/h(\d+)v1/g)].reduce((sum, m) => sum + Number(m[1]), 0);
    assert.equal(covered, darkModules);
});
