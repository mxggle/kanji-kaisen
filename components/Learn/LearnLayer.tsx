"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, Check, Presentation, Printer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { SHADE_JP, SHADE_NAMES, shadeLabel, type InkEntry, type InkStep, type Shade } from "@/lib/ink";
import { useInkStore } from "@/lib/ink-store";
import { kanjiPath } from "@/lib/atlas/paths";
import type { ComponentRole } from "@/lib/atlas/types";
import { InkPicker } from "@/components/Ink/InkPicker";
import { strokeTypeName } from "@/components/Kanji/strokes";
import { Button, buttonClass } from "@/components/ui/Button";
import { InkSwatch } from "@/components/ui/InkLegend";
import { MemoryStory } from "@/components/ui/MemoryStory";
import { PartChip, PartPlus, type PartRole } from "@/components/ui/PartChip";
import { KindLabel } from "@/components/ui/SectionHeader";
import { Tabs, tabId, tabPanelId } from "@/components/ui/Tabs";
import { Tag } from "@/components/ui/Tag";
import { LearnStage, type StageMode } from "./LearnStage";
import { restoreLearnFocus } from "./learn-hash";
import { firstStep, nextShadeGoal, writeGoal } from "./next-shade";
import { traceNote } from "./stage";
import { LEARN_STEPS, type LearnData, type LearnStep } from "./types";
import type { WriterApi } from "./WriteCanvas";

const WriteCanvas = dynamic(() => import("./WriteCanvas").then((m) => m.WriteCanvas), {
    ssr: false,
    loading: () => <div className="h-full w-full" aria-hidden />,
});

const READING_KIND = { on: "on'yomi", kun: "kun'yomi" } as const;

/** Rule 2: a part that carries meaning (or meaning and sound) is solid, a sound part dashed, the rest grey. */
const partRole = (role: ComponentRole): PartRole => (role === "sound" ? "sound" : role === "form" ? "form" : "meaning");

function Kana({ r }: { r: LearnData["readings"][number] }) {
    return (
        <span lang="ja" className="font-jp text-[22px] font-extrabold leading-tight sm:text-[26px] sm:leading-none">
            {r.suffix && <span className="text-ink-3">-</span>}
            {r.stem}
            {r.okurigana && <span className="text-ink-3">・{r.okurigana}</span>}
            {r.prefix && <span className="text-ink-3">-</span>}
        </span>
    );
}

/** The kanji inside a word, in the theme colour. */
function Highlight({ word, char }: { word: string; char: string }) {
    return (
        <>
            {Array.from(word).map((ch, i) =>
                ch === char ? (
                    <b key={i} className="font-extrabold text-c">
                        {ch}
                    </b>
                ) : (
                    ch
                ),
            )}
        </>
    );
}

function ShadeMark({ shade, name }: { shade: Shade; name?: string }) {
    return (
        <>
            <InkSwatch shade={shade} className="size-3 rounded-[3px]" />
            <span lang="ja" className="font-jp">
                {SHADE_JP[shade]}
            </span>
            {name && <span className="max-sm:sr-only lg:max-xl:sr-only">{name}</span>}
        </>
    );
}

/** The bar's shade tag: the change made in this visit ("淡 → 中"), else where the next shade comes from. */
function ShadeTag({ start, entry }: { start: Shade; entry: InkEntry | undefined }) {
    const shade = entry?.shade ?? 0;
    const arrow = (
        <>
            <span aria-hidden>→</span>
            <span className="sr-only">then</span>
        </>
    );
    if (shade !== start) {
        return (
            <Tag className="shrink-0">
                <span className="sr-only">Your ink:</span>
                <ShadeMark shade={start} name={SHADE_NAMES[start]} />
                {arrow}
                <ShadeMark shade={shade} name={SHADE_NAMES[shade]} />
            </Tag>
        );
    }
    const goal = nextShadeGoal(entry);
    return (
        <Tag className="shrink-0">
            <span className="sr-only">Your ink:</span>
            <ShadeMark shade={shade} name={SHADE_NAMES[shade]} />
            {goal && (
                <>
                    {arrow}
                    <ShadeMark shade={goal.to} name={`after ${goal.after}`} />
                </>
            )}
        </Tag>
    );
}

interface LearnLayerProps {
    data: LearnData;
    onClose: () => void;
}

/**
 * The four-step loop on a kanji page (#learn): 会 Meet, 想 Recall, 描 Trace,
 * 書 Write. Every step can be skipped, wrong answers cost nothing, writing is
 * optional and checked locally. Completed steps raise the kanji's ink
 * (recordStep), and the learner can set any shade by hand.
 */
export function LearnLayer({ data, onClose }: LearnLayerProps) {
    const { char } = data;
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLElement>(null);
    const writerApi = useRef<WriterApi | null>(null);
    const ids = useId();
    const titleId = `${ids}-title`;
    const tabsId = `${ids}-steps`;
    const pickerId = `${ids}-ink`;

    // The layer only mounts after the ink store has hydrated, so this is the ink the learner arrived with.
    const [arrived] = useState(() => useInkStore.getState().entries[char]);
    const start: Shade = arrived?.shade ?? 0;
    // Open at the first unfinished step; the tabs reach the others.
    const [step, setStep] = useState<LearnStep>(() => firstStep(arrived));
    const [done, setDone] = useState<Set<LearnStep>>(() => new Set());
    const [inkMsg, setInkMsg] = useState("");
    const [pickerOpen, setPickerOpen] = useState(false);
    const entry = useInkStore((state) => state.entries[char]);

    // Recall
    const [wrong, setWrong] = useState<Set<string>>(() => new Set());
    const [right, setRight] = useState(false);

    // Trace
    const total = data.strokes.length;
    const [at, setAt] = useState(1);
    const [replay, setReplay] = useState(0);

    // Write
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
            restoreLearnFocus();
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

    // Read out each ink change for this kanji.
    useEffect(
        () =>
            useInkStore.subscribe((state, prev) => {
                const from = prev.entries[char]?.shade ?? 0;
                const to = state.entries[char]?.shade ?? 0;
                if (from !== to) setInkMsg(`Your ink for ${char}: ${shadeLabel(from)} → ${shadeLabel(to)}`);
            }),
        [char],
    );

    // A step's buttons go away with it: if focus went with them, put it on the new step.
    useEffect(() => {
        const root = rootRef.current;
        const active = document.activeElement;
        if (root && (!active || active === document.body || !root.contains(active))) panelRef.current?.focus({ preventScroll: true });
    }, [step, finished]);

    const complete = (s: InkStep) => {
        useInkStore.getState().recordStep(char, s, true);
        trackEvent("learn_step_completed", { kanji: char, step: s });
        setDone((d) => new Set(d).add(s));
    };

    const go = (s: LearnStep) => {
        setStep(s);
        if (s === "trace") setReplay((r) => r + 1);
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
    const traceTo = (n: number) => {
        setAt(n);
        setReplay((r) => r + 1);
    };

    const onWritten = () => {
        setWritten(true);
        setFinished(true);
        complete("write");
    };

    const writing = step === "write" && !finished && total > 0;
    const ended = step === "write" && finished;
    let mode: StageMode = "meet";
    if (step === "recall") mode = "recall";
    if (step === "trace" && total) mode = "trace";
    if (writing) mode = "write";

    const partsLine = data.parts.map((p) => `${p.char}${p.gloss ? ` ${p.gloss}` : ""} (${p.roleLabel})`).join(", ");
    const stageLabel =
        mode === "trace"
            ? `${char}, stroke ${at} of ${total}`
            : mode === "write"
              ? `Writing area for ${char}`
              : mode === "recall"
                ? char
                : `${char}, ${data.meaning}${partsLine ? `. Parts: ${partsLine}` : ""}`;

    const stepIndex = LEARN_STEPS.findIndex((s) => s.id === step);
    const current = LEARN_STEPS[stepIndex];
    const headWord = data.meaning.split(",")[0];

    const wrongFrom = [...wrong].map((t) => data.recall.options.find((o) => o.text === t)?.from);
    const lastWrong = wrongFrom[wrongFrom.length - 1];
    const recallNote = right
        ? `Right: ${char} means ${data.recall.answer}.`
        : wrong.size
          ? `Not quite${lastWrong ? `: that one is ${lastWrong}` : ""}. Your shade stays where it is. Try another.`
          : "Pick one. Keys 1 to 4 work too.";

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
            {/* Bar: close, the kanji, the four steps, the shade change */}
            <header className="sticky top-0 z-10 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2.5 border-b border-line bg-bg px-4 py-2.5 sm:px-6 lg:grid lg:h-16 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:gap-5 lg:px-8 lg:py-0">
                <div className="flex min-w-0 flex-1 items-center gap-3 lg:gap-5">
                    <Button iconOnly onClick={onClose} aria-label={`Close and go back to ${char}`}>
                        <X aria-hidden />
                    </Button>
                    <h2 id={titleId} className="flex min-w-0 items-baseline gap-2.5 whitespace-nowrap">
                        <span lang="ja" className="font-jp text-[22px] font-extrabold leading-none">
                            {char}
                        </span>
                        <b className="truncate font-bold">{headWord}</b>
                        <span className="text-sm text-ink-2 max-xl:sr-only">· learn it in four steps</span>
                    </h2>
                </div>
                <Tabs
                    id={tabsId}
                    label="Steps"
                    value={step}
                    onChange={go}
                    items={LEARN_STEPS.map((s) => ({
                        value: s.id,
                        jp: s.jp,
                        live: s.id === step,
                        label: (
                            <>
                                {s.en}
                                {done.has(s.id) && <span className="sr-only"> (done)</span>}
                            </>
                        ),
                    }))}
                    className="order-last w-full max-lg:[&>button]:flex-1 max-lg:[&>button]:justify-center max-sm:[&>button]:px-2 lg:order-none lg:w-fit"
                />
                <div className="flex justify-end">
                    <ShadeTag start={start} entry={entry} />
                </div>
            </header>

            <p aria-live="polite" className="sr-only">
                {inkMsg}
            </p>

            {/* Stage and step card */}
            <div className="grid flex-1 content-start justify-items-center gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,520px)_minmax(0,480px)] lg:content-center lg:justify-center lg:gap-14 lg:px-10 lg:py-12">
                <div className="w-full max-w-[300px] sm:max-w-[400px] lg:max-w-none">
                    <LearnStage data={data} mode={mode} at={at} replay={replay} label={stageLabel} caption={writing ? "Write with your finger, mouse or pen" : undefined}>
                        {writing ? <WriteCanvas strokes={data.strokes} apiRef={writerApi} onComplete={onWritten} /> : undefined}
                    </LearnStage>
                </div>

                <section
                    ref={panelRef}
                    role="tabpanel"
                    tabIndex={-1}
                    id={tabPanelId(tabsId, step)}
                    aria-labelledby={tabId(tabsId, step)}
                    className="flex w-full max-w-[520px] flex-col gap-4 rounded-2xl border border-line bg-card p-5 outline-none sm:gap-5 sm:p-7 lg:max-w-none"
                >
                    {ended ? (
                        <KindLabel jp="了">{written ? "Written from memory" : "That's the loop"}</KindLabel>
                    ) : (
                        <KindLabel jp={current.jp}>
                            Step {stepIndex + 1} of 4 · {current.en}
                        </KindLabel>
                    )}

                    {step === "meet" && (
                        <>
                            <div className="flex flex-col gap-2">
                                <h3 className="type-title">{data.meaning}</h3>
                                <p className="text-sm text-ink-3">{data.meta}</p>
                            </div>
                            {data.readings.length > 0 ? (
                                <ul className="grid grid-cols-2 gap-3">
                                    {data.readings.map((r, i) => (
                                        <li key={i} className="flex min-w-0 flex-col gap-1.5 rounded-xl border border-line bg-bg px-4 py-3.5">
                                            <Kana r={r} />
                                            <span className="text-[13px] text-ink-3">
                                                {READING_KIND[r.kind]} · {r.romaji}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-ink-2">No reading of its own: it is read as part of each word.</p>
                            )}
                            {data.parts.length > 0 && (
                                <ul aria-label="Parts" className="flex flex-wrap items-center gap-2.5">
                                    {data.parts.map((part, i) => (
                                        <li key={part.char} className="flex items-center gap-2.5">
                                            {i > 0 && <PartPlus />}
                                            <PartChip
                                                char={part.char}
                                                role={partRole(part.role)}
                                                label={part.gloss ?? undefined}
                                                note={part.roleLabel}
                                                href={part.href ?? undefined}
                                                size="sm"
                                            />
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {data.memory && (
                                <MemoryStory className="border-0 bg-transparent p-0" label="Memory story · made up to help you remember">
                                    {data.memory}
                                </MemoryStory>
                            )}
                            <Button
                                variant="primary"
                                size="lg"
                                className="self-start"
                                onClick={() => {
                                    complete("meet");
                                    go("recall");
                                }}
                            >
                                I&apos;ve met it · next <ArrowRight aria-hidden />
                            </Button>
                        </>
                    )}

                    {step === "recall" && (
                        <>
                            <h3 className="type-section">What does it mean?</h3>
                            <ul className="grid gap-2.5 sm:grid-cols-2">
                                {data.recall.options.map((o, i) => {
                                    const isWrong = wrong.has(o.text);
                                    const isRight = right && o.text === data.recall.answer;
                                    return (
                                        <li key={o.text}>
                                            <button
                                                type="button"
                                                onClick={() => pick(o.text)}
                                                aria-pressed={isRight || isWrong}
                                                className={cn(
                                                    buttonClass({ size: "lg" }),
                                                    "h-auto min-h-[52px] w-full whitespace-normal py-2.5 text-center leading-snug",
                                                    isRight && "border-c bg-c/15 hover:border-c",
                                                    isWrong && "border-dashed border-ink-3 text-ink-2 hover:border-ink-3",
                                                    right && !isRight && "text-ink-3 hover:border-line-2",
                                                )}
                                            >
                                                <span className="sr-only">{i + 1}. </span>
                                                {o.text}
                                                {isRight && <Check aria-hidden className="text-c" />}
                                                {isWrong && <span className="sr-only"> (not this one)</span>}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <p aria-live="polite" className="min-h-[3em] text-[15px] leading-relaxed text-ink-2">
                                {recallNote}
                            </p>
                            <Button variant="primary" size="lg" className="self-start" onClick={() => go("trace")}>
                                Next: trace it <ArrowRight aria-hidden />
                            </Button>
                        </>
                    )}

                    {step === "trace" &&
                        (total > 0 ? (
                            <>
                                <h3 className="type-section">Trace each stroke</h3>
                                <p aria-live="polite" className="text-[15px] leading-relaxed text-ink-2">
                                    Start at the dot. {traceNote(at, total, strokeTypeName(data.strokes[at - 1]?.type ?? ""), data.owners, data.parts)}
                                </p>
                                <p className="text-sm text-ink-3 max-sm:hidden">Follow it with your finger or your eyes, then go on.</p>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <Button iconOnly onClick={() => traceTo(Math.max(1, at - 1))} disabled={at <= 1} aria-label="Previous stroke">
                                        <ArrowLeft aria-hidden />
                                    </Button>
                                    <Button onClick={() => setReplay((r) => r + 1)}>Show me</Button>
                                    <Button variant="quiet" onClick={() => traceTo(1)} disabled={at <= 1}>
                                        Restart
                                    </Button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <Button variant="primary" size="lg" onClick={traceNext}>
                                        {at < total ? "Next stroke" : "Done · next: write it"} <ArrowRight aria-hidden />
                                    </Button>
                                    <Button variant="quiet" onClick={() => go("write")}>
                                        Skip this step
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="type-section">Trace each stroke</h3>
                                <p className="text-[15px] leading-relaxed text-ink-2">No stroke data for this kanji yet, so there is nothing to trace.</p>
                                <Button variant="primary" size="lg" className="self-start" onClick={() => go("write")}>
                                    Go on <ArrowRight aria-hidden />
                                </Button>
                            </>
                        ))}

                    {step === "write" && !finished && (
                        <>
                            <h3 className="type-section">Write it from memory</h3>
                            {total > 0 ? (
                                <>
                                    <p className="text-[15px] leading-relaxed text-ink-2">
                                        {total} {total === 1 ? "stroke" : "strokes"}, checked here in your browser. A stroke in the wrong place fades; just try it again.{" "}
                                        {writeGoal(char, entry)}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2.5">
                                        <Button onClick={() => writerApi.current?.hint()}>Show next stroke</Button>
                                        <Button variant="quiet" onClick={() => writerApi.current?.clear()}>
                                            Clear
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                                        <Button variant="primary" size="lg" onClick={() => setFinished(true)}>
                                            Finish
                                        </Button>
                                        <span className="text-sm text-ink-3">Writing is optional.</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-[15px] leading-relaxed text-ink-2">No stroke data for this kanji yet, so it can&apos;t be checked here.</p>
                                    <Button variant="primary" size="lg" className="self-start" onClick={() => setFinished(true)}>
                                        Finish
                                    </Button>
                                </>
                            )}
                        </>
                    )}

                    {ended && (
                        <>
                            <h3 className="type-section">{written ? `You wrote ${char}.` : `You've been through ${char}.`}</h3>
                            <p className="text-[15px] leading-relaxed text-ink-2">
                                Ink darkens as you meet, recall, trace and write; writing it again on another day takes it further. Or set it yourself:
                            </p>
                            <InkPicker char={char} source="learn" />
                            <div className="flex flex-wrap gap-2.5 pt-1">
                                {data.next && (
                                    <Button variant="primary" size="lg" href={`${kanjiPath(data.next.char)}#learn`}>
                                        Next:{" "}
                                        <span lang="ja" className="font-jp">
                                            {data.next.char}
                                        </span>{" "}
                                        {data.next.meaning} <ArrowRight aria-hidden />
                                    </Button>
                                )}
                                <Button variant={data.next ? "secondary" : "primary"} size="lg" onClick={onClose}>
                                    Back to{" "}
                                    <span lang="ja" className="font-jp">
                                        {char}
                                    </span>
                                </Button>
                            </div>
                        </>
                    )}

                    {!ended && (
                        <div className="flex flex-col gap-3 border-t border-line pt-4">
                            <p className="text-xs leading-normal text-ink-3">
                                A wrong answer never lowers a shade.{" "}
                                <button
                                    type="button"
                                    aria-expanded={pickerOpen}
                                    aria-controls={pickerId}
                                    onClick={() => setPickerOpen((o) => !o)}
                                    className="cursor-pointer text-ink-2 underline underline-offset-2 hover:text-ink"
                                >
                                    {pickerOpen ? "Hide the shades" : "Set the shade yourself"}
                                </button>
                            </p>
                            {pickerOpen && (
                                <div id={pickerId}>
                                    <InkPicker char={char} source="learn" />
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>

            {/* Words and teaching tools */}
            <footer className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:px-8 lg:min-h-16">
                {data.words.length > 0 && (
                    <>
                        <span className="type-label">Words</span>
                        <ul className="flex min-w-0 flex-wrap gap-x-6 gap-y-1">
                            {data.words.map((w) => (
                                <li key={w.word} className="flex min-w-0 items-baseline gap-2.5 py-1 text-sm text-ink-2">
                                    <span lang="ja" className="whitespace-nowrap font-jp text-[19px] font-extrabold text-ink">
                                        <Highlight word={w.word} char={char} />
                                    </span>
                                    <span lang="ja" className="whitespace-nowrap text-[13px] text-ink-3">
                                        {w.reading}
                                    </span>
                                    <span className="min-w-0">{w.meaning}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
                <span className="flex-1" />
                <div className="flex flex-wrap gap-1">
                    <Button variant="quiet" size="sm" href={data.presentHref} prefetch={false} rel="nofollow">
                        <Presentation aria-hidden /> Present
                    </Button>
                    <Button variant="quiet" size="sm" href={data.printHref} prefetch={false} rel="nofollow">
                        <Printer aria-hidden /> Print practice sheet
                    </Button>
                </div>
            </footer>
        </div>
    );
}
