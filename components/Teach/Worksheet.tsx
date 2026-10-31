// The printable worksheet: per kanji a glyph with meaning and readings, a
// cumulative stroke-order strip, tracing cells and empty 米字格 practice cells;
// then "Read these words", credits and an optional answer key. Sizes are in
// millimetres so the screen preview matches the printed page. Always 墨: the
// caller renders it inside data-skin="ink".

import { formatReading } from "@/lib/atlas/readings";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import type { TeachWord, TeachWords } from "@/lib/teach-set";
import { KANJIVG_VIEWBOX, type KanjiStrokes } from "./strokes";

export interface WorksheetProps {
    title: string;
    chars: string[];
    entries: Map<string, SearchIndexEntry>;
    strokes: Map<string, KanjiStrokes | null>;
    words: TeachWords;
    showWords: boolean;
    answerKey: boolean;
    /** Host shown in the footer, e.g. kanjikaisen.app. */
    siteHost: string;
    /** Builder preview: only the first `limit` kanji, no answer key. */
    limit?: number;
}

const TRACE_OPACITY = [0.3, 0.19, 0.11];

// Example words come from the atlas's examples. Update this line when the
// data layer adds other word sources (e.g. JMdict).
const WORD_CREDIT = "Words: Kanji alive (CC BY 4.0), JMdict/EDRDG (CC BY-SA 4.0)";
const CELLS_PER_ROW = 8;

export const worksheetMeaning = (entry: SearchIndexEntry | undefined) => entry?.m.slice(0, 3).join(", ") ?? "";

export function worksheetReadings(entry: SearchIndexEntry | undefined): string {
    if (!entry) return "";
    return [...entry.on.slice(0, 3), ...entry.kun.slice(0, 3).map(formatReading)].join(" · ");
}

export function Worksheet({ title, chars, entries, strokes, words, showWords, answerKey, siteHost, limit }: WorksheetProps) {
    const shown = limit ? chars.slice(0, limit) : chars;
    // A word can serve two kanji in the set (海水 for 海 and 水): list it once.
    const seen = new Set<string>();
    const wordList = shown
        .flatMap((c) => (words[c] ?? []).map((w) => ({ ...w, char: c })))
        .filter((w) => !seen.has(w.word) && seen.add(w.word));
    const preview = limit !== undefined;
    // The builder preview sits inside /teach, which has its own h1.
    const Title = preview ? "p" : "h1";

    return (
        <div className="text-ink font-ui">
            <header className="flex flex-wrap items-end justify-between gap-x-[6mm] gap-y-[2mm] pb-[2.5mm] border-b-[1.5px] border-ink">
                <div className="min-w-0">
                    <p className="text-[8pt] text-ink-3">Kanji Kaisen · worksheet</p>
                    <Title className="font-disp text-[20pt] font-bold leading-tight break-words">{title || "Kanji practice"}</Title>
                </div>
                <p className="text-[9.5pt] text-ink-2 whitespace-nowrap">
                    Name <span className="inline-block w-[38mm] border-b border-ink-3" aria-hidden /> &nbsp;Date{" "}
                    <span className="inline-block w-[22mm] border-b border-ink-3" aria-hidden />
                </p>
            </header>

            {shown.map((char) => (
                <KanjiBlock key={char} char={char} entry={entries.get(char)} strokes={strokes.get(char) ?? null} />
            ))}

            {preview && chars.length > shown.length && (
                <p className="py-[3mm] text-[9pt] text-ink-3">…and {chars.length - shown.length} more on the printed sheet.</p>
            )}

            {showWords && wordList.length > 0 && (
                <section className="mt-[5mm]" aria-labelledby="ws-words">
                    <div className="break-inside-avoid">
                        <h2 id="ws-words" className="text-[11pt] font-bold">Read these words</h2>
                        <p className="text-[8pt] text-ink-3 mb-[2.5mm]">Write the reading in hiragana on the line.</p>
                    </div>
                    <ol className="grid grid-cols-1 min-[560px]:grid-cols-2 gap-x-[8mm] gap-y-[3.5mm]">
                        {wordList.map((w) => (
                            <WordLine key={`${w.char}-${w.word}`} word={w} />
                        ))}
                    </ol>
                </section>
            )}

            <WorksheetFooter count={chars.length} siteHost={siteHost} wordCredit={showWords && wordList.length > 0} />

            {answerKey && !preview && (
                <AnswerKey title={title} chars={chars} entries={entries} words={showWords ? words : {}} siteHost={siteHost} />
            )}
        </div>
    );
}

function KanjiBlock({ char, entry, strokes }: { char: string; entry: SearchIndexEntry | undefined; strokes: KanjiStrokes | null }) {
    const strokeCount = strokes?.strokes.length ?? entry?.s ?? 0;
    return (
        <section
            aria-label={`${char}: ${worksheetMeaning(entry)}`}
            className="break-inside-avoid grid grid-cols-[24mm_minmax(0,1fr)] min-[560px]:grid-cols-[30mm_minmax(0,1fr)] gap-[4mm] min-[560px]:gap-[5mm] py-[4mm] border-b border-line-2"
        >
            <div className="flex flex-col items-center gap-[1.2mm] text-center min-w-0">
                <div className="relative w-full aspect-square border-[1.5px] border-ink">
                    <Glyph char={char} strokes={strokes} className="absolute inset-[6%] w-[88%] h-[88%]" strokeWidth={4} />
                </div>
                <p className="text-[10pt] font-bold leading-tight break-words w-full">{worksheetMeaning(entry)}</p>
                <p lang="ja" className="font-jp text-[9pt] text-ink-2 leading-snug break-words w-full">{worksheetReadings(entry)}</p>
                {strokeCount > 0 && <p className="text-[7.5pt] text-ink-3">{strokeCount} strokes</p>}
            </div>

            <div className="flex flex-col gap-[2.5mm] min-w-0">
                {strokes ? (
                    <ol aria-label="Stroke order" className="flex flex-wrap gap-[1mm]">
                        {strokes.strokes.map((_, i) => (
                            <li key={i} className="relative w-[9mm] h-[9mm] border border-line-2">
                                <span className="absolute top-[0.3mm] left-[0.6mm] text-[5.5pt] leading-none text-accent" aria-hidden>
                                    {i + 1}
                                </span>
                                <svg viewBox={KANJIVG_VIEWBOX} className="absolute inset-[0.6mm] w-[calc(100%-1.2mm)] h-[calc(100%-1.2mm)]" aria-hidden>
                                    <g className="fill-none" strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round">
                                        {strokes.strokes.slice(0, i + 1).map((d, j) => (
                                            <path key={j} d={d} className={j === i ? "stroke-accent" : "stroke-ink"} />
                                        ))}
                                    </g>
                                </svg>
                                <span className="sr-only">Stroke {i + 1}</span>
                            </li>
                        ))}
                    </ol>
                ) : (
                    <p className="text-[8pt] text-ink-3">Stroke order isn’t available for this character.</p>
                )}

                <div className="grid gap-[1.5mm]" style={{ gridTemplateColumns: `repeat(${CELLS_PER_ROW}, minmax(0, 1fr))` }}>
                    {Array.from({ length: CELLS_PER_ROW }, (_, i) => (
                        <PracticeCell key={i} char={char} strokes={strokes} opacity={TRACE_OPACITY[i]} />
                    ))}
                </div>
                <div className="grid gap-[1.5mm]" style={{ gridTemplateColumns: `repeat(${CELLS_PER_ROW}, minmax(0, 1fr))` }}>
                    {Array.from({ length: CELLS_PER_ROW }, (_, i) => (
                        <PracticeCell key={i} char={char} strokes={strokes} />
                    ))}
                </div>
            </div>
        </section>
    );
}

/** The kanji drawn from KanjiVG strokes, or from the font when KanjiVG has no file. */
function Glyph({ char, strokes, className, strokeWidth, opacity }: { char: string; strokes: KanjiStrokes | null; className?: string; strokeWidth: number; opacity?: number }) {
    if (!strokes) {
        return (
            <svg viewBox={KANJIVG_VIEWBOX} className={className} aria-hidden>
                <text x="54.5" y="58" textAnchor="middle" dominantBaseline="central" fontSize="92" className="fill-ink font-jp" fillOpacity={opacity}>
                    {char}
                </text>
            </svg>
        );
    }
    return (
        <svg viewBox={KANJIVG_VIEWBOX} className={className} aria-hidden>
            <g className="fill-none stroke-ink" strokeOpacity={opacity} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
                {strokes.strokes.map((d, i) => (
                    <path key={i} d={d} />
                ))}
            </g>
        </svg>
    );
}

/** A 米字格 cell (dashed cross and diagonals), with a grey glyph to trace when `opacity` is set. */
function PracticeCell({ char, strokes, opacity }: { char: string; strokes: KanjiStrokes | null; opacity?: number }) {
    return (
        <div className="relative aspect-square border border-ink-3">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
                <g className="stroke-accent" strokeOpacity={0.4} strokeWidth={0.75} strokeDasharray="2.5 2.5">
                    <line x1="50" y1="0" x2="50" y2="100" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="50" x2="100" y2="50" vectorEffect="non-scaling-stroke" />
                    <line x1="0" y1="0" x2="100" y2="100" vectorEffect="non-scaling-stroke" />
                    <line x1="100" y1="0" x2="0" y2="100" vectorEffect="non-scaling-stroke" />
                </g>
            </svg>
            {opacity !== undefined && <Glyph char={char} strokes={strokes} className="absolute inset-[8%] w-[84%] h-[84%]" strokeWidth={5} opacity={opacity} />}
        </div>
    );
}

function WordLine({ word }: { word: TeachWord }) {
    return (
        <li className="break-inside-avoid flex items-end gap-[3mm] min-w-0">
            <span lang="ja" className="font-jp text-[15pt] font-semibold leading-none shrink-0">{word.word}</span>
            <span className="flex-1 min-w-[18mm] border-b border-ink-3 h-[6mm]" aria-hidden />
            <span className="text-[8.5pt] text-ink-2 leading-tight max-w-[40%] truncate">{word.meaning}</span>
        </li>
    );
}

function WorksheetFooter({ count, siteHost, wordCredit }: { count: number; siteHost: string; wordCredit: boolean }) {
    return (
        <footer className="break-inside-avoid mt-[5mm] pt-[2mm] border-t border-line-2 flex flex-wrap justify-between gap-x-[4mm] gap-y-[1mm] text-[7.5pt] text-ink-3">
            <span>
                {count} kanji · Made with Kanji Kaisen{siteHost ? ` · ${siteHost}` : ""}
            </span>
            <span>
                Stroke order: KanjiVG (CC BY-SA 3.0){wordCredit ? ` · ${WORD_CREDIT}` : ""}
            </span>
        </footer>
    );
}

function AnswerKey({ title, chars, entries, words, siteHost }: { title: string; chars: string[]; entries: Map<string, SearchIndexEntry>; words: TeachWords; siteHost: string }) {
    const hasWords = chars.some((c) => (words[c] ?? []).length > 0);
    return (
        <section className="break-before-page mt-[10mm] print:mt-0" aria-labelledby="ws-key">
            <header className="pb-[2.5mm] border-b-[1.5px] border-ink">
                <p className="text-[8pt] text-ink-3">{title || "Kanji practice"}</p>
                <h2 id="ws-key" className="font-disp text-[18pt] font-bold leading-tight">Answer key</h2>
            </header>
            <table className="w-full text-[9pt] border-collapse">
                <thead>
                    <tr className="text-left text-[7.5pt] text-ink-3">
                        <th scope="col" className="py-[1.5mm] pr-[3mm] font-normal">Kanji</th>
                        <th scope="col" className="py-[1.5mm] pr-[3mm] font-normal">Meaning</th>
                        <th scope="col" className="py-[1.5mm] pr-[3mm] font-normal">Readings</th>
                        {hasWords && <th scope="col" className="py-[1.5mm] font-normal">Words</th>}
                    </tr>
                </thead>
                <tbody>
                    {chars.map((char) => {
                        const entry = entries.get(char);
                        return (
                            <tr key={char} className="break-inside-avoid border-t border-line-2 align-top">
                                <th scope="row" lang="ja" className="py-[1.5mm] pr-[3mm] font-jp text-[16pt] font-semibold leading-none text-left">{char}</th>
                                <td className="py-[1.5mm] pr-[3mm]">{worksheetMeaning(entry)}</td>
                                <td lang="ja" className="py-[1.5mm] pr-[3mm] font-jp">{worksheetReadings(entry)}</td>
                                {hasWords && (
                                    <td className="py-[1.5mm]">
                                        {(words[char] ?? []).map((w) => (
                                            <span key={w.word} className="block">
                                                <span lang="ja" className="font-jp">{w.word}【{w.reading}】</span> {w.meaning}
                                            </span>
                                        ))}
                                    </td>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <WorksheetFooter count={chars.length} siteHost={siteHost} wordCredit={hasWords} />
        </section>
    );
}
