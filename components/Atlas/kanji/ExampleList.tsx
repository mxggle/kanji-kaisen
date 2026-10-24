import { toRomaji } from "wanakana";
import type { KanjiExample } from "@/lib/atlas/types";

const IRREGULAR_NOTE =
    "Irregular reading: the word is read as a whole (jukujikun or ateji), not from the usual readings of its kanji.";

/** Example vocabulary. Irregular readings get a marker and a footnote. */
export function ExampleList({ examples }: { examples: KanjiExample[] }) {
    const hasIrregular = examples.some((e) => e.special);
    return (
        <>
            <ul className="grid sm:grid-cols-2 gap-2">
                {examples.map((example, i) => (
                    <li key={`${example.word}-${i}`} className="flex items-baseline gap-3 p-3 rounded-lg bg-white/5 border border-white/10 min-w-0">
                        <span className="text-xl font-japanese font-bold shrink-0">{example.word}</span>
                        <span className="min-w-0">
                            <span className="block font-japanese text-white/80">
                                {example.reading}
                                {example.special && (
                                    <abbr
                                        title={IRREGULAR_NOTE}
                                        className="ml-1.5 no-underline cursor-help text-[10px] align-middle px-1.5 py-0.5 rounded bg-amber-400/15 text-amber-300 border border-amber-400/30 font-sans"
                                    >
                                        irregular
                                    </abbr>
                                )}
                            </span>
                            <span className="block text-xs text-white/40">{toRomaji(example.reading)}</span>
                            <span className="block text-sm text-white/70">{example.meaning}</span>
                        </span>
                    </li>
                ))}
            </ul>
            {hasIrregular && <p className="mt-3 text-xs text-white/50">{IRREGULAR_NOTE}</p>}
        </>
    );
}
