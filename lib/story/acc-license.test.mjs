import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyAccWikitext, normalizePeriod } from "./acc-license.ts";
import { findTemplates } from "./wikitext.ts";

// Fixtures are real Commons wikitexts (as of 2026-10-31) or minimal edits of them.
const SINICA_ORACLE = // File:人-oracle.svg
    "{{Created with Inkscape|v|vstyle=float:left}}{{ACClicense|i=i|人|oracle|Shang||甲2940 合18901|009||287|fontcode=42.F47D|strokes=2|component1=人}}";
const SINICA_BRONZE = // File:學-bronze.svg (a line break inside a parameter)
    "{{ACClicense|i=i|學|bronze|west||師𠭰簋 (late Western Zhou)|kaiOrder=31560|fontcode=31.F2AE|rad=|strokes=|cat=r|draw=1\n5|component1=𦥯|component2=子}}";
const PD_NO_SOURCE = // File:係-oracle.svg
    "{{ACClicense|i=i|係|oracle|strokes=|component1=}}";
const SEARS_ORACLE = // File:木-oracle.svg
    "{{ACClicense|木|oracle|oracle|j14138||075|strokes=|draw=0|component1=木|i=I}}\n[[Category:yug]]";
const SEARS_AND_SINICA_SEAL = // File:日-seal.svg: Sears id and a Sinica code
    "{{ACClicense|i=i|日|seal||s04780||072||231|fontcode=27.65E5|strokes=2|component1=日}}\n\n[[Category:𾋳]]";
const SEARS_NAMED_4 = "{{ACClicense|i=i|水|oracle|shang|4=J12345|fontcode=43.E7BE}}";
const SEARS_IN_TEXT =
    "{{Information|description=水|source=Redrawn from Richard Sears' Chinese Etymology}}\n{{ACClicense|i=i|水|oracle|shang||甲903}}";
const SEARS_PERMISSION = "{{ACClicense|i=i|水|oracle|shang||甲903|permission=Image from hanziyuan.net}}";

test("keeps ACC files without the Sears parameter, CC0 when traced from Academia Sinica", () => {
    assert.deepEqual(classifyAccWikitext(SINICA_ORACLE), {
        keep: true,
        reason: "acc-sinica",
        license: "CC0",
        sinicaCode: "42.F47D",
        ref: "甲2940 合18901",
        period: "shang",
    });
    const bronze = classifyAccWikitext(SINICA_BRONZE);
    assert.equal(bronze.keep, true);
    assert.equal(bronze.license, "CC0");
    assert.equal(bronze.sinicaCode, "31.F2AE");
    assert.equal(bronze.period, "western-zhou");
    assert.equal(bronze.ref, "師𠭰簋 (late Western Zhou)");

    assert.deepEqual(classifyAccWikitext(PD_NO_SOURCE), { keep: true, reason: "acc-pd", license: "PD" });
});

test("drops every file that carries the Sears parameter, even with a Sinica code", () => {
    assert.deepEqual(classifyAccWikitext(SEARS_ORACLE), { keep: false, reason: "sears", searsRef: "j14138" });
    assert.deepEqual(classifyAccWikitext(SEARS_AND_SINICA_SEAL), { keep: false, reason: "sears", searsRef: "s04780" });
    assert.deepEqual(classifyAccWikitext(SEARS_NAMED_4), { keep: false, reason: "sears", searsRef: "J12345" });
});

test("drops files that mention Sears or his sites anywhere", () => {
    assert.equal(classifyAccWikitext(SEARS_IN_TEXT).reason, "sears");
    assert.equal(classifyAccWikitext(SEARS_PERMISSION).reason, "sears");
    // A Sears mention hidden in a comment doesn't count, nor does the
    // template's own reference-link parameter.
    const commented = "<!-- see Sears -->{{ACClicense|i=i|水|oracle|shang||甲903|hanziyuan=水}}";
    assert.equal(classifyAccWikitext(commented).keep, true);
});

test("drops files with deletion or missing-permission tags", () => {
    assert.equal(classifyAccWikitext(`{{delete|reason=dupe}}${SINICA_ORACLE}`).reason, "problem");
    assert.equal(classifyAccWikitext(`{{No permission since|month=May}}${PD_NO_SOURCE}`).reason, "problem");
    assert.equal(classifyAccWikitext(`{{copyvio|x}}${PD_NO_SOURCE}`).keep, false);
});

test("outside ACC, keeps only CC0 files with an Academia Sinica glyph code", () => {
    const sinica =
        "{{Information|source=[http://xiaoxue.iis.sinica.edu.tw/char?fontcode=42.F47D 小學堂]}}\n{{Cc-zero}}";
    assert.deepEqual(classifyAccWikitext(sinica), {
        keep: true,
        reason: "sinica-cc0",
        license: "CC0",
        sinicaCode: "42.F47D",
    });
    assert.equal(classifyAccWikitext("{{Information|source=own work}}\n{{Cc-zero}}").reason, "unclear");
    assert.equal(classifyAccWikitext("{{PD-ancient-script}}").reason, "unclear");
    assert.equal(classifyAccWikitext("{{Information}}\n{{GFDL}}").reason, "unclear");
    assert.equal(classifyAccWikitext("#REDIRECT [[File:學-seal.svg]]").reason, "unclear");
    assert.equal(classifyAccWikitext("").keep, false);
});

test("rejects malformed or conflicting Sinica codes", () => {
    assert.equal(classifyAccWikitext("{{ACClicense|i=i|水|oracle|shang||x|fontcode=not-a-code}}").reason, "unclear");
    const two = "{{ACClicense|水|oracle|||fontcode=43.E7BE}}{{ACClicense|水|oracle|||fontcode=42.F47D}}";
    assert.equal(classifyAccWikitext(two).reason, "unclear");
});

test("normalizePeriod maps ACC period words", () => {
    assert.equal(normalizePeriod("Shang"), "shang");
    assert.equal(normalizePeriod("western"), "western-zhou");
    assert.equal(normalizePeriod("spring"), "spring-autumn");
    assert.equal(normalizePeriod("warring"), "warring-states");
    assert.equal(normalizePeriod("oracle"), undefined);
    assert.equal(normalizePeriod(undefined), undefined);
});

test("findTemplates splits parameters like MediaWiki", () => {
    const [t] = findTemplates("{{ Template:Han_compound |人|t1=man|{{l|zh|木}}|x=[[a|b]]|7=seven}}");
    assert.equal(t.name, "han compound");
    assert.deepEqual(t.params, { 1: "人", t1: "man", 2: "{{l|zh|木}}", x: "[[a|b]]", 7: "seven" });
    const nested = findTemplates("{{a|{{b|1}}}}", { nested: true }).map((x) => x.name);
    assert.deepEqual(nested, ["a", "b"]);
    assert.deepEqual(findTemplates("{{#if:x|y}}{{{1|}}}"), []);
});
