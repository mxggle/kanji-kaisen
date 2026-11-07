"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { DUR, EASE, STAGGER } from "@/components/Motion/tokens";
import { SkinToggle } from "@/components/Skin/SkinToggle";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import styles from "./motion-lab.module.css";

export interface KindDemo {
    /** Unique per demo when a kind is shown twice (a single rise and a staggered group). */
    id?: string;
    /** The hook's value: data-enter="rise" and so on. */
    kind: "rise" | "ink" | "unroll" | "stamp" | "fade" | "brush" | "drift";
    /** Where it is used. */
    use: string;
    /** Duration and curve, as app/motion.css sets them. */
    timing: string;
    /** What it is shown on. For a group, its children are the items. */
    specimen: ReactNode;
    /** A sequence: the hook goes on the parent as data-*-group, children staggered. */
    group?: boolean;
}

const EASES = [
    { token: "--ease-out", key: "out", use: "The house curve: arrives fast, settles slow. Entrances and UI." },
    { token: "--ease-ink", key: "ink", use: "Ink soaking in: titles, glyphs, page enter, art." },
    { token: "--ease-in", key: "in", use: "Leaving. Exits are short." },
    { token: "--ease-in-out", key: "inOut", use: "Lifts, wipes and brush sweeps." },
    { token: "--ease-stamp", key: "stamp", use: "A seal pressed: one small overshoot, no wobble." },
] as const;

const DURATIONS = [
    { token: "--dur-micro", ms: DUR.micro * 1000, use: "Press feedback, toggles" },
    { token: "--dur-ui", ms: DUR.ui * 1000, use: "Menus, popovers, tab pills, dialog exit" },
    { token: "--dur-stroke", ms: DUR.stroke * 1000, use: "One kanji stroke" },
    { token: "--dur-enter", ms: DUR.enter * 1000, use: "Entrances" },
    { token: "--dur-art", ms: DUR.art * 1000, use: "Art and big panels (unroll)" },
    { token: "--stagger", ms: STAGGER * 1000, use: "Between items in a sequence, up to 14" },
] as const;

const LONGEST = DUR.art * 1000;
const STROKE_GAP = 90;

const reduceQuery = "(prefers-reduced-motion: reduce)";
function subscribeReduce(onChange: () => void) {
    const mq = window.matchMedia(reduceQuery);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
}

/** A cubic-bezier as a curve in a 100-unit box (y up), with room for the stamp's overshoot. */
function curve([x1, y1, x2, y2]: readonly number[]) {
    return `M0 100C${x1 * 100} ${100 - y1 * 100} ${x2 * 100} ${100 - y2 * 100} 100 0`;
}

function Replay({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <Button variant="quiet" size="sm" onClick={onClick} aria-label={`Replay ${label}`}>
            <RotateCcw aria-hidden /> Replay
        </Button>
    );
}

function Code({ children }: { children: ReactNode }) {
    return <code className="text-xs text-ink-3">{children}</code>;
}

/**
 * /system, Motion: the living reference for docs/design/motion.md. Every
 * kind on the real hook (it first plays as you scroll to it, data-reveal;
 * Replay mounts it again with data-enter), the stroke draw, the eases and the
 * durations, and the interaction patterns as live controls.
 */
export function MotionLab({ kinds, strokes, strokeChar }: { kinds: KindDemo[]; strokes: string[]; strokeChar: string }) {
    const rootRef = useRef<HTMLDivElement>(null);
    const reduced = useSyncExternalStore(subscribeReduce, () => window.matchMedia(reduceQuery).matches, () => false);
    const [runs, setRuns] = useState<Record<string, number>>({});
    // The draw, the eases and the durations start when the section is first seen.
    const [seen, setSeen] = useState(false);
    const [drawing, setDrawing] = useState(false);
    const [pressed, setPressed] = useState(true);

    useEffect(() => {
        const el = rootRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (!entries.some((e) => e.isIntersecting)) return;
                io.disconnect();
                setSeen(true);
                setDrawing(true);
            },
            { threshold: 0.1 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // The stroke draw is live (it glows in 夜) only while it is drawing.
    const drawRun = runs.draw ?? 0;
    useEffect(() => {
        if (!drawing) return;
        const ms = reduced ? 0 : (strokes.length - 1) * STROKE_GAP + DUR.stroke * 1000;
        const timer = window.setTimeout(() => setDrawing(false), ms);
        return () => window.clearTimeout(timer);
    }, [drawing, drawRun, reduced, strokes.length]);

    const replay = (...ids: string[]) => {
        setRuns((r) => {
            const next = { ...r };
            for (const id of ids) next[id] = (next[id] ?? 0) + 1;
            return next;
        });
        if (ids.includes("draw")) setDrawing(true);
    };
    const replayAll = () => replay(...kinds.map((k) => k.id ?? k.kind), "draw", "eases", "durations");

    return (
        <div ref={rootRef} className="flex flex-col gap-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-[60ch] text-sm text-ink-2">
                    {reduced
                        ? "This device asks for reduced motion, so everything here (and on the site) simply appears."
                        : "Each kind on its real hook. It plays as you scroll to it; Replay mounts it again."}
                </p>
                <Button size="sm" onClick={replayAll}>
                    <RotateCcw aria-hidden /> Replay all
                </Button>
            </div>

            {/* Kinds */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {kinds.map(({ id = "", kind, use, timing, specimen, group }) => {
                    const demo = id || kind;
                    const run = runs[demo] ?? 0;
                    const hook = `data-${run ? "enter" : "reveal"}${group ? "-group" : ""}`;
                    return (
                        <article key={demo} className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                            <div className="grid h-32 place-items-center overflow-hidden rounded-xl border border-line bg-bg">
                                <div key={run} {...{ [hook]: kind }} className="flex items-center justify-center gap-2">
                                    {specimen}
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <h3 className="font-bold text-ink">
                                    {kind}
                                    {group && <span className="font-normal text-ink-2"> · in turn</span>}
                                </h3>
                                <Replay label={group ? `${kind} in turn` : kind} onClick={() => replay(demo)} />
                            </div>
                            <p className="flex-1 text-sm text-ink-2">{use}</p>
                            <p className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                                <Code>{group ? `data-enter-group="${kind}"` : `data-enter="${kind}"`}</Code>
                                <Code>{timing}</Code>
                            </p>
                        </article>
                    );
                })}

                <article className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                    <div className="grid h-32 place-items-center overflow-hidden rounded-xl border border-line bg-bg">
                        <svg
                            viewBox="0 0 109 109"
                            aria-hidden
                            className={cn("size-24 fill-none stroke-c [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:4.5]", drawing && "live")}
                        >
                            {seen && (
                                <g key={drawRun}>
                                    {strokes.map((d, i) => (
                                        <path key={i} d={d} pathLength={1} className="kk-draw" style={{ "--i": i } as CSSProperties} />
                                    ))}
                                </g>
                            )}
                        </svg>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-bold text-ink">
                            stroke draw{" "}
                            <span lang="ja" className="font-jp font-normal text-ink-2">
                                {strokeChar}
                            </span>
                        </h3>
                        <Replay label="the stroke draw" onClick={() => replay("draw")} />
                    </div>
                    <p className="flex-1 text-sm text-ink-2">Strokes in order, each after the last, on paths with pathLength=&quot;1&quot;. Live only while it draws.</p>
                    <p className="flex flex-wrap justify-between gap-x-3 gap-y-1">
                        <Code>className=&quot;kk-draw&quot; · --i</Code>
                        <Code>
                            {DUR.stroke * 1000}ms · {STROKE_GAP}ms apart
                        </Code>
                    </p>
                </article>
            </div>

            {/* Eases */}
            <section aria-labelledby="motion-eases" className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 id="motion-eases" className="type-label">
                        Eases · each dot crosses in {DUR.art * 1000}ms
                    </h3>
                    <Replay label="the eases" onClick={() => replay("eases")} />
                </div>
                <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line bg-card px-4">
                    {EASES.map(({ token, key, use }, i) => (
                        <li key={token} className="grid grid-cols-[56px_minmax(0,1fr)] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[56px_minmax(0,16rem)_minmax(0,1fr)]">
                            <svg viewBox="-4 -28 108 136" aria-hidden className="row-span-2 size-14 overflow-visible fill-none sm:row-span-1">
                                <path d="M0 100H100M0 0H100" className="stroke-line [stroke-dasharray:2_3] [stroke-width:1]" />
                                <path d={curve(EASE[key])} className="stroke-ink [stroke-linecap:round] [stroke-width:3]" />
                            </svg>
                            <div className="flex min-w-0 flex-col gap-0.5">
                                <Code>{token}</Code>
                                <span className="text-sm text-ink-2">{use}</span>
                            </div>
                            {/* Clipped: the travelling layer is track-wide, so its translated box would widen the page. */}
                            <div className="relative h-3 min-w-0 overflow-hidden">
                                <span aria-hidden className="absolute inset-x-0 top-1/2 h-px bg-line-2" />
                                {seen && (
                                    <span
                                        key={runs.eases ?? 0}
                                        aria-hidden
                                        className={cn("absolute inset-0", styles.travel)}
                                        style={{ "--lab-ease": `var(${token})`, "--lab-wait": `${i * 80}ms` } as CSSProperties}
                                    >
                                        <span className="block size-3 rounded-full bg-ink" />
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            {/* Durations */}
            <section aria-labelledby="motion-durations" className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 id="motion-durations" className="type-label">
                        Durations · each bar fills in its own time
                    </h3>
                    <Replay label="the durations" onClick={() => replay("durations")} />
                </div>
                <ul className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                    {DURATIONS.map(({ token, ms, use }) => (
                        <li key={token} className="grid grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] items-center gap-x-4 gap-y-1 sm:grid-cols-[minmax(0,10.5rem)_minmax(0,14rem)_minmax(0,1fr)]">
                            <Code>
                                {token} · {ms}ms
                            </Code>
                            <span className="text-sm text-ink-2 max-sm:order-last max-sm:col-span-2">{use}</span>
                            <span aria-hidden className="relative block h-1.5 rounded-full bg-line" style={{ width: `${(ms / LONGEST) * 100}%` }}>
                                {seen && (
                                    <span
                                        key={runs.durations ?? 0}
                                        className={cn("absolute inset-0 rounded-full bg-ink-2", styles.fill)}
                                        style={{ "--lab-dur": `var(${token})` } as CSSProperties}
                                    />
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
                <p className="text-sm text-ink-2">Exits take about half as long as entrances. Nothing the learner waits on takes longer than 300ms to respond.</p>
            </section>

            {/* Patterns */}
            <section aria-labelledby="motion-patterns" className="flex flex-col gap-4">
                <h3 id="motion-patterns" className="type-label">
                    Patterns · try them
                </h3>
                <dl className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                        <dt className="font-bold text-ink">Press</dt>
                        <dd className="flex flex-col gap-3 text-sm text-ink-2">
                            Buttons and chips give a little under the finger: scale .97 over --dur-micro. Not links in text.
                            <span className="flex flex-wrap items-center gap-2.5">
                                <Button size="sm">Press me</Button>
                                <Chip pressed={pressed} onClick={() => setPressed((p) => !p)}>
                                    Toggle me
                                </Chip>
                            </span>
                        </dd>
                    </div>
                    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                        <dt className="font-bold text-ink">
                            Skin <span lang="ja">夜</span>/<span lang="ja">墨</span>
                        </dt>
                        <dd className="flex flex-col gap-3 text-sm text-ink-2">
                            The new skin spreads like ink from the button you press, and the pill slides across. Instant with reduced motion.
                            <span>
                                <SkinToggle size="sm" />
                            </span>
                        </dd>
                    </div>
                    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                        <dt className="font-bold text-ink">Tabs</dt>
                        <dd className="text-sm text-ink-2">
                            The ink pill slides to the new tab ({DUR.ui * 1000}ms, --ease-out) and the panel fades in over 200ms. A live tab&apos;s glow
                            relights as the pill lands. Try the tabs under “Section header and tabs”.
                        </dd>
                    </div>
                    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                        <dt className="font-bold text-ink">Dialogs and the learn layer</dt>
                        <dd className="text-sm text-ink-2">
                            The backdrop fades in over --dur-ui; the panel rises 12px and soaks in over --dur-enter on --ease-ink. Closing takes about
                            half the time on --ease-in. Focus and Esc behave as before.
                        </dd>
                    </div>
                    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                        <dt className="font-bold text-ink">Success</dt>
                        <dd className="text-sm text-ink-2">A stamp on the mark that changed: the new shade, the right answer&apos;s tick. Never confetti.</dd>
                    </div>
                    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-card p-4">
                        <dt className="font-bold text-ink">Page change</dt>
                        <dd className="text-sm text-ink-2">
                            The old page fades up and out in 200ms and the new one rises in over 520ms. A glyph, seal or theme art with the same name on
                            both pages flies between them.
                        </dd>
                    </div>
                </dl>
            </section>
        </div>
    );
}
