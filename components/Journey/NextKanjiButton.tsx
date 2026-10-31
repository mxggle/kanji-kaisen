"use client";

import { kanjiPath } from "@/lib/atlas/paths";
import { Button, type ButtonSize } from "@/components/ui/Button";
import { nextKanji, nextLabel } from "@/components/Theme/order";
import { shadeReader, useChars, useInkEntries } from "@/components/Theme/useInk";

/**
 * The radical's one primary action: "Start with 本", "Continue with 村" or
 * "Revisit 本", the next kanji by the learner's ink. The server renders the
 * most common kanji; the label follows the ink once the store hydrates.
 */
export function NextKanjiButton({ chars, size = "lg", className }: { chars: string; size?: ButtonSize; className?: string }) {
    const list = useChars(chars);
    const entries = useInkEntries();
    const next = nextKanji(list, shadeReader(entries));
    if (!next) return null;
    const words = nextLabel(next).slice(0, -next.char.length).trimEnd();
    return (
        <Button variant="primary" size={size} href={`${kanjiPath(next.char)}#learn`} className={className}>
            {words}
            <span lang="ja" className="font-jp text-[1.15em] font-extrabold">
                {next.char}
            </span>
        </Button>
    );
}
