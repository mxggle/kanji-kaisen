import type { Metadata } from "next";
import { getAllKanji, getKanjiByJlpt, JLPT_LEVELS } from "@/lib/atlas";
import { CATEGORIES } from "@/lib/atlas/categories";
import { PageShell } from "@/components/Atlas/PageShell";
import { InkPaint } from "@/components/Ink/InkPaint";
import { MyList } from "@/components/Study/MyList";
import type { AtlasIndex } from "@/components/Study/my-list";

export const metadata: Metadata = {
    title: "My list",
    description: "Your saved kanji and your ink: how dark each kanji is, and what you can study next.",
    robots: { index: false, follow: true },
};

/** Every theme's and JLPT level's kanji as one string each (about 14 KB): the rail and decks need nothing more. */
function atlasIndex(): AtlasIndex {
    const all = getAllKanji();
    return {
        total: all.length,
        themes: CATEGORIES.map((name) => ({
            name,
            chars: all
                .filter((k) => k.category === name)
                .map((k) => k.char)
                .join(""),
        })),
        jlpt: JLPT_LEVELS.map((level) => ({
            level,
            chars: getKanjiByJlpt(level)
                .map((k) => k.char)
                .join(""),
        })),
    };
}

export default function MyListPage() {
    return (
        <PageShell>
            <InkPaint>
                <MyList atlas={atlasIndex()} />
            </InkPaint>
        </PageShell>
    );
}
