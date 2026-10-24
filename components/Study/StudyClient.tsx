"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { CATEGORIES } from "@/lib/atlas/categories";
import { browsePath } from "@/lib/atlas/paths";
import type { JlptLevel } from "@/lib/atlas/types";
import { useStudyStore, useStudyStoreHydrated } from "@/lib/study-store";
import { listSaved } from "@/lib/study-list";
import { DeckPicker } from "./DeckPicker";
import { StudySession, type DeckSource } from "./StudySession";
import { SessionSkeleton } from "./ui";
import type { DeckRequest, StudyMode } from "./session";

export interface ServerDeck {
    source: DeckSource;
    title: string;
    chars: string[];
    backHref: string;
    backLabel: string;
}

export interface PickerData {
    jlpt: { level: JlptLevel; count: number }[];
    themes: { slug: string; name: string; count: number }[];
}

interface StudyClientProps {
    request: DeckRequest | null;
    notFound: boolean;
    serverDeck: ServerDeck | null;
    initialMode: StudyMode | null;
    categoryCodes: Record<string, number> | null;
    picker: PickerData;
}

export function StudyClient({ request, notFound, serverDeck, initialMode, categoryCodes, picker }: StudyClientProps) {
    const categoryOf = useCallback(
        (char: string): string | null => {
            const code = categoryCodes?.[char];
            return code === undefined ? null : CATEGORIES[code] ?? null;
        },
        [categoryCodes],
    );

    if (notFound || !request) {
        return (
            <>
                {notFound && (
                    <div role="alert" className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
                        <p className="font-medium text-white">Deck not found.</p>
                        <p className="mt-1">That link doesn’t match a radical, theme or JLPT level. Pick a deck below instead.</p>
                    </div>
                )}
                <DeckPicker picker={picker} mode={initialMode} />
            </>
        );
    }

    if (request.kind === "list" || request.kind === "learning") {
        return <ListDeck kind={request.kind} initialMode={initialMode} categoryOf={categoryOf} picker={picker} />;
    }

    if (!serverDeck || serverDeck.chars.length === 0) {
        return (
            <>
                <EmptyDeck title={serverDeck?.title ?? "This deck"} message="This deck has no kanji yet." />
                <DeckPicker picker={picker} mode={initialMode} />
            </>
        );
    }

    return (
        <StudySession
            source={serverDeck.source}
            title={serverDeck.title}
            chars={serverDeck.chars}
            backHref={serverDeck.backHref}
            backLabel={serverDeck.backLabel}
            initialMode={initialMode}
            categoryOf={categoryOf}
        />
    );
}

interface ListDeckProps {
    kind: "list" | "learning";
    initialMode: StudyMode | null;
    categoryOf: (char: string) => string | null;
    picker: PickerData;
}

function ListDeck(props: ListDeckProps) {
    const hydrated = useStudyStoreHydrated();
    if (!hydrated) return <SessionSkeleton />;
    return <ListDeckSnapshot {...props} />;
}

/** Takes a snapshot of the saved list on mount, so marking cards doesn't reshuffle the deck mid-session. */
function ListDeckSnapshot({ kind, initialMode, categoryOf, picker }: ListDeckProps) {
    const [chars] = useState(() => listSaved(useStudyStore.getState().entries, kind === "learning" ? "learning" : undefined));
    const title = kind === "learning" ? "Still learning" : "My list";

    if (chars.length === 0) {
        return (
            <>
                <EmptyDeck
                    title={title}
                    message={kind === "learning" ? "No saved kanji are marked “still learning”." : "You haven’t saved any kanji yet."}
                />
                <DeckPicker picker={picker} mode={initialMode} />
            </>
        );
    }

    return (
        <StudySession
            source={kind}
            title={title}
            chars={chars}
            backHref="/my-list"
            backLabel="Back to My list"
            initialMode={initialMode}
            categoryOf={categoryOf}
        />
    );
}

function EmptyDeck({ title, message }: { title: string; message: string }) {
    return (
        <div className="mb-8 rounded-xl border border-white/10 bg-white/5 p-6 text-white/70">
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm">{message}</p>
            <p className="mt-2 text-sm">
                <Link href={browsePath({ jlpt: "N5" })} className="text-[var(--accent)] hover:underline">Browse N5 kanji</Link>{" "}
                and save a few, or pick another deck below.
            </p>
        </div>
    );
}
