"use client";

import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { radicalPath } from "@/lib/atlas/paths";
import { sealState, SEAL_LABELS } from "@/components/Theme/order";
import { FOCUS_RING, sealClass } from "@/components/Theme/parts";
import { shadeReader, useInkEntries } from "@/components/Theme/useInk";
import styles from "@/components/Theme/theme.module.css";

export interface SealRadical {
    key: string;
    char: string;
    name: string;
    meaning: string;
    /** Its kanji, most common first, concatenated (a side form gets its base's). */
    chars: string;
    /** Sourced ancient stages (0–3). */
    ancient: number;
    /** For story-only side forms: "木 Ki". */
    sideOf?: string;
}

/**
 * One theme's radicals as seals linking to their journey pages. Seals fill
 * with ink once the store hydrates (blank on the server, like the home and
 * theme pages); 古 marks radicals with sourced ancient forms.
 */
export function RadicalSealGrid({ radicals }: { radicals: SealRadical[] }) {
    const entries = useInkEntries();
    const lists = useMemo(() => radicals.map((r) => Array.from(r.chars)), [radicals]);
    const shadeOf = useMemo(() => (entries ? shadeReader(entries) : null), [entries]);

    return (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-x-2 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(96px,1fr))]">
            {radicals.map((r, i) => {
                const state = shadeOf ? sealState(lists[i], shadeOf) : null;
                const detail = r.sideOf ? `side form of ${r.sideOf}` : `${lists[i].length} kanji`;
                return (
                    <li key={r.key}>
                        <Link
                            href={radicalPath(r.key)}
                            title={r.meaning}
                            aria-label={`${r.char} ${r.name}, ${r.meaning}, ${detail}${r.ancient ? ", with ancient forms" : ""}${state ? `, ${SEAL_LABELS[state]}` : ""}`}
                            className={cn("group flex flex-col items-center gap-1.5 rounded-xl px-1 text-center", FOCUS_RING)}
                        >
                            <span className="relative">
                                <span className={sealClass(state, cn("size-14 text-[26px] sm:size-16 sm:text-[29px]", styles.pressable, r.sideOf && "border-dashed!"))}>
                                    <span lang="ja" aria-hidden>{r.char}</span>
                                </span>
                                {r.ancient > 0 && (
                                    <span
                                        aria-hidden
                                        className="absolute -right-1.5 -top-1 flex size-5 items-center justify-center rounded-full border border-c/60 bg-bg font-jp text-[11px] font-bold leading-none text-c"
                                    >
                                        古
                                    </span>
                                )}
                            </span>
                            <span aria-hidden className="w-full truncate text-xs text-ink group-hover:text-c">{r.name}</span>
                            <span aria-hidden className="-mt-1 w-full truncate text-[11px] text-ink-3">{r.sideOf ? "side form" : detail}</span>
                        </Link>
                    </li>
                );
            })}
        </ul>
    );
}
