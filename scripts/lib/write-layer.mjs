// Writes a committed data layer: header fields (source, license, note) first,
// then each data section with one entry per line, so diffs stay reviewable.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');

function section(key, value) {
    if (Array.isArray(value)) {
        const lines = value.map((v) => JSON.stringify(v));
        return `${JSON.stringify(key)}: [\n${lines.join(',\n')}\n]`;
    }
    const lines = Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`);
    return `${JSON.stringify(key)}: {\n${lines.join(',\n')}\n}`;
}

/** Writes `rel` (relative to the repo root) and returns its size in bytes. */
export function writeLayer(rel, header, mainKey, data, extra = {}) {
    const parts = Object.entries(header).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`);
    parts.push(section(mainKey, data));
    for (const [k, v] of Object.entries(extra)) parts.push(section(k, v));
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const text = `{\n${parts.join(',\n')}\n}\n`;
    fs.writeFileSync(file, text);
    console.log(`📝 ${rel} (${Math.round(text.length / 1024)} KB chars)`);
    return text.length;
}
