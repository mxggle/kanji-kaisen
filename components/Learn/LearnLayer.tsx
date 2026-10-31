"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Lightbulb, Printer, Presentation, RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { shadeLabel, type InkStep } from "@/lib/ink";
import { useInkStore } from "@/lib/ink-store";
import { kanjiPath } from "@/lib/atlas/paths";
import { KanjiInkDots } from "@/components/Ink/InkDots";
import { InkPicker } from "@/components/Ink/InkPicker";
import { PartChips } from "@/components/Kanji/PartChips";
import { strokeTypeName } from "@/components/Kanji/strokes";
import { LearnStage, type StageMode } from "./LearnStage";
import { restoreLearnFocus } from "./learn-hash";
import { LEARN_BUTTON_ID } from "./LearnButton";
import { LEARN_STEPS, type LearnData, type LearnStep } from "./types";
import type { WriterApi } from "./WriteCanvas";

const WriteCanvas = dynamic(() => import("./WriteCanvas").then((m) => m.WriteCanvas), {
    ssr: false,
    loading: () => <div className="h-full w-full rounded-2xl border border-dashed border-line-2" aria-hidden />,
});

const btn =
    "inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line-2 px-5 text-[15px] text-ink transition-colors hover:border-[var(--c)] hover:text-[var(--c)] disabled:opacity-40";
const btnMain =
    "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[var(--c)] bg-[var(--c)] px-5 text-[15px] font-bold text-onacc transition-colors hover:border-ink hover:bg-ink hover:text-bg";
const skipBtn = "self-start text-sm text-ink-3 underline-offset-4 hover:text-ink hover:underline";
const kicker = "text-[13px] text-[var(--c)]";

const READING_KIND = { on: "On'yomi", kun: "Kun'yomi" } as const;

function Kana({ r }: { r: LearnData["readings"][number] }) {
    return (
        <span lang="ja" className="font-jp text-[26px] font-extrabold leading-none">
            {r.suffix && <span className="text-ink-3">-</span>}
            {r.stem}
            {r.okurigana && <span className="text-ink-3">・{r.okurigana}</span>}
            {r.prefix && <span className="text-ink-3">-</span>}
        </span>
    );
}

interface LearnLayerProps {
    data: LearnData;
    onClose: () => void;
}

/**
 * The four-step loop on a kanji page (#learn): 会 Meet, 想 Recall, 描 Trace,
 * 書 Write. Every step can be skipped, wrong answers cost nothing, writing is
 * opt-in and checked locally. Completed steps raise the kanji's ink
 * (recordStep), and the learner can set any shade by hand.
 */
export function LearnLayer({ data, onClose }: LearnLayerProps) {
    const { char } = data;
    const rootRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const writerApi = useRef<WriterApi | null>(null);
    const ids = useId();
    const titleId = `${ids}-title`;
    const panelId = `${ids}-panel`;
    const inkPanelId = `${ids}-ink`;

    const [step, setStep] = useState<LearnStep>("meet");
    const [done, setDone] = useState<Set<LearnStep>>(() => new Set());
    const [inkOpen, setInkOpen] = useState(false);
    const [inkMsg, setInkMsg] = useState("");

    // Recall
    const [wrong, setWrong] = useState<Set<string>>(() => new Set());
    const [right, setRight] = useState(false);

    // Trace
    const total = data.strokes.length;
    const [at, setAt] = useState(1);
    const [replay, setReplay] = useState(0);

    // Write
    const [writeOn, setWriteOn] = useState(false);
    const [written, setWritten] = useState(false);
    const [finished, setFinished] = useState(false);

    // Page behind the layer: inert, no scrolling. Focus goes to the dialog; on
    // close it returns to whatever opened the layer.
    useEffect(() => {
        const root = rootRef.current;
        if (!root) return;
        const made: Element[] = [];
        for (const el of Array.from(document.body.children)) {
            if (el === root || el.hasAttribute("inert")) continue;
            el.setAttribute("inert", "");
            made.push(el);
        }
        const html = document.documentElement;
        const overflow = html.style.overflow;
        html.style.overflow = "hidden";
        root.focus({ preventScroll: true });
        return () => {
            made.forEach((el) => el.removeAttribute("inert"));
            html.style.overflow = overflow;
            restoreLearnFocus(LEARN_BUTTON_ID);
        };
    }, []);

    // Esc closes from anywhere.
    useEffect(() => {
        const onKey = (e: globalThis.KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    // Show each ink change for this kanji.
    useEffect(
        () =>
            useInkStore.subscribe((state, prev) => {
                const from = prev.entries[char]?.shade ?? 0;
                const to = state.entries[char]?.shade ?? 0;
                if (from !== to) setInkMsg(`Your ink for ${char}: ${shadeLabel(from)} → ${shadeLabel(to)}`);
            }),
        [char],
    );

    const complete = (s: InkStep) => {
        useInkStore.getState().recordStep(char, s, true);
        trackEvent("learn_step_completed", { kanji: char, step: s });
        setDone((d) => new Set(d).add(s));
    };

    const go = (s: LearnStep) => {
        setStep(s);
        if (s === "trace") setReplay((r) => r + 1);
    };

    const onTabKey = (e: KeyboardEvent) => {
        const index = LEARN_STEPS.findIndex((s) => s.id === step);
        let next: number | null = null;
        if (e.key === "ArrowRight") next = (index + 1) % LEARN_STEPS.length;
        else if (e.key === "ArrowLeft") next = (index - 1 + LEARN_STEPS.length) % LEARN_STEPS.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = LEARN_STEPS.length - 1;
        if (next === null) return;
        e.preventDefault();
        go(LEARN_STEPS[next].id);
        tabRefs.current[next]?.focus();
    };

    // Recall: 1–4 pick an option.
    const pick = (text: string) => {
        if (right || wrong.has(text)) return;
        if (text === data.recall.answer) {
            setRight(true);
            complete("recall");
        } else {
            setWrong((w) => new Set(w).add(text));
        }
    };
    const onRootKey = (e: KeyboardEvent) => {
        if (step !== "recall" || e.metaKey || e.ctrlKey || e.altKey) return;
        const n = Number(e.key);
        const option = data.recall.options[n - 1];
        if (n >= 1 && option) {
            e.preventDefault();
            pick(option.text);
        }
    };

    // Trace
    const traceNext = () => {
        if (at < total) {
            setAt(at + 1);
            setReplay((r) => r + 1);
        } else {
            complete("trace");
            go("write");
        }
    };
    const traceBack = () => {
        setAt(Math.max(1, at - 1));
        setReplay((r) => r + 1);
    };

    const onWritten = () => {
        setWritten(true);
        setFinished(true);
        complete("write");
    };

    // Stage
    let mode: StageMode = "lit";
    if (step === "trace" && total) mode = "trace";
    if (step === "write" && !finished) mode = "ghost";
    const stageLabel =
        mode === "trace" ? `${char}, stroke ${at} of ${total}` : step === "write" && writeOn && !finished ? `Writing area for ${char}` : `${char}, ${data.meaning}`;

    const currentStroke = data.strokes[at - 1];
    const owner = data.owners[at - 1];
    const ownerPart = owner ? data.parts.find((p) => p.char === owner) : null;
    const strokeName = currentStroke ? strokeTypeName(currentStroke.type) : "";
    const traceNote = [
        strokeName ? strokeName[0].toUpperCase() + strokeName.slice(1) : at === 1 ? "Start here" : "Next stroke",
        ownerPart ? `, in ${ownerPart.char}${ownerPart.gloss ? ` (${ownerPart.gloss})` : ""}` : "",
        ".",
    ].join("");

    const wrongFrom = [...wrong].map((t) => data.recall.options.find((o) => o.text === t)?.from).filter(Boolean);
    const lastWrong = wrongFrom[wrongFrom.length - 1];

    return (
        <div
            ref={rootRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            onKeyDown={onRootKey}
            className="fixed inset-0 z-[70] flex flex-col overflow-y-auto overscroll-contain bg-bg text-ink outline-none"
            style={{ "--tc": data.themeColor } as CSSProperties}
        >
            {/* Header: close, title, ink */}
            <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-bg/90 px-1 backdrop-blur-md lg:h-16 lg:px-6">
                <button
                    type="button"
                    onClick={onClose}
                    aria-label={`Close and return to the ${char} page`}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/10 hover:text-ink"
                >
                    <X size={20} aria-hidden />
                </button>
                <h2 id={titleId} className="min-w-0 flex-1 truncate text-sm text-ink-2 lg:text-base">
                    <span lang="ja" className="font-jp text-lg font-bold text-ink">
                        {char}
                    </span>{" "}
                    {data.meaning}
                    <span className="text-ink-3"> · learn it in four steps</span>
                </h2>
                <button
                    type="button"
                    aria-expanded={inkOpen}
                    aria-controls={inkPanelId}
                    onClick={() => setInkOpen((o) => !o)}
                    className="flex h-11 items-center gap-2 rounded-full px-3 text-sm text-ink-2 transition-colors hover:bg-ink/10 hover:text-ink"
                >
                    <span className="hidden sm:inline">Your ink</span>
                    <KanjiInkDots char={char} showName={false} label={`Your ink for ${char}`} />
                </button>
            </header>

            {inkOpen && (
                <div id={inkPanelId} className="border-b border-line bg-card px-4 py-4 lg:px-8">
                    <p className="mb-3 text-sm text-ink-2">Mark your ink for {char} yourself, up or down. Nothing is locked.</p>
                    <InkPicker char={char} source="learn" />
                </div>
            )}

            <p aria-live="polite" className={cn("px-4 text-center text-sm text-[var(--c)] lg:px-8", inkMsg ? "pt-3" : "sr-only")}>
                {inkMsg}
            </p>

            {/* Step tabs */}
            <div role="tablist" aria-label="Steps" onKeyDown={onTabKey} className="flex shrink-0 border-b border-line px-3 lg:justify-center lg:gap-3 lg:border-0 lg:pt-5">
                {LEARN_STEPS.map((s, i) => {
                    const selected = s.id === step;
                    const isDone = done.has(s.id);
                    return (
                        <button
                            key={s.id}
                            ref={(el) => {
                                tabRefs.current[i] = el;
                            }}
                            type="button"
                            role="tab"
                            id={`${ids}-tab-${s.id}`}
                            aria-selected={selected}
                            aria-controls={panelId}
                            tabIndex={selected ? 0 : -1}
                            onClick={() => go(s.id)}
                            className={cn(
                                "flex h-[52px] flex-1 flex-col items-center justify-center gap-0.5 border-b-2 text-[11px] transition-colors",
                                "lg:h-[50px] lg:flex-none lg:flex-row lg:gap-3 lg:rounded-full lg:border lg:pl-[7px] lg:pr-5 lg:text-[15px]",
                                selected ? "border-[var(--c)] text-ink" : "border-transparent text-ink-3 hover:text-ink lg:border-line",
                                isDone && !selected && "text-ink-2",
                            )}
                        >
                            <b
                                lang="ja"
                                className={cn(
                                    "font-jp text-[19px] font-extrabold leading-none",
                                    "lg:flex lg:h-9 lg:w-9 lg:items-center lg:justify-center lg:rounded-full lg:border lg:text-lg",
                                    selected ? "text-[var(--c)] lg:border-[var(--c)] lg:bg-[var(--c)] lg:text-onacc" : isDone ? "text-[var(--c)] lg:border-[var(--c)]" : "lg:border-line",
                                )}
                            >
                                {s.jp}
                            </b>
                            <span className="inline-flex items-center gap-1">
                                {s.en}
                                {isDone && (
                                    <>
                                        <Check size={12} aria-hidden className="text-[var(--c)]" />
                                        <span className="sr-only">(done)</span>
                                    </>
                                )}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Stage + panel */}
            <div className="grid flex-1 content-start gap-3 px-3 pb-4 pt-4 lg:grid-cols-[minmax(0,1fr)_470px] lg:content-center lg:gap-6 lg:px-12 lg:pt-2">
                <div className="flex items-center justify-center py-2 lg:py-6">
                    <LearnStage data={data} mode={mode} at={at} replay={replay} label={stageLabel}>
                        {step === "write" && writeOn && !finished && total > 0 ? (
                            <WriteCanvas strokes={data.strokes} apiRef={writerApi} onComplete={onWritten} />
                        ) : undefined}
                    </LearnStage>
                </div>

                <section
                    role="tabpanel"
                    id={panelId}
                    aria-labelledby={`${ids}-tab-${step}`}
                    className="flex min-h-[260px] flex-col gap-4 self-center rounded-[22px] border border-line bg-card px-5 py-5 lg:rounded-2xl lg:px-7 lg:py-7"
                >
                    {step === "meet" && (
                        <>
                            <p className={kicker}>Step 1 · Meet it</p>
                            <p className="font-disp text-[34px] font-bold leading-none lg:text-[40px]">{data.meaning}</p>
                            <p className="-mt-2 text-sm text-ink-3">{data.meta}</p>
                            {data.readings.length > 0 ? (
                                <div className="flex flex-wrap gap-x-7 gap-y-3 border-y border-line py-3">
                                    {data.readings.map((r, i) => (
                                        <p key={i} className="flex flex-col gap-1">
                                            <span className="text-xs text-ink-3">{READING_KIND[r.kind]}</span>
                                            <span className="flex items-baseline gap-2">
                                                <Kana r={r} />
                                                <span className="text-sm text-ink-3">{r.romaji}</span>
                                            </span>
                                        </p>
                                    ))}
                                </div>
                            ) : (
                                <p className="border-y border-line py-3 text-sm text-ink-2">No reading of its own: it is read as part of each word.</p>
                            )}
                            {data.parts.length > 0 && <PartChips parts={data.parts} size="sm" />}
                            {data.memory && (
                                <div>
                                    <p className="text-xs text-ink-3">Memory story</p>
                                    <p className="font-disp text-xl italic leading-snug">“{data.memory}”</p>
                                </div>
                            )}
                            <div className="mt-auto flex flex-wrap items-center gap-3 pt-1">
                                <button
                                    type="button"
                                    className={btnMain}
                                    onClick={() => {
                                        complete("meet");
                                        go("recall");
                                    }}
                                >
                                    I&apos;ve met it <ArrowRight size={16} aria-hidden />
                                </button>
                            </div>
                        </>
                    )}

                    {step === "recall" && (
                        <>
                            <p className={kicker}>Step 2 · Recall</p>
                            <p className="font-disp text-[28px] font-bold leading-tight lg:text-[34px]">
                                What does{" "}
                                <span lang="ja" className="font-jp text-[var(--c)]">
                                    {char}
                                </span>{" "}
                                mean?
                            </p>
                            <div className="flex flex-col gap-2">
                                {data.recall.options.map((o, i) => {
                                    const isWrong = wrong.has(o.text);
                                    const isRight = right && o.text === data.recall.answer;
                                    return (
                                        <button
                                            key={o.text}
                                            type="button"
                                            onClick={() => pick(o.text)}
                                            aria-disabled={right || isWrong || undefined}
                                            className={cn(
                                                "flex min-h-[50px] w-full items-center gap-3 rounded-[10px] border px-4 py-2 text-left text-[15px] transition-colors",
                                                isRight
                                                    ? "border-[var(--c)] bg-[color-mix(in_oklab,var(--c)_14%,transparent)]"
                                                    : isWrong
                                                      ? "border-bad text-bad line-through"
                                                      : right
                                                        ? "border-line-2 opacity-45"
                                                        : "border-line-2 hover:border-[var(--c)]",
                                            )}
                                        >
                                            <span className="w-5 shrink-0 text-ink-3">{"ABCD"[i]}</span>
                                            <span className="min-w-0 flex-1">{o.text}</span>
                                            {isRight && <Check size={18} aria-hidden className="text-[var(--c)]" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <p aria-live="polite" className="min-h-[1.5em] text-[15px] leading-relaxed text-ink-2">
                                {right
                                    ? `Right: ${char} means ${data.recall.answer}.`
                                    : lastWrong
                                      ? `Not quite: that one is ${lastWrong}. Try another, no harm done.`
                                      : "Pick the meaning. Keys 1 to 4 work too."}
                            </p>
                            <div className="mt-auto flex flex-wrap items-center gap-4">
                                {right ? (
                                    <button type="button" className={btnMain} onClick={() => go("trace")}>
                                        Next: trace it <ArrowRight size={16} aria-hidden />
                                    </button>
                                ) : (
                                    <button type="button" className={skipBtn} onClick={() => go("trace")}>
                                        Skip this step
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    {step === "trace" && (
                        <>
                            <p className={kicker}>Step 3 · Trace</p>
                            {total > 0 ? (
                                <>
                                    <p className="font-disp text-[32px] font-bold leading-none lg:text-[40px]">
                                        Stroke {at} <span className="font-semibold text-ink-3">of {total}</span>
                                    </p>
                                    <p aria-live="polite" className="text-[15px] leading-relaxed text-ink-2">
                                        {traceNote}
                                    </p>
                                    <div aria-hidden className="flex gap-[5px]">
                                        {data.strokes.map((_, i) => (
                                            <i key={i} className={cn("h-[5px] flex-1 rounded-[3px]", i < at ? "bg-[var(--c)]" : "bg-line-2")} />
                                        ))}
                                    </div>
                                    <p className="text-sm text-ink-3">Follow the glowing stroke with your finger or eyes, then go on.</p>
                                    <div className="mt-auto flex flex-wrap gap-2.5">
                                        <button type="button" className={btn} onClick={traceBack} disabled={at <= 1} aria-label="Previous stroke">
                                            <ArrowLeft size={16} aria-hidden />
                                        </button>
                                        <button type="button" className={btn} onClick={() => setReplay((r) => r + 1)}>
                                            <Lightbulb size={16} aria-hidden /> Hint
                                        </button>
                                        <button type="button" className={btnMain} onClick={traceNext}>
                                            {at < total ? (
                                                <>
                                                    Next stroke <ArrowRight size={16} aria-hidden />
                                                </>
                                            ) : (
                                                <>
                                                    Done tracing <Check size={16} aria-hidden />
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <button type="button" className={skipBtn} onClick={() => go("write")}>
                                        Skip this step
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="text-[15px] text-ink-2">No stroke data for this kanji yet, so there is nothing to trace.</p>
                                    <button type="button" className={btnMain} onClick={() => go("write")}>
                                        Go on <ArrowRight size={16} aria-hidden />
                                    </button>
                                </>
                            )}
                        </>
                    )}

                    {step === "write" && !finished && (
                        <>
                            <p className={kicker}>Step 4 · Write (optional)</p>
                            <p className="font-disp text-[28px] font-bold leading-tight lg:text-[34px]">
                                Write <span className="text-[var(--c)]">{data.meaning.split(",")[0]}</span> from memory
                            </p>
                            {!writeOn ? (
                                <>
                                    <p className="text-[15px] leading-relaxed text-ink-2">
                                        Optional, for anyone who wants to practise writing. Draw each stroke in order; it is checked here in your
                                        browser, and nothing is sent anywhere.
                                    </p>
                                    <div className="mt-auto flex flex-col gap-3">
                                        <button type="button" className={btnMain} onClick={() => setWriteOn(true)} disabled={!total}>
                                            Try writing from memory
                                        </button>
                                        <button type="button" className={skipBtn} onClick={() => setFinished(true)}>
                                            Skip writing and finish
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-[15px] leading-relaxed text-ink-2">
                                        Draw in the box. A stroke in the wrong place or order fades away; just try it again.
                                    </p>
                                    <div className="mt-auto flex flex-wrap gap-2.5">
                                        <button type="button" className={btn} onClick={() => writerApi.current?.hint()}>
                                            <Lightbulb size={16} aria-hidden /> Hint
                                        </button>
                                        <button type="button" className={btn} onClick={() => writerApi.current?.clear()}>
                                            <RotateCcw size={16} aria-hidden /> Clear
                                        </button>
                                        <button type="button" className={btn} onClick={() => setFinished(true)}>
                                            Finish
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {step === "write" && finished && (
                        <>
                            <p className={kicker}>{written ? "Written from memory" : "That's the loop"}</p>
                            <p className="font-disp text-[28px] font-bold leading-tight lg:text-[32px]">
                                {written ? `You wrote ${char}.` : `You've been through ${char}.`}
                            </p>
                            <p className="flex flex-wrap items-center gap-3 text-[15px] text-ink-2">
                                Your ink for{" "}
                                <span lang="ja" className="font-jp font-bold text-ink">
                                    {char}
                                </span>
                                <KanjiInkDots char={char} />
                            </p>
                            <p className="text-sm leading-relaxed text-ink-3">
                                Ink darkens as you meet, recall, trace and write. Writing it again on another day takes it further. You can also set
                                it yourself:
                            </p>
                            <InkPicker char={char} source="learn" />
                            <div className="mt-auto flex flex-wrap gap-2.5 pt-1">
                                {data.next && (
                                    <Link href={`${kanjiPath(data.next.char)}#learn`} className={btnMain}>
                                        Next:{" "}
                                        <span lang="ja" className="font-jp">
                                            {data.next.char}
                                        </span>{" "}
                                        {data.next.meaning} <ArrowRight size={16} aria-hidden />
                                    </Link>
                                )}
                                <button type="button" className={btn} onClick={onClose}>
                                    Back to{" "}
                                    <span lang="ja" className="font-jp">
                                        {char}
                                    </span>
                                </button>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {/* Desktop footer: words and teaching tools */}
            <footer className="hidden h-[72px] shrink-0 items-center gap-6 border-t border-line px-12 lg:flex">
                {data.words.length > 0 && (
                    <>
                        <span className="text-[13px] text-ink-3">Words</span>
                        <span className="flex min-w-0 gap-6 overflow-hidden text-[15px] text-ink-2">
                            {data.words.map((w) => (
                                <span key={w.word} className="truncate">
                                    <span lang="ja" className="font-jp font-bold text-ink">
                                        {w.word}
                                    </span>{" "}
                                    {w.meaning}
                                </span>
                            ))}
                        </span>
                    </>
                )}
                <span className="flex-1" />
                <a href={data.presentHref} rel="nofollow" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-3.5 text-sm text-ink-2 hover:border-line-2 hover:text-ink">
                    <Presentation size={15} aria-hidden /> Present
                </a>
                <a href={data.printHref} rel="nofollow" className="inline-flex h-10 items-center gap-2 rounded-full border border-line px-3.5 text-sm text-ink-2 hover:border-line-2 hover:text-ink">
                    <Printer size={15} aria-hidden /> Print practice sheet
                </a>
            </footer>
        </div>
    );
}
