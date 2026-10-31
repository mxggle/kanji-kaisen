import Link from "next/link";
import { kanjiPath, radicalPath } from "@/lib/atlas/paths";
import type { AtlasRadicalSummary } from "@/lib/atlas/types";
import type { ThemeGroup } from "./data";

interface ThemeKanjiIndexProps {
    name: string;
    kanjiCount: number;
    groups: ThemeGroup[];
    sideForms: Map<string, AtlasRadicalSummary[]>;
    otherSideForms: AtlasRadicalSummary[];
}

const SideFormLink = ({ radical }: { radical: AtlasRadicalSummary }) => (
    <Link href={radicalPath(radical.key)} className="text-ink-2 underline underline-offset-4 decoration-line-2 hover:text-ink">
        <span lang="ja">{radical.char}</span> {radical.name}
    </Link>
);

/**
 * Every radical and kanji of a theme as plain links, in the suggested order.
 * Server-rendered, so crawlers and no-JS readers get the whole theme; the
 * selection panel above is the enhanced view of the same data.
 */
export function ThemeKanjiIndex({ name, kanjiCount, groups, sideForms, otherSideForms }: ThemeKanjiIndexProps) {
    return (
        <section id="kanji" aria-labelledby="all-kanji" className="scroll-mt-24">
            <h2 id="all-kanji" className="font-disp text-3xl font-bold lg:text-4xl">All {kanjiCount} kanji by radical</h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-2">
                Every {name} radical with its kanji, in the same order as above: the radicals with the most kanji first,
                and each radical&apos;s kanji from most to least common.
            </p>
            <ol className="mt-8 space-y-9">
                {groups.map(({ radical, kanji }) => {
                    const forms = sideForms.get(radical.key) ?? [];
                    return (
                        <li key={radical.key} id={`radical-${radical.key}`} className="scroll-mt-24 border-t border-line pt-5">
                            <h3 className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <Link href={radicalPath(radical.key)} className="group inline-flex items-baseline gap-2.5 hover:text-c">
                                    <span lang="ja" className="font-jp text-3xl font-extrabold leading-none">{radical.char}</span>
                                    <span className="font-disp text-2xl font-bold group-hover:underline group-hover:underline-offset-4">{radical.name}</span>
                                </Link>
                                <span className="text-sm font-normal text-ink-3">{radical.meaning} · {kanji.length} kanji</span>
                            </h3>
                            {forms.length > 0 && (
                                <p className="mt-1.5 text-sm text-ink-3">
                                    Side form{forms.length > 1 ? "s" : ""}:{" "}
                                    {forms.map((form, i) => (
                                        <span key={form.key}>
                                            {i > 0 && ", "}
                                            <SideFormLink radical={form} />
                                        </span>
                                    ))}
                                </p>
                            )}
                            <ul className="mt-3.5 grid grid-cols-[repeat(auto-fill,minmax(60px,1fr))] gap-1.5 sm:grid-cols-[repeat(auto-fill,minmax(68px,1fr))]">
                                {kanji.map((k) => (
                                    <li key={k.char}>
                                        <Link
                                            href={kanjiPath(k.char)}
                                            prefetch={false}
                                            title={`${k.char} – ${k.meanings.slice(0, 3).join(", ")}`}
                                            className="flex flex-col items-center rounded-lg border border-line bg-card px-1 pt-2 pb-1.5 transition-colors hover:border-c focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                                        >
                                            <span lang="ja" className="font-jp text-2xl font-extrabold leading-none">{k.char}</span>
                                            <span className="mt-1 w-full truncate text-center text-[11px] text-ink-3">{k.meanings[0]}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </li>
                    );
                })}
            </ol>
            {otherSideForms.length > 0 && (
                <p className="mt-8 border-t border-line pt-5 text-sm text-ink-3">
                    Also filed under {name}:{" "}
                    {otherSideForms.map((form, i) => (
                        <span key={form.key}>
                            {i > 0 && ", "}
                            <SideFormLink radical={form} />
                        </span>
                    ))}
                </p>
            )}
        </section>
    );
}
