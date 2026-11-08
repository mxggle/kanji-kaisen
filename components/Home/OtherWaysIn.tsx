import Link from "next/link";
import type { ReactNode } from "react";
import { browsePath, radicalPath } from "@/lib/atlas/paths";
import type { JlptLevel } from "@/lib/atlas/types";
import { Chip } from "@/components/ui/Chip";
import { RadicalSeal } from "@/components/ui/RadicalSeal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { HomeSeal } from "./data";
import styles from "./home.module.css";

interface OtherWaysInProps {
    jlpt: { level: JlptLevel; count: number }[];
    seals: HomeSeal[];
    /** All radicals, for the index link. */
    radicalCount: number;
    strokes: readonly { label: string; min: number; max: number }[];
    className?: string;
}

function Way({ title, children, note }: { title: string; children: ReactNode; note: ReactNode }) {
    return (
        <div className="flex min-w-0 flex-col gap-3.5 rounded-2xl border border-line bg-card px-[22px] py-5">
            <h3 className="text-[17px] font-bold leading-[1.35]">{title}</h3>
            {children}
            {note}
        </div>
    );
}

/**
 * Home: JLPT levels, common radicals and stroke counts as ways into Browse and
 * the atlas. The cards rise in as they scroll into view, then their seals are
 * pressed and their chips settle (home.module.css). Each seal flies to its
 * radical page (the page mounts <MorphLanding /> for the way back). Server-safe.
 */
export function OtherWaysIn({ jlpt, seals, radicalCount, strokes, className }: OtherWaysInProps) {
    return (
        <section aria-labelledby="ways-title" className={className}>
            <SectionHeader id="ways-title" jp="索引" title="Other ways in" data-reveal="rise" />
            <div data-reveal-group="rise" className={`${styles.ways} mt-[22px] grid grid-cols-[repeat(auto-fit,minmax(min(340px,100%),1fr))] gap-5`}>
                <Way title="By JLPT level" note={<p className="text-xs text-ink-3">Levels follow the community lists most learners use.</p>}>
                    <div className={`${styles.chips} flex flex-wrap items-center gap-2`}>
                        {jlpt.map(({ level, count }) => (
                            <Chip key={level} href={browsePath({ jlpt: level })} count={count.toLocaleString("en")}>
                                {level}
                            </Chip>
                        ))}
                    </div>
                </Way>
                <Way
                    title="By radical"
                    note={
                        <Link href="/radicals" className="self-start text-sm text-ink-2 transition-colors hover:text-ink">
                            All {radicalCount} radicals <span aria-hidden>→</span>
                        </Link>
                    }
                >
                    <div className={`${styles.seals} flex flex-wrap gap-2`}>
                        {seals.map((s) => (
                            <RadicalSeal
                                key={s.key}
                                char={s.char}
                                size="md"
                                chars={s.chars}
                                category={s.category}
                                href={radicalPath(s.key)}
                                label={`${s.char} ${s.name}, ${s.count} kanji`}
                                morph={s.key}
                            />
                        ))}
                    </div>
                </Way>
                <Way title="By stroke count" note={<p className="text-xs text-ink-3">For when you can count the strokes but can&apos;t read it yet.</p>}>
                    <div className={`${styles.chips} flex flex-wrap items-center gap-2`}>
                        {strokes.map((band) => (
                            <Chip key={band.label} href={`/browse?min=${band.min}&max=${band.max}&sort=strokes`} aria-label={`${band.label} strokes`}>
                                {band.label}
                            </Chip>
                        ))}
                    </div>
                </Way>
            </div>
        </section>
    );
}
