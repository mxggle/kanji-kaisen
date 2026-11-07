"use client";

import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { defaultCaption, journeyTabs, type AncientJourneyStage, type JourneyStageId, type JourneyTab } from "@/lib/story/journey";
import { Button } from "@/components/ui/Button";
import { KindLabel } from "@/components/ui/SectionHeader";
import { creditGroups, journeyLede, listSeparator, stageEra, STAGE_LABELS, TODAY_REF, TODAY_WHEN } from "@/components/Journey/player";

export type { AncientJourneyStage, JourneyStageId };

export interface JourneyPlayerProps {
    char: string;
    // Ancient stages with a self-hosted, sourced file (from getAncientForms).
    // Only these render; missing stages are skipped. Never redrawn.
    stages: AncientJourneyStage[];
    // KanjiVG path `d` attributes in stroke order (from getTodayStrokes).
    todayStrokes: string[];
    // Sourced captions per stage. Plate: shown under the stage when given;
    // both variants read them out with the stage.
    captions?: Partial<Record<JourneyStageId, string>>;
    // Catalogue reference per stage ("甲600 (商)", from the file's `ref`), shown in the plate's stage caption.
    refs?: Partial<Record<JourneyStageId, string>>;
    // A theme colour (hex) for --tc; defaults to the inherited theme.
    accent?: string;
    // Plate: left side of the control row; defaults to "字の旅 · 3,000 years in four forms".
    title?: ReactNode;
    // Shown when there are no ancient stages; null hides it.
    emptyNote?: string | null;
    // Fire `journey_played` on Play (pages that track their own event pass false).
    analytics?: boolean;
    // Sent as `radical` with `journey_played`; defaults to `char`. Radical pages
    // pass their key so side forms (kihen) aren't counted as the base (ki).
    analyticsId?: string;
    // plate: the radical page's specimen (stage, Play, stage tabs, credit).
    // tab: the kanji specimen's Ancient tab (every stage in a 2×2 grid, credit).
    variant?: "plate" | "tab";
    className?: string;
}

const STEP_MS = 1400;
const DEFAULT_EMPTY_NOTE = "No ancient form with a clear public-domain source has been found for this character yet.";

// The stroke being drawn (dash offset 1 -> 0 over a unit pathLength), on the motion tokens (app/motion.css).
const CSS = `
.kkj-draw{stroke-dasharray:1;stroke-dashoffset:1;animation:kkj-draw var(--dur-stroke) var(--ease-out) 80ms forwards}
@keyframes kkj-draw{to{stroke-dashoffset:0}}
`;

/**
 * A stage of the plate, by its place in time: the one shown, one already
 * passed (it recedes, smaller) or one still to come (it waits a little larger
 * and settles in like a seal pressed). Moving forward, each form gives way to
 * the next; moving back, they rewind. The incoming form soaks in on the ink
 * curve while the outgoing one leaves in half the time.
 */
const STAGE_STATE = {
    shown: "opacity-100 duration-[640ms] ease-(--ease-ink) delay-[60ms]",
    past: "scale-[.94] opacity-0 duration-(--dur-ui) ease-(--ease-in)",
    next: "scale-[1.05] opacity-0 duration-(--dur-ui) ease-(--ease-in)",
} as const;

/** The kanji page's Ancient tab: small figures, so a lighter blur. */
const GRID_ENTER = { "--blur": "6px" } as CSSProperties;

/** The stage strip arrives oldest first, after the plate starts to unroll: the journey read in order. */
const STRIP_ENTER = { "--delay": "180ms", "--blur": "6px" } as CSSProperties;

const STROKE_SVG = "fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:4.4]";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A sourced ancient form, drawn in the current text colour through its file as a mask. */
function AncientMask({ src, className }: { src: string; className?: string }) {
    const style: CSSProperties = {
        WebkitMaskImage: `url("${src}")`,
        maskImage: `url("${src}")`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
    };
    return <span aria-hidden className={cn("block bg-current", className)} style={style} />;
}

/**
 * Today's form from KanjiVG. `step` is the stroke being drawn (it alone sits
 * in the `live` layer, rule 5); strokes after it wait in grey. null: all drawn.
 */
function TodayStrokes({ strokes, step, onStrokeEnd }: { strokes: string[]; step: number | null; onStrokeEnd: () => void }) {
    return (
        <>
            <svg viewBox="0 0 109 109" aria-hidden focusable="false" className={cn("absolute inset-[9%] size-[82%]", STROKE_SVG)}>
                {strokes.map((d, i) => (
                    <path key={i} d={d} className={step === null || i < step ? "stroke-c" : "stroke-line-2"} />
                ))}
            </svg>
            {step !== null && strokes[step] && (
                <svg viewBox="0 0 109 109" aria-hidden focusable="false" className={cn("live absolute inset-[9%] size-[82%]", STROKE_SVG)}>
                    <path key={step} d={strokes[step]} pathLength={1} className="kkj-draw stroke-c" onAnimationEnd={onStrokeEnd} />
                </svg>
            )}
        </>
    );
}

/** "Oracle bone, bronze and small seal: Academia Sinica 小學堂, CC0. Today’s form: KanjiVG, CC BY-SA 3.0." */
function Credit({ tabs, className }: { tabs: JourneyTab[]; className?: string }) {
    const groups = creditGroups(tabs);
    return (
        <p className={cn("text-xs leading-normal text-ink-3", className)}>
            {groups.map((group, g) => (
                <Fragment key={group.source}>
                    {g > 0 && " "}
                    {group.stages.map((stage, i) => (
                        <Fragment key={stage.id}>
                            {listSeparator(i, group.stages.length)}
                            {stage.href ? (
                                <a href={stage.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-colors hover:text-ink">
                                    {stage.label}
                                </a>
                            ) : (
                                stage.label
                            )}
                        </Fragment>
                    ))}
                    : {group.source}.
                </Fragment>
            ))}
        </p>
    );
}

function stageLabel(char: string, tab: JourneyTab): string {
    const where = tab.id === "today" ? "as written today" : `in ${STAGE_LABELS[tab.id].full.toLowerCase()} script`;
    return `${char} ${where}: ${tab.caption}`;
}

/** The kanji page's Ancient tab: every stage at once, oldest first, then the credit. */
function JourneyGrid({ char, tabs, todayStrokes, emptyNote, className, style }: { char: string; tabs: JourneyTab[]; todayStrokes: string[]; emptyNote: string | null; className?: string; style?: CSSProperties }) {
    const ancientCount = tabs.length - 1;
    return (
        <div className={cn("flex min-w-0 flex-col gap-3.5 text-ink", className)} style={style}>
            {/* Oldest first, each time the tab is shown (a hidden panel restarts its animations). */}
            <ul data-enter-group="ink" style={GRID_ENTER} className="grid grid-cols-2 gap-3">
                {tabs.map((tab) => (
                    <li key={tab.id} className="min-w-0">
                        <figure className="flex flex-col gap-2 rounded-xl bg-bg p-3.5">
                            <div role="img" aria-label={stageLabel(char, tab)} className="relative aspect-square w-full">
                                {tab.src ? (
                                    <AncientMask src={tab.src} className="absolute inset-[6%] text-ink" />
                                ) : todayStrokes.length ? (
                                    <svg viewBox="0 0 109 109" aria-hidden focusable="false" className={cn("absolute inset-[9%] size-[82%] stroke-ink", STROKE_SVG)}>
                                        {todayStrokes.map((d, i) => (
                                            <path key={i} d={d} />
                                        ))}
                                    </svg>
                                ) : (
                                    <span lang="ja" aria-hidden className="absolute inset-0 flex items-center justify-center font-jp text-[min(28vw,120px)] font-extrabold leading-none">
                                        {char}
                                    </span>
                                )}
                            </div>
                            <figcaption className="truncate text-xs text-ink-3">
                                <b className="font-medium text-ink-2">{STAGE_LABELS[tab.id].full}</b>
                                {tab.id !== "today" && <> · {stageEra(tab.when)}</>}
                            </figcaption>
                        </figure>
                    </li>
                ))}
            </ul>
            <Credit tabs={tabs} />
            {ancientCount === 0 && emptyNote ? <p className="text-xs leading-normal text-ink-3">{emptyNote}</p> : null}
        </div>
    );
}

/**
 * A character's journey: its sourced ancient forms (oracle bone, bronze,
 * small seal; only those with data, never redrawn) and today's form drawn
 * stroke by stroke from KanjiVG. The plate has one stage at a time, stage tabs
 * and Play; the tab variant shows every stage at once.
 */
export function JourneyPlayer({
    char,
    stages,
    todayStrokes,
    captions,
    refs,
    accent,
    title,
    emptyNote = DEFAULT_EMPTY_NOTE,
    analytics = true,
    analyticsId,
    variant = "plate",
    className,
}: JourneyPlayerProps) {
    const tabs = useMemo(() => journeyTabs(char, stages, captions), [char, stages, captions]);
    const last = tabs.length - 1;
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    // The today stroke being drawn, or null when every stroke shows.
    const [drawStep, setDrawStep] = useState<number | null>(null);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const uid = useId();

    const active = Math.min(index, last);
    const current = tabs[active];
    const ancientCount = tabs.length - 1;
    const rootStyle = accent ? ({ "--tc": accent } as CSSProperties) : undefined;

    const goTo = useCallback(
        (i: number) => {
            setIndex(i);
            setDrawStep(i === last && todayStrokes.length > 0 && !reducedMotion() ? 0 : null);
        },
        [last, todayStrokes.length],
    );

    useEffect(() => {
        if (!playing || active >= last) return;
        const timer = setTimeout(() => {
            goTo(active + 1);
            if (active + 1 >= last) setPlaying(false);
        }, STEP_MS);
        return () => clearTimeout(timer);
    }, [playing, active, last, goTo]);

    if (variant === "tab") {
        return <JourneyGrid char={char} tabs={tabs} todayStrokes={todayStrokes} emptyNote={emptyNote} className={className} style={rootStyle} />;
    }

    const play = () => {
        if (playing) {
            setPlaying(false);
            return;
        }
        if (analytics) trackEvent("journey_played", { radical: analyticsId ?? char, stages: tabs.length });
        // From an ancient stage (paused or picked), carry on from there;
        // from today, start again at the oldest form (or redraw today alone).
        if (active === last) goTo(ancientCount > 0 ? 0 : last);
        setPlaying(ancientCount > 0);
    };

    const pick = (i: number) => {
        setPlaying(false);
        if (i !== active || i === last) goTo(i);
    };

    const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
        const next =
            e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % tabs.length
            : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i - 1 + tabs.length) % tabs.length
            : e.key === "Home" ? 0
            : e.key === "End" ? last
            : null;
        if (next === null) return;
        e.preventDefault();
        pick(next);
        tabRefs.current[next]?.focus();
    };

    const onStrokeEnd = () => setDrawStep((s) => (s === null || s + 1 >= todayStrokes.length ? null : s + 1));

    const label = STAGE_LABELS[current.id];
    const when = current.id === "today" ? TODAY_WHEN : current.when;
    const ref = current.id === "today" ? TODAY_REF : refs?.[current.id];
    const shownCaption = captions?.[current.id];

    return (
        <div className={cn("flex min-w-0 flex-col gap-4 rounded-2xl border border-line bg-card p-3 text-ink sm:p-5", className)} style={rootStyle}>
            <style href="kk-journey-player" precedence="medium">
                {CSS}
            </style>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">{title ?? <KindLabel jp="字の旅">{journeyLede(tabs.map((t) => t.id))}</KindLabel>}</div>
                <Button size="sm" onClick={play} aria-pressed={playing} className="kkj-play">
                    {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
                    {playing ? "Pause" : "Play"}
                    <span className="sr-only">{ancientCount ? " the journey" : " the strokes"}</span>
                </Button>
            </div>

            <div
                role={ancientCount ? "tabpanel" : undefined}
                id={`${uid}-panel`}
                aria-labelledby={ancientCount ? `${uid}-tab-${current.id}` : undefined}
            >
                <div className="relative overflow-hidden rounded-xl bg-bg max-sm:h-[230px] sm:max-[959px]:h-[340px] min-[960px]:aspect-square">
                    <div role="img" aria-label={stageLabel(char, current)} className="absolute inset-0">
                        {tabs.map((tab, i) => (
                            <div
                                key={tab.id}
                                aria-hidden
                                className={cn(
                                    "absolute inset-x-0 top-0 bottom-9 transition-[opacity,transform] motion-reduce:transition-none",
                                    STAGE_STATE[i === active ? "shown" : i < active ? "past" : "next"],
                                )}
                            >
                                {tab.src ? (
                                    <AncientMask src={tab.src} className="absolute inset-[12%] text-ink" />
                                ) : todayStrokes.length ? (
                                    <TodayStrokes strokes={todayStrokes} step={i === active ? drawStep : null} onStrokeEnd={onStrokeEnd} />
                                ) : (
                                    <span lang="ja" className="absolute inset-0 flex items-center justify-center font-jp text-[min(44vw,240px)] font-extrabold leading-none text-c">
                                        {char}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* The caption changes with the stage: keyed, so the new one fades in (data-enter). */}
                    <p aria-live="polite" className="absolute inset-x-3 bottom-2.5 flex items-baseline justify-between gap-3 text-xs text-ink-3 sm:inset-x-4 sm:bottom-3">
                        <span key={current.id} data-enter="fade" className="min-w-0 truncate">
                            <b className="font-medium text-ink">{label.full}</b> · <span className="sm:hidden">{current.id === "today" ? when : stageEra(when)}</span>
                            <span className="max-sm:hidden">{when}</span>
                        </span>
                        {ref && (
                            <span key={`${current.id}-ref`} data-enter="fade" lang={current.id === "today" ? undefined : "zh-Hant"} className="max-w-[45%] shrink-0 truncate max-sm:hidden">
                                {ref}
                            </span>
                        )}
                    </p>
                </div>
                {shownCaption && current.caption !== defaultCaption(current.id, char) && (
                    <p key={current.id} data-enter="fade" className="mt-3 text-sm leading-relaxed text-ink-2">
                        {shownCaption}
                    </p>
                )}
            </div>

            {ancientCount > 0 && (
                <div
                    role="tablist"
                    aria-label={`Stages of ${char}`}
                    data-enter-group="ink"
                    className="relative grid gap-(--tab-gap) [--tab-gap:--spacing(1.5)] sm:[--tab-gap:--spacing(2)]"
                    style={{ ...STRIP_ENTER, gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
                >
                    {tabs.map((tab, i) => {
                        const selected = i === active;
                        return (
                            <button
                                key={tab.id}
                                ref={(el) => {
                                    tabRefs.current[i] = el;
                                }}
                                type="button"
                                role="tab"
                                id={`${uid}-tab-${tab.id}`}
                                aria-selected={selected}
                                aria-controls={`${uid}-panel`}
                                tabIndex={selected ? 0 : -1}
                                onClick={() => pick(i)}
                                onKeyDown={(e) => onTabKey(e, i)}
                                className={cn(
                                    "relative z-[1] flex min-h-14 min-w-0 cursor-pointer flex-col items-center gap-1 rounded-[10px] border px-1 py-2 text-[11px] font-medium sm:gap-1.5 sm:rounded-xl sm:py-2.5 sm:text-xs",
                                    "transition-[color,border-color,transform] duration-(--dur-micro) ease-(--ease-out) active:scale-[.97] motion-reduce:transition-none",
                                    // The selected outline is the sliding mark below.
                                    selected ? "border-transparent text-ink" : "border-line text-ink-3 hover:border-line-2 hover:text-ink",
                                )}
                            >
                                {tab.src ? (
                                    <AncientMask src={tab.src} className="size-[30px] sm:size-11" />
                                ) : (
                                    <span lang="ja" aria-hidden className="flex h-[30px] items-center font-jp text-2xl font-extrabold leading-none sm:h-11 sm:text-4xl">
                                        {char}
                                    </span>
                                )}
                                <span className="max-w-full truncate sm:hidden">{STAGE_LABELS[tab.id].short}</span>
                                <span className="max-w-full truncate max-sm:hidden">{STAGE_LABELS[tab.id].full}</span>
                            </button>
                        );
                    })}
                    {/* The selected stage's outline, one column wide: it slides from stage to stage as the journey plays. */}
                    <span
                        aria-hidden
                        className="pointer-events-none absolute inset-y-0 left-0 z-0 rounded-[10px] border border-c bg-bg transition-transform duration-(--dur-enter) ease-(--ease-ink) motion-reduce:transition-none sm:rounded-xl"
                        style={{
                            // It arrives with the strip, but never blurred: a soft --c edge would read as a glow (rule 5).
                            "--blur": "0px",
                            width: `calc((100% - ${tabs.length - 1} * var(--tab-gap)) / ${tabs.length})`,
                            transform: `translateX(calc(${active} * (100% + var(--tab-gap))))`,
                        } as CSSProperties}
                    />
                </div>
            )}

            <Credit tabs={tabs} />
            {ancientCount === 0 && emptyNote ? <p className="text-xs leading-normal text-ink-3">{emptyNote}</p> : null}
        </div>
    );
}
