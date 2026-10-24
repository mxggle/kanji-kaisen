"use client";

import Link from "next/link";
import { useStudyStore, useStudyStoreHydrated } from "@/lib/study-store";
import { countByStatus } from "@/lib/study-list";
import { jlptColor } from "@/components/Atlas/JlptBadge";
import { cn } from "@/lib/utils";
import type { PickerData } from "./StudyClient";
import { studyPath, type DeckRequest, type StudyMode } from "./session";

const CARD = "flex flex-col justify-between gap-1 rounded-xl border border-white/10 bg-white/5 p-4 hover:border-[var(--accent)] hover:bg-white/10 transition-colors";

export function DeckPicker({ picker, mode }: { picker: PickerData; mode: StudyMode | null }) {
    const hydrated = useStudyStoreHydrated();
    const entries = useStudyStore((s) => s.entries);
    const counts = countByStatus(entries);
    const href = (request: DeckRequest) => studyPath(request, mode);
    const listCount = (n: number) => (hydrated ? `${n} kanji` : "…");

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Study</h1>
            <p className="text-white/60 text-sm mb-6">
                Pick a deck, then choose flashcards or a meaning quiz. No scores to lose — stop whenever you like.
            </p>

            <h2 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">My list</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                <DeckCard href={href({ kind: "list" })} title="All saved kanji" meta={listCount(counts.all)} disabled={hydrated && counts.all === 0} />
                <DeckCard href={href({ kind: "learning" })} title="Still learning" meta={listCount(counts.learning)} disabled={hydrated && counts.learning === 0} />
            </div>

            <h2 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">JLPT level</h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
                {picker.jlpt.map(({ level, count }) => (
                    <Link key={level} href={href({ kind: "jlpt", level })} className={cn(CARD, "border-b-4")} style={{ borderBottomColor: jlptColor(level) }}>
                        <span className="text-lg font-bold">{level}</span>
                        <span className="text-xs text-white/50">{count} kanji</span>
                    </Link>
                ))}
            </div>

            <h2 className="text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Themes</h2>
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                {picker.themes.map((t) => (
                    <DeckCard key={t.slug} href={href({ kind: "theme", slug: t.slug })} title={t.name} meta={`${t.count} kanji`} />
                ))}
            </div>

            <p className="text-sm text-white/50">
                Every <Link href="/radicals" className="text-[var(--accent)] hover:underline">radical</Link> and{" "}
                <Link href="/categories" className="text-[var(--accent)] hover:underline">theme</Link> page also has a “Study these” link for its kanji.
            </p>
        </div>
    );
}

function DeckCard({ href, title, meta, disabled }: { href: string; title: string; meta: string; disabled?: boolean }) {
    if (disabled) {
        return (
            <div className={cn(CARD, "opacity-50 pointer-events-none")} aria-disabled="true">
                <span className="font-medium">{title}</span>
                <span className="text-xs text-white/50">{meta} · save kanji to study them here</span>
            </div>
        );
    }
    return (
        <Link href={href} className={CARD}>
            <span className="font-medium">{title}</span>
            <span className="text-xs text-white/50">{meta}</span>
        </Link>
    );
}
