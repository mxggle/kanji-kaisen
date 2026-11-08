import { test } from "node:test";
import assert from "node:assert/strict";
import { findGlyphOriginSections, parseGlyphOrigin, parseGlyphOriginPage } from "./wiktionary.ts";

// Excerpts of English Wiktionary pages (revisions of October 2026).
const page = (chinese, extra = "") => `{{also|x}}
==Translingual==
===Han character===
{{Han char|rn=75|rad=木|as=00|sn=4}}

==Chinese==
===Glyph origin===
${chinese}

===Etymology===
{{rfe|zh}}

====Pronunciation====
{{zh-pron|m=mù}}
${extra}`;

const MU = page(`{{Han etyl}}
{{liushu|p}} – a tree: branches on top, roots on the bottom (more visible in earlier forms).

See also {{zh-l|*本}}, {{zh-l|*未}}, and {{zh-l|*末}}.`);

const XIU = page(`{{Han etym}}
{{Han compound|人|t1=man|木|t2=tree|ls=ic}} – a man leaning against a tree, resting.`);

const HAI = page(`{{Han etym}}
{{Han compound|水|每|c1=s|c2=p|alt1=氵|t1=water|ls=psc}}.`);

test("木 is a pictogram with a plain description", () => {
    assert.deepEqual(parseGlyphOriginPage(MU), {
        section: "Chinese",
        formation: "pictogram",
        components: [],
        text: "A tree: branches on top, roots on the bottom (more visible in earlier forms).",
    });
});

test("休 is an ideogrammic compound of 人 + 木", () => {
    assert.deepEqual(parseGlyphOriginPage(XIU), {
        section: "Chinese",
        formation: "ideogrammic-compound",
        components: [
            { char: "人", gloss: "man" },
            { char: "木", gloss: "tree" },
        ],
        text: "A man leaning against a tree, resting.",
    });
});

test("海 is a phono-semantic compound: semantic 氵 (水) + phonetic 每", () => {
    const origin = parseGlyphOriginPage(HAI);
    assert.equal(origin.formation, "phono-semantic-compound");
    assert.deepEqual(origin.components, [
        { char: "水", form: "氵", role: "semantic", gloss: "water" },
        { char: "每", role: "phonetic" },
    ]);
    // Nothing beyond the compound itself, so no text.
    assert.equal(origin.text, undefined);
});

test("keeps at most two sentences and renders links, mentions and Old Chinese links", () => {
    const origin = parseGlyphOrigin(`{{Han etym}}
Mirror image of {{och-l|爿|id=1|piece}}, which is the pictogram of a [[bed]]. Compare {{l|zh|大}}. The third sentence goes. And a fourth.

''{{w|Shuowen}}'': a second paragraph is ignored.`);
    assert.equal(origin.formation, null);
    assert.equal(origin.text, "Mirror image of 爿 (“piece”), which is the pictogram of a bed. The third sentence goes.");
});

test("keeps the formation label when the compound runs into the sentence", () => {
    const origin = parseGlyphOrigin("{{Han compound|尸|𧝑|c1=s|c2=p|abb2=1|ls=psc}}, which has a variant 𧝣.");
    assert.equal(origin.text, "Phono-semantic compound (形聲): semantic 尸 + abbreviated phonetic 𧝑, which has a variant 𧝣.");
});

test("duplicated characters list the component twice", () => {
    const origin = parseGlyphOrigin(
        "{{Han etym}}\n{{zh-etym-double|木|tree}} to give the idea of multiple trees (compare {{zh-l|*森}}), thus a forest.",
    );
    assert.deepEqual(origin.components, [
        { char: "木", gloss: "tree" },
        { char: "木", gloss: "tree" },
    ]);
    assert.equal(origin.text, "Duplication of 木 (“tree”) to give the idea of multiple trees (compare 森), thus a forest.");
});

test("drops text it can't render, and components that aren't single characters", () => {
    const unknown = parseGlyphOrigin("{{liushu|p}} – a {{mystery template|x}} shape.");
    assert.deepEqual(unknown, { section: "Chinese", formation: "pictogram", components: [] });
    const bad = parseGlyphOrigin("{{Han compound|女<sub>2</sub>|口|ls=ic}}");
    assert.deepEqual(bad.components, []);
    assert.equal(bad.formation, "ideogrammic-compound");
});

test("returns null when nothing clean is there", () => {
    assert.equal(parseGlyphOrigin("{{Han etym}}"), null);
    assert.equal(parseGlyphOrigin("{{Han etym}}\n{{unknown|x}}"), null);
    assert.equal(parseGlyphOriginPage("==Japanese==\n===Kanji===\n{{ja-kanji}}"), null);
});

test("prefers Chinese, then Translingual, then Japanese, and a section with a formation", () => {
    const wikitext = `==Translingual==
===Glyph origin===
{{liushu|i}} – marks a point.

==Chinese==
===Glyph origin===
{{obor|zh|ja|働}}.

==Japanese==
===Glyph origin===
{{Han compound|人|動|ls=ic}}: a person who moves.`;
    assert.deepEqual(
        findGlyphOriginSections(wikitext).map((s) => s.section),
        ["Chinese", "Translingual", "Japanese"],
    );
    const origin = parseGlyphOriginPage(wikitext);
    assert.equal(origin.section, "Translingual");
    assert.equal(origin.formation, "ideogram");
    // Chinese alone gives only text.
    assert.deepEqual(parseGlyphOrigin("{{obor|zh|ja|働}}."), {
        section: "Chinese",
        formation: null,
        components: [],
        text: "Orthographic borrowing from Japanese 働.",
    });
});
