import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const compiled = require("./compiled-stories.json");
const categoryMap = require("./radical-category-map.json");

test("every category used by the learning path has a compiled story", () => {
    const categories = new Set(Object.values(categoryMap));
    const missing = [...categories].filter((category) => !compiled.categories[category]);

    assert.deepEqual(missing, []);
});
