"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";
import { journeyTabs, type AncientJourneyStage, type JourneyStageId } from "@/lib/story/journey";

export type { AncientJourneyStage, JourneyStageId };

export interface JourneyPlayerProps {
    char: string;
    // Ancient stages with a self-hosted, sourced SVG (from getAncientForms).
    // Only these render; missing stages are skipped.
    stages: AncientJourneyStage[];
    // KanjiVG path `d` attributes in stroke order (from getTodayStrokes).
    todayStrokes: string[];
    // Sourced captions per stage; generic script notes otherwise.
    captions?: Partial<Record<JourneyStageId, string>>;
    // Accent colour; defaults to the inherited theme accent `--c`.
    accent?: string;
    // Left side of the control row, e.g. a heading.
    title?: ReactNode;
    // Shown when there are no ancient stages; null hides it.
    emptyNote?: string | null;
    // Fire `journey_played` on Play (pages that track their own event pass false).
    analytics?: boolean;
    // Sent as `radical` with `journey_played`; defaults to `char`. Radical pages
    // pass their key so side forms (kihen) aren't counted as the base (ki).
    analyticsId?: string;
    className?: string;
}

const STEP_MS = 1500;
const DEFAULT_EMPTY_NOTE = "No ancient form with a clear public-domain source has been found for this character yet.";

// Scoped styles; colours come only from skin tokens (with fallbacks so the
// player works before the skins land). Glow applies in 夜 only.
const CSS = `
.kkj{--kkj-c:var(--c,#34D399);display:flex;flex-direction:column;gap:16px;color:var(--ink,#EDEAE2);min-width:0}
.kkj-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.kkj-play{height:40px;padding:0 18px;display:inline-flex;align-items:center;gap:8px;background:transparent;color:var(--ink,#EDEAE2);border:1px solid var(--line-2,rgba(237,234,226,.28));border-radius:20px;font:inherit;font-size:14px;cursor:pointer;transition:background-color .2s,color .2s}
.kkj-play:hover{background:var(--ink,#EDEAE2);color:var(--bg,#06070A)}
.kkj :focus-visible{outline:2px solid var(--ink,#EDEAE2);outline-offset:3px}
.kkj-stagebox{position:relative;width:100%;max-width:var(--kkj-size,520px);aspect-ratio:1/1;margin:0 auto}
.kkj-ring{position:absolute;inset:0;border-radius:50%;border:1px solid color-mix(in srgb,var(--kkj-c) 22%,transparent)}
.kkj-ring2{position:absolute;inset:5%;border-radius:50%;border:1px dashed var(--line,rgba(237,234,226,.12))}
.kkj-layer{position:absolute;inset:0;opacity:0;transform:scale(.92);transition:opacity .7s ease,transform .9s cubic-bezier(.2,.8,.2,1)}
.kkj-layer.kkj-on{opacity:1;transform:none}
.kkj-glyph{position:absolute;inset:13%}
.kkj-glow{filter:drop-shadow(0 0 4px var(--kkj-c)) drop-shadow(0 0 16px color-mix(in srgb,var(--kkj-c) 55%,transparent))}
[data-skin="ink"] .kkj-glow{filter:none}
.kkj-mask{position:absolute;inset:0;background:var(--kkj-c);-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center}
.kkj-today{position:absolute;inset:9%;width:82%;height:82%;overflow:visible;fill:none;stroke:var(--kkj-c);stroke-width:4.4;stroke-linecap:round;stroke-linejoin:round}
.kkj-stroke{stroke-dasharray:1;stroke-dashoffset:1}
.kkj-on .kkj-stroke{animation:kkj-draw .55s ease-out forwards}
@keyframes kkj-draw{to{stroke-dashoffset:0}}
.kkj-fallback{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:min(52vw,300px);line-height:1;color:var(--kkj-c)}
.kkj-caption{margin:0;min-height:2.7em;font-style:italic;font-size:20px;line-height:1.35;color:var(--ink,#EDEAE2)}
.kkj-credit{margin:0;font-size:12px;line-height:1.4;color:var(--ink-3,#8C877D)}
.kkj-credit a{color:inherit;text-decoration:underline;text-underline-offset:2px}
.kkj-credit a:hover{color:var(--ink,#EDEAE2)}
.kkj-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.kkj-tabs::-webkit-scrollbar{display:none}
.kkj-tab{flex:1 0 auto;min-width:64px;min-height:44px;padding:10px 8px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;background:transparent;color:var(--ink-3,#8C877D);border:0;border-top:2px solid var(--line,rgba(237,234,226,.12));font:inherit;cursor:pointer;text-align:center}
.kkj-tab b{font-size:20px;font-weight:800;line-height:1}
.kkj-tab:hover{color:var(--ink,#EDEAE2)}
.kkj-tab[aria-selected="true"]{color:var(--ink,#EDEAE2);border-top-color:var(--kkj-c)}
.kkj-tab[aria-selected="true"] b{color:var(--kkj-c)}
.kkj-en{font-size:13px}
.kkj-when{font-size:11px;color:var(--ink-3,#8C877D)}
@media (max-width:480px){.kkj-when{display:none}.kkj-caption{font-size:18px}}
@media (prefers-reduced-motion:reduce){.kkj-layer{transition:none}.kkj-on .kkj-stroke{animation:none;stroke-dashoffset:0}.kkj-play{transition:none}}
`;

/**
 * Plays a character's journey: its sourced ancient forms (oracle bone, bronze,
 * seal; only those with data) and today's form drawn stroke by stroke from
 * KanjiVG. Tabs pick a stage; Play steps through them.
 */
export function JourneyPlayer({
    char,
    stages,
    todayStrokes,
    captions,
    accent,
    title,
    emptyNote = DEFAULT_EMPTY_NOTE,
    analytics = true,
    analyticsId,
    className,
}: JourneyPlayerProps) {
    const tabs = useMemo(() => journeyTabs(char, stages, captions), [char, stages, captions]);
    const last = tabs.length - 1;
    const [index, setIndex] = useState(last);
    const [playing, setPlaying] = useState(false);
    // Bumped to replay the stroke animation when today is already showing.
    const [drawKey, setDrawKey] = useState(0);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
    const uid = useId();

    const active = Math.min(index, last);
    const current = tabs[active];
    const ancientCount = tabs.length - 1;

    const goTo = useCallback(
        (i: number) => {
            setIndex(i);
            if (i === last) setDrawKey((k) => k + 1);
        },
        [last],
    );

    useEffect(() => {
        if (!playing || active >= last) return;
        const timer = setTimeout(() => {
            goTo(active + 1);
            if (active + 1 >= last) setPlaying(false);
        }, STEP_MS);
        return () => clearTimeout(timer);
    }, [playing, active, last, goTo]);

    const play = () => {
        if (playing) {
            setPlaying(false);
            return;
        }
        if (analytics) trackEvent("journey_played", { radical: analyticsId ?? char, stages: tabs.length });
        // From an ancient stage (paused or picked), carry on from there;
        // from today, start again at the oldest form.
        if (active === last) goTo(0);
        setPlaying(ancientCount > 0);
    };

    const pick = (i: number) => {
        setPlaying(false);
        goTo(i);
    };

    const onTabKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
        const next =
            e.key === "ArrowRight" ? (i + 1) % tabs.length
            : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length
            : e.key === "Home" ? 0
            : e.key === "End" ? last
            : null;
        if (next === null) return;
        e.preventDefault();
        pick(next);
        tabRefs.current[next]?.focus();
    };

    const delayStep = todayStrokes.length ? Math.min(0.5, 4.5 / todayStrokes.length) : 0;
    const playLabel = playing ? "Pause" : ancientCount ? "Play the journey" : "Replay the strokes";
    const rootStyle = accent ? ({ "--kkj-c": accent } as CSSProperties) : undefined;

    return (
        <div className={className ? `kkj ${className}` : "kkj"} style={rootStyle}>
            <style href="kk-journey-player" precedence="medium">
                {CSS}
            </style>
            <div className="kkj-top">
                <div>{title}</div>
                <button type="button" className="kkj-play" onClick={play} aria-pressed={playing}>
                    <span aria-hidden="true">{playing ? "❚❚" : "▶"}</span> {playLabel}
                </button>
            </div>

            <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-tab-${current.id}`}>
                <div
                    className="kkj-stagebox"
                    role="img"
                    aria-label={`${char} as ${current.id === "today" ? "written today" : `${current.en.toLowerCase()} script`}: ${current.caption}`}
                >
                    <span className="kkj-ring" aria-hidden="true" />
                    <span className="kkj-ring2" aria-hidden="true" />
                    {tabs.map((tab, i) => (
                        <div key={tab.id} className={i === active ? "kkj-layer kkj-on" : "kkj-layer"} aria-hidden="true">
                            {tab.src ? (
                                <div className="kkj-glyph kkj-glow">
                                    <span
                                        className="kkj-mask"
                                        style={{ WebkitMaskImage: `url("${tab.src}")`, maskImage: `url("${tab.src}")` }}
                                    />
                                </div>
                            ) : todayStrokes.length ? (
                                <svg key={drawKey} className="kkj-today kkj-glow" viewBox="0 0 109 109" focusable="false">
                                    {todayStrokes.map((d, s) => (
                                        <path
                                            key={s}
                                            className="kkj-stroke"
                                            d={d}
                                            pathLength={1}
                                            style={{ animationDelay: `${(0.1 + s * delayStep).toFixed(2)}s` }}
                                        />
                                    ))}
                                </svg>
                            ) : (
                                <span className="kkj-fallback kkj-glow font-jp" lang="ja">
                                    {char}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
                <p className="kkj-caption font-disp" aria-live="polite">
                    {current.caption}
                </p>
                <p className="kkj-credit">
                    {current.credit.href ? (
                        <a href={current.credit.href} target="_blank" rel="noopener noreferrer">
                            {current.credit.text}
                        </a>
                    ) : (
                        current.credit.text
                    )}
                </p>
                {ancientCount === 0 && emptyNote ? <p className="kkj-credit">{emptyNote}</p> : null}
            </div>

            <div className="kkj-tabs" role="tablist" aria-label={`Stages of ${char}`}>
                {tabs.map((tab, i) => (
                    <button
                        key={tab.id}
                        ref={(el) => {
                            tabRefs.current[i] = el;
                        }}
                        type="button"
                        role="tab"
                        id={`${uid}-tab-${tab.id}`}
                        aria-selected={i === active}
                        aria-controls={`${uid}-panel`}
                        tabIndex={i === active ? 0 : -1}
                        className="kkj-tab"
                        onClick={() => pick(i)}
                        onKeyDown={(e) => onTabKey(e, i)}
                    >
                        <b className="font-jp" lang="ja">
                            {tab.jp}
                        </b>
                        <span className="kkj-en">{tab.en}</span>
                        <span className="kkj-when">{tab.when}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
