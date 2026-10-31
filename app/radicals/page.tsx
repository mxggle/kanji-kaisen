import Link from "next/link";
import { getAllRadicals, getRadical } from "@/lib/atlas";
import { CATEGORIES, getCategorySlug, THEME_JP } from "@/lib/atlas/categories";
import { categoryPath } from "@/lib/atlas/paths";
import { Breadcrumbs } from "@/components/Atlas/PageShell";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { atlasMetadata } from "@/components/Atlas/metadata";
import { compareByFrequency } from "@/components/Theme/order";
import { FOCUS_RING } from "@/components/Theme/parts";
import { ancientStageCount } from "@/components/Journey/data";
import { RadicalSealGrid, type SealRadical } from "@/components/Journey/RadicalSealGrid";

export const dynamic = "force-static";

export function generateMetadata() {
    const radicals = getAllRadicals();
    return atlasMetadata({
        title: "Radicals",
        description: `All ${radicals.length} kanji radicals grouped into ${CATEGORIES.length} themes, each with its journey from ancient forms to today, its sourced origin, a memory story and every kanji that uses it.`,
        path: "/radicals",
    });
}

function sealRadical(key: string): SealRadical | null {
    const radical = getRadical(key);
    if (!radical) return null;
    const base = radical.variantOf;
    return {
        key: radical.key,
        char: radical.char,
        name: radical.name,
        meaning: radical.meaning,
        chars: [...radical.kanji].sort(compareByFrequency).map((k) => k.char).join(""),
        ancient: ancientStageCount(radical),
        ...(base ? { sideOf: `${base.char} ${base.name}` } : {}),
    };
}

export default function RadicalsPage() {
    const radicals = getAllRadicals();
    // Index order: theme, then most kanji first. Every radical has a theme
    // (lib/radical-category-map.json), so none are dropped here.
    const groups = CATEGORIES.map((category) => ({
        category,
        radicals: radicals
            .filter((r) => r.category === category)
            .map((r) => sealRadical(r.key))
            .filter((r): r is SealRadical => r !== null),
    })).filter((g) => g.radicals.length > 0);
    const withAncient = groups.reduce((n, g) => n + g.radicals.filter((r) => r.ancient > 0).length, 0);

    return (
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 text-ink lg:px-8">
            <Breadcrumbs items={[{ href: "/", label: "Learn" }, { label: "Radicals" }]} />

            <header className="mb-8 max-w-3xl">
                <p lang="ja" className="font-jp text-sm text-[var(--accent)] lg:text-base">部首</p>
                <h1 className="mt-1 font-disp text-4xl font-bold sm:text-5xl">Radicals</h1>
                <p className="mt-3 leading-relaxed text-ink-2">
                    Radicals are the building blocks of kanji. Learn what each one means and where it comes from, and you can
                    make an educated guess about thousands of characters. {radicals.length} radicals in {CATEGORIES.length} themes;
                    each opens its journey from the oldest sourced form to today, with every kanji that uses it.
                </p>
                <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-3">
                    <span className="inline-flex items-center gap-2">
                        <span
                            aria-hidden
                            className="flex size-5 items-center justify-center rounded-full border border-[var(--accent)] font-jp text-[11px] font-bold leading-none text-[var(--accent)]"
                        >
                            古
                        </span>
                        Sourced ancient forms ({withAncient} radicals)
                    </span>
                    <span>Seals fill with ink as you learn their kanji</span>
                </p>
            </header>

            <nav aria-label="Themes" className="mb-4 flex flex-wrap gap-2">
                {groups.map(({ category, radicals: list }) => (
                    <a
                        key={category}
                        href={`#${getCategorySlug(category)}`}
                        style={themeVars(category)}
                        className={`rounded-full border border-c/40 bg-c/5 px-3 py-1.5 text-sm text-c transition-colors hover:bg-c/15 ${FOCUS_RING}`}
                    >
                        {category} <span className="text-ink-3">{list.length}</span>
                    </a>
                ))}
            </nav>

            {groups.map(({ category, radicals: list }) => (
                <section
                    key={category}
                    id={getCategorySlug(category)}
                    aria-labelledby={`${getCategorySlug(category)}-title`}
                    style={themeVars(category)}
                    className="mt-12 scroll-mt-24 border-t border-line pt-6"
                >
                    <div className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                        <span lang="ja" className="font-jp text-sm text-c">{THEME_JP[category]}</span>
                        <h2 id={`${getCategorySlug(category)}-title`} className="glow font-disp text-[28px] font-bold leading-none text-c lg:text-[34px]">
                            {category}
                        </h2>
                        <span className="text-sm text-ink-3">{list.length} radicals</span>
                        <Link
                            href={categoryPath(category)}
                            className={`ml-auto text-sm text-ink-2 underline-offset-4 transition-colors hover:text-ink hover:underline ${FOCUS_RING}`}
                        >
                            Open the theme <span aria-hidden>→</span>
                        </Link>
                    </div>
                    <RadicalSealGrid radicals={list} />
                </section>
            ))}
        </div>
    );
}
