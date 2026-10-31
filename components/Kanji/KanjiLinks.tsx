import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { kanjiPath } from "@/lib/atlas/paths";
import type { AlsoBuiltOn, KanjiLite, SameOnView, SoundFamilyView } from "./types";
import { partClass, partStyle } from "./PartChips";
import styles from "./kanji.module.css";

/** A small linked kanji: glyph, reading, meaning. */
function MiniTile({ k, highlight = false, current = false }: { k: KanjiLite; highlight?: boolean; current?: boolean }) {
    const body = (
        <>
            <span lang="ja" className={cn("font-jp text-[26px] font-extrabold leading-none", highlight ? styles.hit : "text-ink")}>
                {k.char}
            </span>
            {k.reading && (
                <span lang="ja" className="text-[11px] leading-tight text-ink-3">
                    {k.reading}
                </span>
            )}
            <span className="w-full truncate text-center text-[11px] leading-tight text-ink-2">{k.meaning}</span>
        </>
    );
    const base = "flex w-[68px] flex-col items-center gap-1 rounded-lg border px-1 py-2";
    if (current) {
        return (
            <span aria-current="page" className={cn(base, "border-[var(--c)] bg-card")}>
                {body}
            </span>
        );
    }
    return (
        <Link href={kanjiPath(k.char)} prefetch={false} className={cn(base, "border-line bg-card transition-colors hover:border-[var(--c)]")} title={`${k.char} – ${k.meaning}`}>
            {body}
        </Link>
    );
}

function TileRow({ items, highlight, currentChar }: { items: (KanjiLite & { matches?: boolean })[]; highlight?: boolean; currentChar?: string }) {
    return (
        <ul className="flex flex-wrap gap-2">
            {items.map((k) => (
                <li key={k.char}>
                    <MiniTile k={k} highlight={highlight && k.matches} current={k.char === currentChar} />
                </li>
            ))}
        </ul>
    );
}

const card = "rounded-xl border border-line bg-card/60 px-4 py-4";

/** "Also built on 氵": other kanji that share each part. */
export function AlsoBuiltOnBlocks({ groups }: { groups: AlsoBuiltOn[] }) {
    if (!groups.length) return null;
    return (
        <div className="grid gap-3 md:grid-cols-2">
            {groups.map(({ part, kanji, total, moreHref }) => (
                <div key={part.char} className={cn(card, partClass(part))} style={partStyle(part)}>
                    <h3 className="mb-3 text-sm text-[var(--pc)]">
                        Also built on{" "}
                        <span lang="ja" className="font-jp font-bold">
                            {part.char}
                        </span>
                        {part.gloss && <> {part.gloss}</>}
                        <span className="text-ink-3"> · {total} kanji</span>
                    </h3>
                    <TileRow items={kanji} />
                    {moreHref && total > kanji.length && (
                        <Link href={moreHref} className="mt-3 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-[var(--c)]">
                            All {total} with{" "}
                            <span lang="ja" className="font-jp">
                                {part.char}
                            </span>{" "}
                            <ArrowRight size={14} aria-hidden />
                        </Link>
                    )}
                </div>
            ))}
        </div>
    );
}

/** The phonetic series: kanji sharing a sound part, with the shared reading and a regular/irregular note. */
export function SoundFamily({ char, family, heads = false }: { char: string; family: SoundFamilyView; heads?: boolean }) {
    const phonetic = family.phoneticHref ? (
        <Link href={family.phoneticHref} prefetch={false} lang="ja" className="font-jp font-bold text-ink hover:text-[var(--c)]">
            {family.phonetic}
        </Link>
    ) : (
        <span lang="ja" className="font-jp font-bold text-ink">
            {family.phonetic}
        </span>
    );

    let note: React.ReactNode = null;
    if (!heads) {
        if (!family.reading) note = <>The family doesn&apos;t share one reading.</>;
        else if (family.regular)
            note = (
                <>
                    <span lang="ja" className="font-jp">{char}</span> follows the family: read{" "}
                    <span lang="ja" className="font-jp text-ink">{family.reading}</span> ({family.romaji}). Regular.
                </>
            );
        else
            note = (
                <>
                    Irregular: <span lang="ja" className="font-jp">{char}</span> is read{" "}
                    <span lang="ja" className="font-jp text-ink">{family.ownReadings.join("、") || "differently"}</span>, not{" "}
                    <span lang="ja" className="font-jp text-ink">{family.reading}</span> ({family.romaji}).
                </>
            );
    }

    return (
        <div className={card}>
            <h3 className="mb-1 text-sm text-ink">
                {heads ? (
                    <>
                        <span lang="ja" className="font-jp font-bold">{char}</span> gives its sound to
                    </>
                ) : (
                    <>Sound family of {phonetic}</>
                )}
                {family.reading && (
                    <span className="text-ink-3">
                        {" "}
                        · shared reading{" "}
                        <span lang="ja" className="font-jp text-ink">
                            {family.reading}
                        </span>{" "}
                        {family.romaji}
                    </span>
                )}
            </h3>
            {note && <p className="mb-3 text-sm text-ink-2">{note}</p>}
            {!note && <div className="mb-3" />}
            <TileRow items={family.members} highlight currentChar={char} />
            {family.reading && <p className="mt-2 text-xs text-ink-3">Highlighted kanji read {family.reading}. Sound parts come from KanjiVG.</p>}
        </div>
    );
}

/** Other kanji with the same on'yomi. */
export function SameOnBlocks({ groups }: { groups: SameOnView[] }) {
    if (!groups.length) return null;
    return (
        <div className="grid gap-3">
            {groups.map((g) => (
                <div key={g.reading} className={card}>
                    <h3 className="mb-3 text-sm text-ink">
                        Also read{" "}
                        <span lang="ja" className="font-jp font-bold">
                            {g.reading}
                        </span>{" "}
                        <span className="text-ink-3">
                            {g.romaji} · {g.total} other kanji
                        </span>
                    </h3>
                    <TileRow items={g.kanji} />
                    {g.total > g.kanji.length && (
                        <Link href={g.href} prefetch={false} className="mt-3 inline-flex items-center gap-1 text-sm text-ink-2 hover:text-[var(--c)]">
                            Search all read {g.romaji} <ArrowRight size={14} aria-hidden />
                        </Link>
                    )}
                </div>
            ))}
        </div>
    );
}
