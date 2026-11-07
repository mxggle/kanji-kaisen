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
import { SessionSkeleton, STUDY_COLUMN } from "./ui";
import { enterOrder } from "@/components/Motion/tokens";
import type { DeckRequest, StudyMode } from "./session";

export interface ServerDeck {
    source: DeckSource;
    title: string;
    chars: string[];
    backHref: string;
    backLabel: string;
    /** A theme deck's theme, for its colour. */
    category?: string | null;
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
            <div className={STUDY_COLUMN}>
                {notFound && (
                    <div role="alert" className="mb-10 flex flex-col gap-1 rounded-2xl border border-line bg-card px-[22px] py-5 text-sm text-ink-2" data-enter="fade">
                        <p className="text-base text-ink">Deck not found.</p>
                        <p>That link doesn&apos;t match a radical, theme, JLPT level or kanji set. Pick a deck below instead.</p>
                    </div>
                )}
                <DeckPicker picker={picker} mode={initialMode} />
            </div>
        );
    }

    if (request.kind === "list" || request.kind === "learning") {
        return <ListDeck kind={request.kind} initialMode={initialMode} categoryOf={categoryOf} picker={picker} />;
    }

    if (!serverDeck || serverDeck.chars.length === 0) {
        return (
            <div className={STUDY_COLUMN}>
                <EmptyDeck title={serverDeck?.title ?? "This deck"} message="This deck has no kanji yet." />
                <DeckPicker picker={picker} mode={initialMode} heading={false} />
            </div>
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
            category={serverDeck.category}
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
    if (!hydrated) {
        return (
            <div className={STUDY_COLUMN}>
                <SessionSkeleton />
            </div>
        );
    }
    return <ListDeckSnapshot {...props} />;
}

/** Takes a snapshot of the saved list on mount, so marking cards doesn't reshuffle the deck mid-session. */
function ListDeckSnapshot({ kind, initialMode, categoryOf, picker }: ListDeckProps) {
    const [chars] = useState(() => listSaved(useStudyStore.getState().entries, kind === "learning" ? "learning" : undefined));
    const title = kind === "learning" ? "Still learning" : "My list";

    if (chars.length === 0) {
        return (
            <div className={STUDY_COLUMN}>
                <EmptyDeck
                    title={title}
                    message={kind === "learning" ? "No saved kanji are marked “still learning”." : "You haven't saved any kanji yet."}
                />
                <DeckPicker picker={picker} mode={initialMode} heading={false} />
            </div>
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
        <header className="mb-12 flex flex-col gap-3">
            <h1 className="type-title" data-enter="ink">
                {title}
            </h1>
            <p className="text-base leading-relaxed text-ink-2" data-enter="" style={enterOrder(1)}>
                {message}{" "}
                <Link href={browsePath({ jlpt: "N5" })} className="text-ink underline underline-offset-[3px] hover:text-ink-2">
                    Browse N5 kanji
                </Link>{" "}
                and save a few, or pick another deck below.
            </p>
        </header>
    );
}
