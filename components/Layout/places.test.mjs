import { test } from "node:test";
import assert from "node:assert/strict";
import { PLACES, isAtlasPage, placeFor } from "./places.ts";

test("the four places keep their names and URLs", () => {
    assert.deepEqual(
        PLACES.map((p) => [p.label, p.href, p.jp]),
        [
            ["Learn", "/", "学"],
            ["Browse", "/browse", "探"],
            ["My list", "/my-list", "墨"],
            ["Teach", "/teach", "教"],
        ],
    );
});

test("Learn owns home, themes, radicals and kanji", () => {
    for (const path of ["/", "/categories", "/category/nature-elements", "/radicals", "/radical/ki", "/kanji/休", "/kanji/%E4%BC%91"]) {
        assert.equal(placeFor(path), "learn", path);
    }
});

test("kanji pages belong to Learn, not Browse", () => {
    assert.equal(placeFor("/kanji/海"), "learn");
    assert.equal(placeFor("/kanji/海#learn"), "learn");
});

test("Browse owns browse and search", () => {
    assert.equal(placeFor("/browse"), "browse");
    assert.equal(placeFor("/browse?jlpt=N5"), "browse");
    assert.equal(placeFor("/search"), "browse");
});

test("My list owns my list, study and classic practice", () => {
    assert.equal(placeFor("/my-list"), "mine");
    assert.equal(placeFor("/study"), "mine");
    assert.equal(placeFor("/practice"), "mine");
    assert.equal(placeFor("/practice/nature-elements"), "mine");
});

test("Teach owns teach, its outputs and student links", () => {
    assert.equal(placeFor("/teach"), "teach");
    assert.equal(placeFor("/teach/print"), "teach");
    assert.equal(placeFor("/teach/present"), "teach");
    assert.equal(placeFor("/set"), "teach");
});

test("about, settings and unknown routes have no place", () => {
    for (const path of ["/about", "/about/ancient-forms", "/settings", "/nope", "/kanjis", "/browsers"]) {
        assert.equal(placeFor(path), null, path);
    }
});

test("trailing slashes don't change the place", () => {
    assert.equal(placeFor("/browse/"), "browse");
    assert.equal(placeFor("/kanji/休/"), "learn");
    assert.equal(placeFor(""), "learn");
});

test("only theme, radical and kanji pages have an atlas path", () => {
    assert.equal(isAtlasPage("/category/nature-elements"), true);
    assert.equal(isAtlasPage("/radical/ki"), true);
    assert.equal(isAtlasPage("/kanji/休"), true);
    for (const path of ["/", "/categories", "/radicals", "/browse", "/kanji"]) {
        assert.equal(isAtlasPage(path), false, path);
    }
});
