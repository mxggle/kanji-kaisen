"use client";

import { Fragment, useEffect, useRef, useState, type AnimationEvent, type CSSProperties } from "react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/Button";
import { buildCaptionText, buildClauses, partLine, type PartLine } from "./parts";
import type { BuildView } from "./types";
import styles from "./kanji.module.css";

// Rule 2 on the strokes: meaning solid in the accent, sound dashed in the
// accent, form-only in ink-2. Loose strokes (no part claims them) stay ink-2.
const LINE: Record<PartLine, { className: string; dash?: string }> = {
    meaning: { className: "stroke-c" },
    sound: { className: "stroke-c [stroke-linecap:butt]", dash: "7 3.5" },
    form: { className: "stroke-ink-2" },
};

const APPEAR_MS = 380;
const HOLD_MS = 650;
// First arrival on the page: the parts slide together in stroke order (CSS, kanji.module.css).
const ARRIVE_AT = 160;
const ARRIVE_STEP = 110;

type Phase = "rest" | "apart";

/**
 * "How it was built": the KanjiVG parts drawn by role. Replay pulls the parts
 * apart, shows them one by one and slides them together. Captions state the
 * structure only; sourced etymology has its own card. Fires `build_played`.
 */
export function BuildPlayer({ build, className }: { build: BuildView; className?: string }) {
    const [phase, setPhase] = useState<Phase>("rest");
    const [run, setRun] = useState(0);
    // Until the first arrival has played (it waits while the tab is hidden), and never after a replay.
    const [arrived, setArrived] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);

    const play = () => {
        if (timer.current) clearTimeout(timer.current);
        trackEvent("build_played", { kanji: build.char });
        setPhase("apart");
        setRun((r) => r + 1);
        timer.current = setTimeout(() => setPhase("rest"), APPEAR_MS * build.parts.length + HOLD_MS);
    };

    const apart = phase === "apart";
    const clauses = buildClauses(build.parts);
    const arriving = run === 0 && !arrived;
    const lastArrive = `${ARRIVE_AT + Math.max(0, build.parts.length - 1) * ARRIVE_STEP}ms`;
    const onArrived = (e: AnimationEvent<SVGSVGElement>) => {
        if (e.target === e.currentTarget.lastElementChild && e.animationName.includes("part-arrive")) setArrived(true);
    };

    return (
        <div className={cn("flex flex-col gap-3.5", className)}>
            <div role="img" aria-label={`${build.char}: ${buildCaptionText(build.parts)}`} className="relative aspect-square w-full rounded-xl bg-bg">
                <svg
                    key={run}
                    viewBox="0 0 109 109"
                    aria-hidden
                    className="absolute inset-[6%] size-[88%] overflow-visible fill-none [stroke-linecap:round] [stroke-linejoin:round]"
                    strokeWidth={4.2}
                    onAnimationEnd={arriving ? onArrived : undefined}
                >
                    {build.parts.map((part, p) => {
                        const line = LINE[partLine(part.role)];
                        const offset = build.offsets[p] ?? { x: 0, y: 0 };
                        return (
                            <g
                                key={p}
                                className={cn(!apart && styles.move, apart && styles.appear, arriving && styles.arrive)}
                                style={
                                    {
                                        transform: apart ? `translate(${offset.x}px, ${offset.y}px) scale(.88)` : "none",
                                        "--delay": `${p * APPEAR_MS}ms`,
                                        "--ax": offset.x,
                                        "--ay": offset.y,
                                        "--arrive-delay": `${ARRIVE_AT + p * ARRIVE_STEP}ms`,
                                    } as CSSProperties
                                }
                            >
                                {part.strokes.map((i) =>
                                    build.owners[i] === p && build.paths[i] ? (
                                        <path key={i} d={build.paths[i]} className={line.className} strokeDasharray={line.dash} />
                                    ) : null,
                                )}
                            </g>
                        );
                    })}
                    <g className={cn(!apart && styles.move, arriving && styles.arrive)} style={{ opacity: apart ? 0.35 : 1, "--arrive-delay": lastArrive } as CSSProperties}>
                        {build.paths.map((d, i) => (build.owners[i] === null ? <path key={i} d={d} className="stroke-ink-2" /> : null))}
                    </g>
                </svg>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-2">
                    {clauses.map((clause, i) => (
                        <Fragment key={clause.line + i}>
                            {i > 0 && " · "}
                            {clause.chars.map((char, k) => (
                                <Fragment key={char}>
                                    {k > 0 && (k === clause.chars.length - 1 ? " and " : ", ")}
                                    <span lang="ja" className={cn("font-jp font-extrabold", clause.line === "meaning" ? "text-c" : "text-ink")}>
                                        {char}
                                    </span>
                                </Fragment>
                            ))}{" "}
                            {clause.text}
                        </Fragment>
                    ))}
                </p>
                <Button size="sm" onClick={play} className={styles.press}>
                    <Play aria-hidden />
                    How it was built
                </Button>
            </div>
        </div>
    );
}
