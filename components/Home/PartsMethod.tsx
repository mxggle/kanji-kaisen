import Link from "next/link";
import type { CSSProperties } from "react";
import { kanjiPath, radicalPath } from "@/lib/atlas/paths";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { Button } from "@/components/ui/Button";
import { PartChip, PartPlus } from "@/components/ui/PartChip";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { SoundFamily } from "./data";
import styles from "./home.module.css";

interface PartsMethodProps {
    family: SoundFamily;
    /** The radical the "grows into" link opens, with its kanji count. */
    grows: { key: string; char: string; count: number };
    className?: string;
}

/**
 * Home: the method in one example. Each row is meaning part + sound part =
 * kanji, drawn with the part roles (solid for meaning, dashed for sound) in
 * that kanji's theme colour. As it scrolls into view it demonstrates itself:
 * the shared sound part is pressed into every row, then row by row the meaning
 * part joins it and the kanji they make soaks in (home.module.css). Server-safe.
 */
export function PartsMethod({ family, grows, className }: PartsMethodProps) {
    const sound = (
        <span lang="ja" className="font-jp font-extrabold">
            {family.phonetic}
        </span>
    );
    return (
        <section aria-labelledby="parts-title" className={className}>
            <SectionHeader id="parts-title" jp="部品で読む" title="Read a kanji by its parts" aside="The method behind every page" data-reveal="rise" />
            <div className="mt-[22px] flex flex-wrap items-center gap-x-12 gap-y-8">
                <div data-reveal-group="rise" className="flex min-w-0 flex-[5_1_360px] flex-col gap-4">
                    <p className="text-lg leading-relaxed text-ink-2">
                        Most kanji are built from two kinds of part. One hints at the <b className="text-ink">meaning</b> and is drawn with a solid line. The other hints at
                        the <b className="text-ink">sound</b> and is drawn with a dashed one.
                    </p>
                    <p className="text-base leading-relaxed text-ink-2">
                        Learn {sound} (<span lang="ja">{family.reading}</span>) once and you can guess how a whole family is read.
                    </p>
                    <Button href={radicalPath(grows.key)} className="self-start">
                        See how <span lang="ja" className="font-jp font-extrabold">{grows.char}</span> grows into {grows.count} kanji
                    </Button>
                </div>
                <ul data-reveal="fade" className={`${styles.family} flex min-w-0 flex-[7_1_520px] flex-col gap-3`}>
                    {family.rows.map((row, i) => (
                        <li
                            key={row.char}
                            style={{ ...themeVars(row.category), "--row": i } as CSSProperties}
                            className="flex flex-wrap items-center gap-x-3.5 gap-y-3 rounded-2xl border border-line bg-card px-4 py-3.5 sm:px-[18px]"
                        >
                            <span className="flex items-center gap-3.5">
                                <PartChip char={row.part.char} role="meaning" label={row.part.gloss} note={<span className="sr-only">meaning</span>} className={`${styles.meaning} pr-1.5`} />
                                <PartPlus />
                                <PartChip char={family.phonetic} role="sound" label={<span lang="ja">{family.reading}</span>} note={<span className="sr-only">sound</span>} className={`${styles.sound} pr-1.5`} />
                            </span>
                            <span className="flex min-w-0 items-center gap-3.5">
                                <span aria-hidden className={`${styles.equals} text-lg text-ink-3`}>
                                    =
                                </span>
                                <Link href={kanjiPath(row.char)} className={`${styles.result} flex min-w-0 items-baseline gap-3 rounded-lg`}>
                                    <span lang="ja" className="font-jp text-[40px] font-extrabold leading-none">
                                        {row.char}
                                    </span>
                                    <span className="min-w-0 text-sm text-ink-2">
                                        <b className="text-ink">{row.meaning}</b> · <span lang="ja">{family.reading}</span>
                                    </span>
                                </Link>
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
