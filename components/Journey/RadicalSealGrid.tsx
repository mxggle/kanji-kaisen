import { radicalPath } from "@/lib/atlas/paths";
import { RadicalSeal } from "@/components/ui/RadicalSeal";
import { Tag } from "@/components/ui/Tag";

export interface SealRadical {
    key: string;
    char: string;
    /** Romanised name ("Sanzui"). */
    name: string;
    /** Full meaning ("Water (3 drops)"). */
    meaning: string;
    /** First plain gloss, for the caption ("water"). */
    gloss: string;
    /** Its kanji, most common first, concatenated (a side form gets its base's). */
    chars: string;
    /** Sourced ancient stages (0–3). */
    ancient: number;
    /** For story-only side forms: "木 Ki". */
    sideOf?: string;
}

/**
 * Radicals as seals linking to their pages, filled by the page's <InkPaint>.
 * 古 marks radicals with sourced ancient forms. The colour comes from the
 * nearest theme (--tc). Server-safe.
 */
export function RadicalSealGrid({ radicals }: { radicals: SealRadical[] }) {
    return (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-x-2 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(92px,1fr))] sm:gap-x-3">
            {radicals.map((r) => {
                const count = Array.from(r.chars).length;
                const detail = r.sideOf ? `side form of ${r.sideOf}` : `${count} kanji`;
                return (
                    <li key={r.key} className="flex min-w-0 justify-center">
                        <RadicalSeal
                            char={r.char}
                            chars={r.chars}
                            href={radicalPath(r.key)}
                            name={r.gloss}
                            count={
                                <span className="inline-flex items-center gap-1.5">
                                    {r.sideOf ? "side form" : detail}
                                    {r.ancient > 0 && (
                                        <Tag className="h-[18px] px-1.5 text-[11px]">
                                            <span lang="ja">古</span>
                                        </Tag>
                                    )}
                                </span>
                            }
                            label={`${r.char} ${r.name}, ${r.meaning}, ${detail}${r.ancient > 0 ? ", with ancient forms" : ""}`}
                            className="w-full"
                        />
                    </li>
                );
            })}
        </ul>
    );
}
