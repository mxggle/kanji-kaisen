import { Presentation, Printer } from "lucide-react";
import type { AtlasKanji } from "@/lib/atlas/types";
import { KanjiInkDots } from "@/components/Ink/InkDots";
import { StudyControls } from "@/components/Atlas/kanji/StudyControls";
import { LearnButton } from "@/components/Learn/LearnButton";
import { gradeLabel } from "./readings";
import { PartChips } from "./PartChips";
import type { PartView } from "./types";

interface KanjiHeroProps {
    kanji: AtlasKanji;
    headline: string;
    meanings: string[];
    parts: PartView[];
}

/** Big glyph, meaning headline, part chips, the JLPT/strokes/grade line and your ink. */
export function KanjiHero({ kanji, headline, meanings, parts }: KanjiHeroProps) {
    // KANJIDIC grades 9–10 already say "name kanji"; the flag below says it too.
    const grade = kanji.nameKanji && !kanji.joyo ? null : gradeLabel(kanji.grade);
    const extra = meanings.slice(2);
    return (
        <header className="flex flex-col gap-3.5">
            <h1 className="flex items-end gap-4 sm:gap-5">
                <span lang="ja" className="font-jp text-[88px] font-extrabold leading-[.9] text-ink sm:text-[108px]">
                    {kanji.char}
                </span>
                <span className="min-w-0 pb-1.5 font-disp text-[38px] font-bold leading-none text-ink sm:text-5xl">
                    <span className="sr-only">: </span>
                    {headline}
                </span>
            </h1>
            {extra.length > 0 && <p className="-mt-1 text-sm text-ink-2">Also: {extra.join(", ")}</p>}

            <PartChips parts={parts} />

            <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-ink-3">
                <span>
                    {kanji.jlptEditorial ? (
                        <abbr
                            title="Not on the unofficial JLPT lists; placed at this level by Kanji Kaisen"
                            className="cursor-help no-underline decoration-dotted underline-offset-2 hover:underline"
                        >
                            JLPT {kanji.jlpt}
                            <span aria-hidden>*</span>
                            <span className="sr-only"> (our estimate)</span>
                        </abbr>
                    ) : (
                        <>JLPT {kanji.jlpt}</>
                    )}
                </span>
                <span aria-hidden>·</span>
                <span>{kanji.strokeCount} strokes</span>
                {grade && (
                    <>
                        <span aria-hidden>·</span>
                        <span>{grade}</span>
                    </>
                )}
                {!kanji.joyo && (
                    <>
                        <span aria-hidden>·</span>
                        <span>{kanji.nameKanji ? "name kanji (jinmeiyō)" : "not jōyō"}</span>
                    </>
                )}
                <span aria-hidden>·</span>
                <KanjiInkDots char={kanji.char} className="text-[13px] text-ink-3" />
            </p>
        </header>
    );
}

/**
 * Learn it · 4 steps, the share card button (passed in by the page, which has
 * the server-side card props), Save, Print practice sheet, Present.
 */
export function ActionRow({ char, shareCard }: { char: string; shareCard?: React.ReactNode }) {
    const k = encodeURIComponent(char);
    const tool = "inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm text-ink-2 transition-colors hover:bg-ink/10 hover:text-ink";
    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2.5">
                <LearnButton char={char} className="min-w-[200px] flex-1 sm:flex-none" />
                {shareCard}
                <StudyControls char={char} variant="button" />
            </div>
            <div className="-ml-3 flex flex-wrap gap-1">
                <a href={`/teach/print?k=${k}`} rel="nofollow" className={tool}>
                    <Printer size={15} aria-hidden /> Print practice sheet
                </a>
                <a href={`/teach/present?k=${k}`} rel="nofollow" className={tool}>
                    <Presentation size={15} aria-hidden /> Present
                </a>
            </div>
        </div>
    );
}
