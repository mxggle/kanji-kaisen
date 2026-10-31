import type { AtlasKanji } from "@/lib/atlas/types";
import { KindLabel } from "@/components/ui/SectionHeader";
import { PartChip, PartPlus } from "@/components/ui/PartChip";
import { Tag } from "@/components/ui/Tag";
import { gradeTag } from "./readings";
import { partLine, partNote, uniqueParts } from "./parts";
import { InkTag } from "./InkTag";
import type { PartView } from "./types";

interface KanjiHeroProps {
    kanji: AtlasKanji;
    headline: string;
    meanings: string[];
    parts: PartView[];
}

/**
 * The top of the reading column (first on phones): kind line, glyph and
 * meaning, the other meanings, plain tags with your ink, then the parts by role.
 */
export function KanjiHero({ kanji, headline, meanings, parts }: KanjiHeroProps) {
    // KANJIDIC grades 9–10 already say "name kanji"; the jōyō tag below says it too.
    const grade = kanji.nameKanji && !kanji.joyo ? null : gradeTag(kanji.grade);
    const extra = meanings.slice(2);
    const shown = uniqueParts(parts);
    return (
        <header className="flex flex-col gap-4 min-[960px]:gap-[22px]">
            <KindLabel jp="漢字">Kanji{kanji.category ? ` · in ${kanji.category}` : ""}</KindLabel>

            <div className="flex items-end gap-3.5 min-[960px]:gap-[22px]">
                <span lang="ja" aria-hidden className="shrink-0 font-jp text-[92px] font-extrabold leading-[.85] min-[960px]:text-[128px]">
                    {kanji.char}
                </span>
                <div className="flex min-w-0 flex-col gap-1.5 pb-1.5 min-[960px]:gap-2">
                    <h1 className="type-title">
                        <span className="sr-only">{kanji.char}: </span>
                        {headline}
                    </h1>
                    {extra.length > 0 && <p className="text-sm text-ink-2">Also: {extra.join(", ")}</p>}
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <Tag>
                    {kanji.jlptEditorial ? (
                        <abbr title="Not on the unofficial JLPT lists; placed at this level by Kanji Kaisen" className="cursor-help no-underline">
                            {kanji.jlpt}
                            <span aria-hidden>*</span>
                            <span className="sr-only"> (our estimate)</span>
                        </abbr>
                    ) : (
                        <>
                            <span className="sr-only">JLPT </span>
                            {kanji.jlpt}
                        </>
                    )}
                </Tag>
                <Tag>{kanji.strokeCount} strokes</Tag>
                {grade && <Tag>{grade}</Tag>}
                {!kanji.joyo && <Tag>{kanji.nameKanji ? "Name kanji (jinmeiyō)" : "Not jōyō"}</Tag>}
                <InkTag char={kanji.char} />
            </div>

            {shown.length > 0 && (
                <ul aria-label="Parts" className="flex flex-wrap items-center gap-2.5">
                    {shown.map((part, i) => (
                        <li key={part.char} className="flex min-w-0 items-center gap-2.5">
                            {i > 0 && <PartPlus />}
                            <PartChip
                                char={part.char}
                                role={partLine(part.role)}
                                label={part.gloss ?? undefined}
                                note={partNote(part.role)}
                                href={part.href ?? undefined}
                                className="max-[959px]:h-10"
                            />
                        </li>
                    ))}
                </ul>
            )}
        </header>
    );
}
