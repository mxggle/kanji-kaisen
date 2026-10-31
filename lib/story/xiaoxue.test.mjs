import { test } from "node:test";
import assert from "node:assert/strict";
import zlib from "node:zlib";
import {
    acceptedChar,
    applyFills,
    decodeEntities,
    decodePng,
    encodeAlphaPng,
    eraPeriod,
    glyphImageUrl,
    glyphProblem,
    glyphRef,
    glyphStage,
    hasStage,
    parseYanbian,
    pickGlyphs,
    processGlyph,
    providerFills,
    samePixels,
    samePrivateHead,
    scaleDown,
    stripProvider,
    xiaoxueFileName,
    yanbianPageUrl,
} from "./xiaoxue.ts";

// ---- a 字形演變 result in the site's markup (cut down from the 木 answer)

const img = (code, font, text) =>
    `<img src="/ImageText2/ShowImage.ashx?text=${encodeURIComponent(text)}&font=${encodeURIComponent(font)}&size=36&style=regular&color=%23000000" srcset="x 2x" alt="&${code};" class="charValue" style="vertical-align:text-bottom" />`;
const cell = (code, font, label, era, cls = "A") =>
    `<td align="center" class="VariantList${cls}">${img(code, font, "")}<br />${label}<br />${era}<td>`;
const page = (head, cells, kai = 139) => `
<form action="/yanbian/PageResult/PageResult" id="HiddenFrom" method="post">
  <table id="yanbian_result"><tr><td colspan="10"><table><tr>
    <td class="ZiList"><span id="StartOrder">3394</span></td>
    <td>${head ? img(head, "標楷體", "木") : ""}</td>
  </tr></table></td></tr>
  <tr><td colspan="10" align="right" class="Information">共搜尋到${cells.length}字，字形大小：</td></tr>
  <tr>${cells.join("")}<tr>
  </table>
</form>
<ul><li>小學堂<a href="/xiaozhuan?kaiOrder=${kai}" target="_blank">小篆</a>、<a href="/jiaguwen?kaiOrder=${kai}" target="_blank">甲骨文</a></li></ul>`;

const ORACLE = "中研院甲骨文重文二";
const BRONZE = "中研院金文重文二";
const SEAL = "北師大說文小篆";
const MU = page("0.6728", [
    cell("42.EA66", ORACLE, "甲600(甲)", "商"),
    cell("42.EA76", ORACLE, "庫226(甲)", "商"),
    cell("32.E92A", BRONZE, "木父丁爵(金)", "商代晚期"),
    cell("102.E299", "中研院戰國文字重文二", "山東011", "戰國.齊", "B"),
    cell("27.6728", SEAL, "說文‧木部", ""),
    cell("92.E66A", "中研院隸書重文二", "睡虎地簡10.4(隸)", "秦"),
]);

test("parseYanbian reads the head, the site's kaiOrder and every glyph in order", () => {
    const r = parseYanbian(MU);
    assert.deepEqual(r.head, { code: "0.6728", char: "木" });
    assert.equal(r.kaiOrder, 139);
    assert.deepEqual(
        r.glyphs.map((g) => [g.code, g.font, g.label, g.era]),
        [
            ["42.EA66", ORACLE, "甲600(甲)", "商"],
            ["42.EA76", ORACLE, "庫226(甲)", "商"],
            ["32.E92A", BRONZE, "木父丁爵(金)", "商代晚期"],
            ["102.E299", "中研院戰國文字重文二", "山東011", "戰國.齊"],
            ["27.6728", SEAL, "說文‧木部", ""],
            ["92.E66A", "中研院隸書重文二", "睡虎地簡10.4(隸)", "秦"],
        ],
    );
    assert.match(r.glyphs[0].src, /^\/ImageText2\/ShowImage\.ashx\?text=%EE%A9%A6&font=/);
});

test("parseYanbian handles no result, private-use heads and markup changes", () => {
    const none = parseYanbian(page(null, [], 0).replace(/kaiOrder=0/g, ""));
    assert.deepEqual(none, { head: null, kaiOrder: null, glyphs: [] });
    assert.deepEqual(parseYanbian(page("0.F083", [cell("27.F083", SEAL, "說文‧仌部", "")])).head, { code: "0.F083", char: null });
    // A glyph the parser can't see must fail loudly, not vanish.
    assert.throws(() => parseYanbian(MU.replace("共搜尋到6字", "共搜尋到7字")), /Parsed 6 glyphs, page states 7/);
    assert.throws(() => parseYanbian("<html>error</html>"), /Not a 字形演變 result/);
    assert.throws(() => parseYanbian(MU.replace("/ImageText2/ShowImage.ashx?text=%EE", "https://example.com/x?text=%EE")), /Unexpected glyph cell/);
    assert.equal(decodeEntities("&#x6728;&#26519;&amp;&nbsp;&bogus;"), "木林& &bogus;");
});

test("pickGlyphs takes the first oracle and bronze glyph and the 說文 headword seal", () => {
    const picks = pickGlyphs(parseYanbian(MU).glyphs);
    assert.deepEqual(Object.fromEntries(Object.entries(picks).map(([s, g]) => [s, g.code])), {
        oracle: "42.EA66",
        bronze: "32.E92A",
        seal: "27.6728",
    });
    // 龜: 說文古文 is listed first and is not small seal.
    const gui = [
        { code: "27.F14D", font: SEAL, label: "說文古文", era: "", src: "" },
        { code: "27.9F9C", font: SEAL, label: "說文‧龜部", era: "", src: "" },
    ];
    assert.equal(pickGlyphs(gui).seal.code, "27.9F9C");
    // 學: the headword (under 教部) wins over the 篆文 listed after it ...
    const xue = [
        { code: "27.F0A8", font: SEAL, label: "說文‧教部", era: "", src: "" },
        { code: "27.5B78", font: SEAL, label: "說文篆文", era: "", src: "" },
    ];
    assert.equal(pickGlyphs(xue).seal.code, "27.F0A8");
    // ... and 篆文 is used only when there is no headword form.
    assert.equal(pickGlyphs(xue.slice(1)).seal.code, "27.5B78");
    assert.equal(pickGlyphs(gui.slice(0, 1)).seal, undefined);
    assert.equal(glyphStage({ font: "中研院楚系簡帛文字重文二", label: "包2.250" }), null);
    assert.equal(glyphStage({ font: "中研院甲骨文重文一", label: "鐵157.4(甲)" }), "oracle");
});

test("acceptedChar keeps answers for the query or its etymon candidates only", () => {
    const answer = (code) => parseYanbian(page(code, [cell("42.F47D", ORACLE, "甲2940(甲)", "商")]));
    assert.equal(acceptedChar(answer("0.4EBA"), "亻", ["亻", "人"]), "人");
    assert.equal(acceptedChar(answer("0.4EBA"), "人", ["人"]), "人");
    assert.equal(acceptedChar(answer("0.5165"), "亻", ["亻", "人"]), null);
    assert.equal(acceptedChar(answer("0.F510"), "丨", ["丨"]), "丨");
    assert.equal(acceptedChar(parseYanbian(page(null, [])), "学", ["学"]), null);
});

test("samePrivateHead files a private-use 字頭 under the candidate that shares it", () => {
    const answer = (code) => parseYanbian(page(code, [cell("27.F083", SEAL, "說文‧辵部", "")]));
    const heads = { 辶: answer("0.F471").head, 辵: answer("0.F471").head, 攴: answer("0.6534").head };
    assert.equal(samePrivateHead(answer("0.F471"), "辶", ["辶", "辵"], (c) => heads[c]), "辵");
    assert.equal(samePrivateHead(answer("0.F654"), "攵", ["攵", "攴"], (c) => heads[c]), null);
    assert.equal(samePrivateHead(answer("0.4EBA"), "亻", ["亻", "人"], (c) => heads[c]), null);
});

test("eraPeriod, glyphRef and the URLs follow the site's own fields", () => {
    assert.equal(eraPeriod("商"), "shang");
    assert.equal(eraPeriod("商代晚期"), "shang");
    assert.equal(eraPeriod("西周早期"), "western-zhou");
    assert.equal(eraPeriod("春秋晚期"), "spring-autumn");
    assert.equal(eraPeriod("戰國晚期.晉"), "warring-states");
    assert.equal(eraPeriod("商代晚期或西周早期"), undefined);
    assert.equal(eraPeriod(""), undefined);
    assert.equal(glyphRef({ label: "甲600(甲)", era: "商" }), "甲600 (商)");
    assert.equal(glyphRef({ label: "木父丁爵(金)", era: "商代晚期" }), "木父丁爵 (商代晚期)");
    assert.equal(glyphRef({ label: "說文‧木部", era: "" }), "說文‧木部");
    const src = parseYanbian(MU).glyphs[0].src;
    assert.equal(
        glyphImageUrl(src, 384),
        `https://xiaoxue.iis.sinica.edu.tw${src.replace("size=36", "size=384")}`,
    );
    assert.throws(() => glyphImageUrl("https://example.com/a.png", 384));
    assert.equal(yanbianPageUrl(139), "https://xiaoxue.iis.sinica.edu.tw/yanbian?kaiOrder=139");
    assert.equal(yanbianPageUrl(null), "https://xiaoxue.iis.sinica.edu.tw/yanbian");
    assert.equal(xiaoxueFileName("42.EA66"), "xiaoxue-42.EA66.png");
});

// ---- images

// An RGB or RGBA PNG (filter 0), like the site's ShowImage.ashx output.
function makePng(width, height, channels, pixel) {
    const raw = Buffer.alloc(height * (width * channels + 1));
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) raw.set(pixel(x, y), y * (width * channels + 1) + 1 + x * channels);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr.set([8, channels === 4 ? 6 : 2, 0, 0, 0], 8);
    const chunk = (type, data) => {
        const head = Buffer.alloc(8);
        head.writeUInt32BE(data.length, 0);
        head.write(type, 4, "latin1");
        return Buffer.concat([head, data, Buffer.alloc(4)]); // the decoder doesn't check CRCs
    };
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk("IHDR", ihdr),
        chunk("IDAT", zlib.deflateSync(raw)),
        chunk("IEND", Buffer.alloc(0)),
    ]);
}

test("encodeAlphaPng round-trips through decodePng as black on transparent", () => {
    const alpha = Uint8Array.from({ length: 6 * 4 }, (_, i) => (i * 37) % 256);
    const png = encodeAlphaPng(6, 4, alpha);
    const back = decodePng(png);
    assert.equal(back.width, 6);
    assert.equal(back.height, 4);
    for (let i = 0; i < alpha.length; i++) assert.deepEqual([...back.data.subarray(i * 4, i * 4 + 4)], [0, 0, 0, alpha[i]]);
    assert.ok(samePixels(png, encodeAlphaPng(6, 4, alpha)));
    assert.ok(!samePixels(png, encodeAlphaPng(4, 6, alpha)));
    assert.throws(() => decodePng(Buffer.from("GIF89a")), /Not a PNG/);
});

test("processGlyph crops to the ink, takes alpha from luminance and scales down", () => {
    // White canvas, a black 40x10 bar at (30, 50) and one mid-grey pixel.
    const rgb = makePng(100, 100, 3, (x, y) => {
        if (x >= 30 && x < 70 && y >= 50 && y < 60) return [0, 0, 0];
        if (x === 69 && y === 60) return [128, 128, 128];
        return [255, 255, 255];
    });
    const g = processGlyph(rgb, 256);
    const out = decodePng(g.png);
    assert.deepEqual([out.width, out.height], [40, 11]);
    assert.deepEqual([...out.data.subarray(0, 4)], [0, 0, 0, 255]);
    assert.equal(out.data[(10 * 40 + 39) * 4 + 3], 127); // the grey pixel: half ink
    assert.equal(out.data[(10 * 40) * 4 + 3], 0); // white -> transparent
    assert.equal(g.darkPixels, 400);

    // Transparent canvas with black ink (as served) behaves the same; never upscaled.
    const rgba = makePng(600, 600, 4, (x, y) => (x >= 100 && x < 500 && y >= 200 && y < 300 ? [0, 0, 0, 255] : [0, 0, 0, 0]));
    const big = processGlyph(rgba, 256);
    assert.deepEqual([big.width, big.height], [256, 64]);
    assert.equal(decodePng(big.png).data[3], 255);
    assert.deepEqual(scaleDown(new Uint8Array([255, 0]), 2, 1, 4), { width: 2, height: 1, ink: new Uint8Array([255, 0]) });
    assert.deepEqual([...scaleDown(new Uint8Array([255, 0, 255, 0]), 4, 1, 2).ink], [128, 128]);

    assert.throws(() => processGlyph(makePng(10, 10, 3, () => [255, 255, 255])), /no ink/);
});

test("glyphProblem flags empty, tiny and filled images", () => {
    const ok = { png: Buffer.alloc(3000), darkPixels: 9000, coverage: 0.05 };
    assert.equal(glyphProblem(ok, 7000), null);
    assert.match(glyphProblem(ok, 150), /served image is 150 bytes/);
    assert.match(glyphProblem({ ...ok, png: Buffer.alloc(120) }, 7000), /PNG is 120 bytes/);
    assert.match(glyphProblem({ ...ok, darkPixels: 12 }, 7000), /12 inked pixels/);
    assert.match(glyphProblem({ ...ok, coverage: 0.9 }, 7000), /covers 90%/);
    assert.match(glyphProblem({ ...ok, png: Buffer.alloc(15800) }, 30000), /15\.4 KB, over the 12 KB budget/);
    assert.equal(glyphProblem({ ...ok, png: Buffer.alloc(12 * 1024) }, 30000), null);
});

// ---- manifest merge

const commons = (over) => ({ url: "https://commons.wikimedia.org/wiki/File:x.svg", author: "A", license: "PD", provider: "commons", revid: 1, sha1: "0", fetched: "2026-10-31", ...over });
const xx = (over) => ({
    url: "https://xiaoxue.iis.sinica.edu.tw/yanbian?kaiOrder=139",
    author: "Academia Sinica 小學堂",
    license: "CC0",
    source: "Academia Sinica 小學堂 42.EA66",
    provider: "xiaoxue",
    sha1: "1",
    fetched: "2026-10-31",
    ...over,
});
const BASE = {
    about: { source: "s" },
    files: {
        "木-silk.svg": commons({ stage: "silk", char: "木" }),
        "林-oracle.svg": commons({ stage: "oracle", char: "林", src: "/ancient/06797-oracle.svg" }),
        "肉-oracle.svg": commons({ stage: "oracle", char: "肉", src: "/ancient/08089-oracle.svg" }),
    },
    chars: {
        林: { etymon: "林", oracle: "林-oracle.svg" },
        木: { etymon: "木", other: ["木-silk.svg"] },
    },
    radicals: { nikuzuki: { etymon: "肉", oracle: "肉-oracle.svg" } },
};
const NEW = {
    "xiaoxue-42.EA66.png": xx({ stage: "oracle", char: "木", src: "/ancient/06728-oracle.png" }),
    "xiaoxue-27.6728.png": xx({ stage: "seal", char: "木", src: "/ancient/06728-seal.png", source: "Academia Sinica 小學堂 27.6728" }),
    "xiaoxue-42.F000.png": xx({ stage: "oracle", char: "林", src: "/ancient/06797-oracle.png" }),
    "xiaoxue-27.F001.png": xx({ stage: "seal", char: "肉", src: "/ancient/08089-seal.png" }),
    "xiaoxue-27.F002.png": xx({ stage: "seal", char: "瓦", src: "/ancient/074e6-seal.png" }),
};
const FILLS = [
    { table: "chars", key: "木", stage: "oracle", file: "xiaoxue-42.EA66.png" },
    { table: "chars", key: "木", stage: "seal", file: "xiaoxue-27.6728.png" },
    { table: "chars", key: "林", stage: "oracle", file: "xiaoxue-42.F000.png" }, // Commons already has it
    { table: "radicals", key: "nikuzuki", stage: "seal", file: "xiaoxue-27.F001.png" },
    { table: "chars", key: "瓦", stage: "seal", file: "xiaoxue-27.F002.png" },
];

test("applyFills fills empty stages only and keeps Commons precedence", () => {
    const m = applyFills(BASE, NEW, FILLS);
    assert.deepEqual(m.chars.木, { etymon: "木", oracle: "xiaoxue-42.EA66.png", seal: "xiaoxue-27.6728.png", other: ["木-silk.svg"] });
    assert.deepEqual(m.chars.林, { etymon: "林", oracle: "林-oracle.svg" });
    assert.deepEqual(m.chars.瓦, { etymon: "瓦", seal: "xiaoxue-27.F002.png" });
    assert.deepEqual(m.radicals.nikuzuki, { etymon: "肉", oracle: "肉-oracle.svg", seal: "xiaoxue-27.F001.png" });
    assert.equal(m.files["xiaoxue-42.F000.png"], undefined, "unused files are not added");
    assert.deepEqual(Object.keys(m.files), Object.keys(m.files).sort());
    assert.deepEqual(Object.keys(m.chars), Object.keys(m.chars).sort((a, b) => a.localeCompare(b)));
    assert.ok(hasStage(m, "chars", "木", "oracle"));
    assert.ok(!hasStage(m, "chars", "木", "bronze"));
    assert.ok(!hasStage(BASE, "chars", "木", "oracle"));
    assert.throws(() => applyFills(BASE, NEW, [{ table: "chars", key: "木", stage: "bronze", file: "xiaoxue-42.EA66.png" }]), /no such bronze file/);
});

test("stripProvider undoes applyFills, and providerFills carries fills over a rebuild", () => {
    const m = applyFills(BASE, NEW, FILLS);
    assert.deepEqual(stripProvider(m, "xiaoxue"), stripProvider(BASE, "xiaoxue"));
    assert.deepEqual(stripProvider(BASE, "xiaoxue").chars, BASE.chars);
    const carried = providerFills(m, "xiaoxue");
    assert.deepEqual(carried.map((f) => `${f.key}.${f.stage}`).sort(), ["nikuzuki.seal", "木.oracle", "木.seal", "瓦.seal"]);
    // Commons gaining a seal for 木 drops that fill on carry-over.
    const rebuilt = {
        ...BASE,
        files: { ...BASE.files, "木-seal.svg": commons({ stage: "seal", char: "木", src: "/ancient/06728-seal.svg" }) },
        chars: { ...BASE.chars, 木: { etymon: "木", seal: "木-seal.svg", other: ["木-silk.svg"] } },
    };
    const again = applyFills(rebuilt, m.files, carried);
    assert.deepEqual(again.chars.木, { etymon: "木", oracle: "xiaoxue-42.EA66.png", seal: "木-seal.svg", other: ["木-silk.svg"] });
    assert.equal(again.files["xiaoxue-27.6728.png"], undefined);
});
