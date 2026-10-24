import type { Metadata } from "next";
import { getAllKanji, getCategories, getCategory, getKanjiByJlpt, getRadical, JLPT_LEVELS } from "@/lib/atlas";
import { CATEGORIES } from "@/lib/atlas/categories";
import { browsePath, categoryPath, radicalPath } from "@/lib/atlas/paths";
import { PageShell, Breadcrumbs } from "@/components/Atlas/PageShell";
import { StudyClient, type PickerData, type ServerDeck } from "@/components/Study/StudyClient";
import { parseStudyParams, studyPath, type DeckRequest, type StudyParams } from "@/components/Study/session";

export const metadata: Metadata = {
    title: "Study",
    description: "Flashcards and a meaning quiz over your saved kanji, a JLPT level, a radical or a theme.",
    robots: { index: false, follow: true },
};

interface StudyPageProps {
    searchParams: Promise<StudyParams>;
}

/** Resolves radical, theme and JLPT decks from the atlas; list decks are resolved on the client. */
function resolveServerDeck(request: DeckRequest): ServerDeck | null {
    switch (request.kind) {
        case "jlpt":
            return {
                source: "jlpt",
                title: `JLPT ${request.level} kanji`,
                chars: getKanjiByJlpt(request.level).map((k) => k.char),
                backHref: browsePath({ jlpt: request.level }),
                backLabel: `Browse ${request.level}`,
            };
        case "radical": {
            const radical = getRadical(request.key);
            if (!radical) return null;
            return {
                source: "radical",
                title: `${radical.char} ${radical.name} radical`,
                chars: radical.kanji.map((k) => k.char),
                backHref: radicalPath(radical.key),
                backLabel: `Back to ${radical.char} ${radical.name}`,
            };
        }
        case "theme": {
            const category = getCategory(request.slug);
            if (!category) return null;
            return {
                source: "theme",
                title: `${category.name} theme`,
                chars: category.kanji.map((k) => k.char),
                backHref: categoryPath(category.name),
                backLabel: `Back to ${category.name}`,
            };
        }
        default:
            return null;
    }
}

export default async function StudyPage({ searchParams }: StudyPageProps) {
    const { request, invalid, mode } = parseStudyParams(await searchParams);
    const isListDeck = request?.kind === "list" || request?.kind === "learning";
    const serverDeck = request && !isListDeck ? resolveServerDeck(request) : null;
    const notFound = invalid || (request !== null && !isListDeck && serverDeck === null);

    // Theme of every kanji as an index into CATEGORIES (~16 KB), so quiz
    // distractors can prefer kanji from the same theme.
    const categoryCodes: Record<string, number> | null =
        isListDeck || serverDeck
            ? Object.fromEntries(
                  getAllKanji()
                      .filter((k) => k.category)
                      .map((k) => [k.char, CATEGORIES.indexOf(k.category as (typeof CATEGORIES)[number])]),
              )
            : null;

    const picker: PickerData = {
        jlpt: JLPT_LEVELS.map((level) => ({ level, count: getKanjiByJlpt(level).length })),
        themes: getCategories().map((c) => ({ slug: c.slug, name: c.name, count: c.kanjiCount })),
    };

    const key = studyPath(request, mode);

    return (
        <PageShell>
            <Breadcrumbs items={[{ href: "/", label: "Home" }, ...(request && !notFound ? [{ href: "/study", label: "Study" }, { label: serverDeck?.title ?? (request.kind === "learning" ? "Still learning" : "My list") }] : [{ label: "Study" }])]} />
            {/* Keyed by the deck so navigating between decks resets the session. */}
            <StudyClient
                key={key}
                request={notFound ? null : request}
                notFound={notFound}
                serverDeck={serverDeck}
                initialMode={mode}
                categoryCodes={categoryCodes}
                picker={picker}
            />
        </PageShell>
    );
}
