// Server-only access to the KanjiVG stroke files in public/kanjivg/kanji.
// Pages read them at build time to inline a static stroke-order diagram.

import "server-only";

import fs from "node:fs";
import path from "node:path";
import { kanjivgFileName, toInlineStrokeSvg } from "./kanjivg-svg.ts";

// Pages are fully prerendered, so the 11k SVGs needn't be traced into the
// server bundle; the ignore comments keep Turbopack from globbing them.
const KANJIVG_DIR = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "kanjivg", "kanji");

const filePath = (char: string) => path.join(/* turbopackIgnore: true */ KANJIVG_DIR, kanjivgFileName(char));

function readKanjiVg(char: string): string | null {
    try {
        return fs.readFileSync(/* turbopackIgnore: true */ filePath(char), "utf8");
    } catch {
        return null;
    }
}

/** Inline-ready numbered stroke diagram for `char`, or null if KanjiVG has none. */
export function getStrokeDiagramSvg(char: string): string | null {
    const raw = readKanjiVg(char);
    if (!raw) return null;
    return toInlineStrokeSvg(raw, {
        title: `Stroke order of ${char}, with numbered strokes`,
        titleId: "stroke-diagram-title",
    });
}
