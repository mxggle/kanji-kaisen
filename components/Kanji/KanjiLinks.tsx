import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { KanjiTile, type KanjiTileData } from "@/components/ui/KanjiTile";
import { RadicalSeal } from "@/components/ui/RadicalSeal";
import { InkLegend } from "@/components/ui/InkLegend";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LookAlikeCompare } from "./LookAlikeCompare";
import type { AlsoBuiltOn, KanjiLite, LookAlikeView, SameOnView, SoundFamilyView } from "./types";

const toTile = (k: KanjiLite): KanjiTileData => ({ char: k.char, meanings: [k.meaning], onyomi: k.reading ? [k.reading] : [], category: k.category });

/** A row of tiles, each in its own theme colour and filled with your ink. */
function Tiles({ items }: { items: KanjiLite[] }) {
    return (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(84px,1fr))]">
            {items.map((k) => (
                <li key={k.char} className="min-w-0">
                    <KanjiTile kanji={toTile(k)} />
                </li>
            ))}
        </ul>
    );
}

const groupTitle = "text-[17px] font-bold leading-snug";
const moreLink = "ml-auto whitespace-nowrap text-sm text-ink-2 transition-colors hover:text-ink";

function Group({ head, note, items }: { head: ReactNode; note?: ReactNode; items: KanjiLite[] }) {
    return (
        <div className="flex min-w-0 flex-col gap-3.5">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">{head}</div>
            {note && <p className="-mt-1.5 text-sm text-ink-2">{note}</p>}
            <Tiles items={items} />
        </div>
    );
}

const Ja = ({ children, className }: { children: ReactNode; className?: string }) => (
    <span lang="ja" className={cn("font-jp", className)}>
        {children}
    </span>
);

/** How this kanji sits in its sound family, for the sound part's group. */
function familyNote(char: string, family: SoundFamilyView): ReactNode {
    if (!family.reading) return <>The <Ja>{family.phonetic}</Ja> sound family doesn&apos;t share one reading.</>;
    const shared = (
        <>
            <Ja className="text-ink">{family.reading}</Ja> ({family.romaji})
        </>
    );
    if (family.regular) return <><Ja>{char}</Ja> takes the <Ja>{family.phonetic}</Ja> family&apos;s reading, {shared}.</>;
    return (
        <>
            The <Ja>{family.phonetic}</Ja> family reads {shared}; <Ja>{char}</Ja> is read <Ja className="text-ink">{family.ownReadings.join("、") || "differently"}</Ja>.
        </>
    );
}

function BuiltOnGroup({ char, group, family }: { char: string; group: AlsoBuiltOn; family: SoundFamilyView | null }) {
    const { part, radical, total, kanji, moreHref } = group;
    return (
        <Group
            items={kanji}
            note={family && family.phonetic === part.char ? familyNote(char, family) : undefined}
            head={
                <>
                    <RadicalSeal char={part.char} size="md" chars={radical?.chars} category={radical?.category} />
                    <h3 className={groupTitle}>
                        Also built on {part.gloss ?? <Ja className="font-extrabold">{part.char}</Ja>}
                        {part.gloss && (
                            <span className="sr-only">
                                {" "}
                                (<Ja>{part.char}</Ja>)
                            </span>
                        )}
                    </h3>
                    {radical && moreHref ? (
                        <Link href={moreHref} className={moreLink}>
                            All {total} <span aria-hidden>→</span>
                        </Link>
                    ) : (
                        total > kanji.length && <span className="ml-auto text-sm text-ink-3">{total} in all</span>
                    )}
                </>
            }
        />
    );
}

/** The "音" mark before a shared reading: a dashed line, as for a sound part (rule 2). */
function SoundMark({ reading }: { reading: string }) {
    return (
        <span aria-hidden className="inline-flex h-9 items-center gap-2 rounded-full border border-dashed border-c pr-3.5 pl-1.5 text-[15px] text-ink">
            <span lang="ja" className="flex size-[26px] items-center justify-center rounded-full border border-dashed border-c font-jp text-sm font-extrabold text-c">
                音
            </span>
            <Ja>{reading}</Ja>
        </span>
    );
}

interface KanjiConnectionsProps {
    char: string;
    meaning: string;
    paths: string[];
    alsoBuiltOn: AlsoBuiltOn[];
    soundFamily: SoundFamilyView | null;
    headedFamily: SoundFamilyView | null;
    sameOn: SameOnView[];
    lookAlikes: LookAlikeView[];
    className?: string;
}

/**
 * 繋がり: kanji that share a part, kanji this one gives its sound to, kanji
 * with the same on'yomi, and look-alikes. Renders nothing when there are none.
 */
export function KanjiConnections({ char, meaning, paths, alsoBuiltOn, soundFamily, headedFamily, sameOn, lookAlikes, className }: KanjiConnectionsProps) {
    const heads = headedFamily && headedFamily.members.length > 0 ? headedFamily : null;
    if (!alsoBuiltOn.length && !heads && !sameOn.length && !lookAlikes.length) return null;
    return (
        <section aria-labelledby="links-title" className={cn("flex flex-col gap-7", className)}>
            <SectionHeader jp="繋がり" title="Connections" id="links-title" aside={<InkLegend />} />

            {alsoBuiltOn.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(min(480px,100%),1fr))] gap-x-6 gap-y-7">
                    {alsoBuiltOn.map((group) => (
                        <BuiltOnGroup key={group.part.char} char={char} group={group} family={soundFamily} />
                    ))}
                </div>
            )}

            {heads && (
                <Group
                    items={heads.members}
                    note={heads.reading ? <>The family reading is <Ja className="text-ink">{heads.reading}</Ja> ({heads.romaji}). Sound parts: KanjiVG.</> : <>Sound parts: KanjiVG.</>}
                    head={
                        <h3 className={groupTitle}>
                            <Ja className="font-extrabold">{char}</Ja> gives its sound to
                        </h3>
                    }
                />
            )}

            {sameOn.map((group) => (
                <Group
                    key={group.reading}
                    items={group.kanji}
                    head={
                        <>
                            <SoundMark reading={group.reading} />
                            <h3 className={groupTitle}>
                                Also read <Ja>{group.reading}</Ja>
                            </h3>
                            <span className="text-sm text-ink-3">
                                {group.total} {group.total === 1 ? "kanji shares" : "kanji share"} this on&apos;yomi
                            </span>
                            {group.total > group.kanji.length && (
                                <Link href={group.href} prefetch={false} className={moreLink}>
                                    All {group.total} <span aria-hidden>→</span>
                                </Link>
                            )}
                        </>
                    }
                />
            ))}

            {lookAlikes.length > 0 && <LookAlikeCompare char={char} meaning={meaning} paths={paths} items={lookAlikes} />}
        </section>
    );
}
