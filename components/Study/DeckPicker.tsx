"use client";

import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useInkHydrated, useInkStore } from "@/lib/ink-store";
import { useStudyStore, useStudyStoreHydrated } from "@/lib/study-store";
import { countByStatus } from "@/lib/study-list";
import { isCategoryName, THEME_SHORT } from "@/lib/atlas/categories";
import { Chip } from "@/components/ui/Chip";
import { KindLabel, SectionHeader } from "@/components/ui/SectionHeader";
import type { PickerData } from "./StudyClient";
import { revisitChars } from "./my-list";
import { studyPath, type DeckRequest, type StudyMode } from "./session";

const CARD = "flex min-w-0 flex-col gap-1 rounded-2xl border border-line bg-card px-5 py-4 transition-colors";

/** /study without a deck: your list, a JLPT level or a theme. */
export function DeckPicker({ picker, mode, heading = true }: { picker: PickerData; mode: StudyMode | null; heading?: boolean }) {
    const listReady = useStudyStoreHydrated();
    const inkReady = useInkHydrated();
    const entries = useStudyStore((s) => s.entries);
    const ink = useInkStore((s) => s.entries);
    const counts = countByStatus(entries);
    const revisit = useMemo(() => (inkReady ? revisitChars(ink) : []), [ink, inkReady]);
    const href = (request: DeckRequest) => studyPath(request, mode);

    return (
        <div className="flex flex-col gap-12">
            {heading && (
                <header className="flex flex-col gap-3">
                    <KindLabel jp="学習">Study</KindLabel>
                    <h1 className="type-title">Pick a deck</h1>
                    <p className="max-w-[60ch] text-base leading-relaxed text-ink-2">
                        Then flashcards or a meaning quiz. Nothing is scored against you; stop whenever you like.
                    </p>
                </header>
            )}

            <section className="flex flex-col gap-4">
                <SectionHeader jp="保存" title="Your list" aside={<Link href="/my-list" className="hover:text-ink">Open My list</Link>} />
                <div className="grid gap-3 sm:grid-cols-2">
                    <DeckCard
                        href={href({ kind: "list" })}
                        title="Saved"
                        meta={listReady ? `${counts.all} kanji` : "…"}
                        disabled={listReady && counts.all === 0}
                        empty="Save kanji from their pages to study them here"
                    />
                    <DeckCard
                        href={href({ kind: "revisit", chars: revisit })}
                        title="Worth a revisit"
                        meta={inkReady ? `${revisit.length} kanji you've met but not practised lately` : "…"}
                        disabled={inkReady && revisit.length === 0}
                        empty="Kanji you've met show up here, oldest first"
                    />
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <SectionHeader jp="級" title="JLPT level" />
                <div className="flex flex-wrap gap-2">
                    {picker.jlpt.map(({ level, count }) => (
                        <Chip key={level} href={href({ kind: "jlpt", level })} count={count}>
                            {level}
                        </Chip>
                    ))}
                </div>
            </section>

            <section className="flex flex-col gap-4">
                <SectionHeader jp="主題" title="Themes" />
                <div className="flex flex-wrap gap-2">
                    {picker.themes.map((t) => (
                        <Chip key={t.slug} href={href({ kind: "theme", slug: t.slug })} count={t.count} theme={t.name}>
                            {isCategoryName(t.name) ? THEME_SHORT[t.name] : t.name}
                        </Chip>
                    ))}
                </div>
            </section>

            <p className="text-sm text-ink-2">
                Every{" "}
                <Link href="/radicals" className="text-ink underline underline-offset-[3px] hover:text-ink-2">
                    radical
                </Link>{" "}
                and{" "}
                <Link href="/categories" className="text-ink underline underline-offset-[3px] hover:text-ink-2">
                    theme
                </Link>{" "}
                page also has a “Study these” link for its kanji.
            </p>
        </div>
    );
}

function DeckCard({ href, title, meta, disabled, empty }: { href: string; title: string; meta: string; disabled?: boolean; empty: string }) {
    if (disabled) {
        return (
            <div className={cn(CARD, "border-dashed border-line-2 bg-transparent")} aria-disabled="true">
                <span className="text-[17px] font-bold text-ink-2">{title}</span>
                <span className="text-sm text-ink-3">{empty}</span>
            </div>
        );
    }
    return (
        <Link href={href} className={cn(CARD, "hover:border-ink-3")}>
            <span className="text-[17px] font-bold">{title}</span>
            <span className="text-sm text-ink-3">{meta}</span>
        </Link>
    );
}
