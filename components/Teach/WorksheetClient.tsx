"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { decodeSet, encodeSet, parsePaper, setPath, type Paper, type PrintOptions } from "@/lib/teach-set";
import { cn } from "@/lib/utils";
import { useSearchIndex } from "@/components/Study/useSearchIndex";
import { Worksheet } from "./Worksheet";
import { useKanjiStrokes, useTeachWords } from "./useTeachData";
import { Segmented, Toggle } from "./ui";

const PAPER_LABEL: Record<Paper, string> = { a4: "A4", letter: "Letter" };
const EMPTY: string[] = [];

/** /teach/print: the worksheet for the set in the URL, with print options. */
export function WorksheetClient({ siteHost }: { siteHost: string }) {
    const params = useSearchParams();
    const router = useRouter();
    const { byChar, error, retry } = useSearchIndex();

    const set = useMemo(() => decodeSet(params, byChar ? (c) => byChar.has(c) : undefined), [params, byChar]);
    const chars = byChar ? set.chars : EMPTY;
    const paper = parsePaper(params.get("paper"));
    const answerKey = params.get("key") === "1";
    const showWords = params.get("words") !== "0";

    const strokes = useKanjiStrokes(chars);
    const words = useTeachWords(chars, showWords);
    const ready = byChar !== null && strokes.ready && words.ready;

    useEffect(() => {
        const onBeforePrint = () => trackEvent("worksheet_printed", { count: chars.length, paper, answerKey });
        window.addEventListener("beforeprint", onBeforePrint);
        return () => window.removeEventListener("beforeprint", onBeforePrint);
    }, [chars.length, paper, answerKey]);

    const update = (change: PrintOptions) => {
        const options = { paper, answerKey, words: showWords, ...change };
        router.replace(setPath("print", set, options), { scroll: false });
    };

    const pageWidth = paper === "letter" ? "max-w-[215.9mm]" : "max-w-[210mm]";

    return (
        // Worksheets are always 墨, on screen and on paper.
        <div data-skin="ink" className="min-h-screen bg-bg text-ink pt-4 pb-16 px-3 sm:px-4 print:min-h-0 print:p-0 print:bg-transparent">
            <style>{`@page { size: ${paper === "letter" ? "letter" : "A4"} portrait; margin: 12mm; }`}</style>

            <div className={cn("mx-auto mb-4 flex flex-col gap-3 print:hidden", pageWidth)}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={set.chars.length ? `/teach?${encodeSet(set)}` : "/teach"}
                        className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink transition-colors"
                    >
                        <ArrowLeft size={16} aria-hidden /> Edit set
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        disabled={!ready || chars.length === 0}
                        className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-ink text-bg font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <Printer size={18} aria-hidden /> Print or save PDF
                    </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    <Segmented
                        label="Paper"
                        value={paper}
                        options={(["a4", "letter"] as Paper[]).map((p) => ({ value: p, label: PAPER_LABEL[p] }))}
                        onChange={(p) => update({ paper: p })}
                    />
                    <Toggle checked={showWords} onChange={(v) => update({ words: v })} label="Read these words" />
                    <Toggle checked={answerKey} onChange={(v) => update({ answerKey: v })} label="Answer key page" />
                </div>
                <p className="text-xs text-ink-3">In the print dialog, keep the margins on Default and choose “Save as PDF” to keep a copy.</p>
            </div>

            <article
                aria-label="Worksheet"
                aria-busy={!ready}
                className={cn("mx-auto bg-card shadow-[0_1px_2px_rgb(0_0_0/.08),0_24px_48px_-24px_rgb(40_30_20/.45)] p-[5mm] sm:p-[12mm] print:max-w-none print:p-0 print:shadow-none print:bg-transparent", pageWidth)}
            >
                {error ? (
                    <div role="alert" className="text-sm text-ink-2">
                        <p className="font-medium text-ink">Couldn’t load kanji details.</p>
                        <button type="button" onClick={retry} className="mt-2 text-ink underline underline-offset-2">Try again</button>
                    </div>
                ) : !ready ? (
                    <p className="text-sm text-ink-3 py-10 text-center">Preparing the worksheet…</p>
                ) : chars.length === 0 ? (
                    <div className="py-10 text-center text-sm text-ink-2">
                        <p className="font-medium text-ink">This link has no kanji to print.</p>
                        <Link href="/teach" className="mt-2 inline-block text-ink underline underline-offset-2">Build a set</Link>
                    </div>
                ) : (
                    <Worksheet
                        title={set.title}
                        chars={chars}
                        entries={byChar!}
                        strokes={strokes.data}
                        words={words.data}
                        showWords={showWords}
                        answerKey={answerKey}
                        siteHost={siteHost}
                    />
                )}
            </article>
        </div>
    );
}
