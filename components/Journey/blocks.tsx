// Server blocks of the radical page (boards A-Radical, A-M-Radical). The
// sourced origin (Wiktionary) and the memory story stay in separate,
// labelled primitives (OriginCard, MemoryStory) so a story is never read as
// etymology.

import Link from "next/link";
import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { kanjiPath, radicalPath } from "@/lib/atlas/paths";
import { themeVars } from "@/components/Atlas/category/themeStyles";
import { KanjiTile } from "@/components/ui/KanjiTile";
import { OriginCard } from "@/components/ui/OriginCard";
import { RadicalSeal } from "@/components/ui/RadicalSeal";
import { Tag } from "@/components/ui/Tag";
import type { GrowthView, NeighbourRadical, OriginView, PlacementView } from "./data";
import { shortMeaning, type FormulaPart, type Placement } from "./radical";

const PLACEMENT_LABEL: Record<Placement, string> = {
    left: "left",
    right: "right",
    top: "top",
    bottom: "bottom",
    enclosing: "around",
    "top-left": "top and left",
    "bottom-left": "bottom and left",
    repeated: "repeated",
};

/** The sourced glyph origin, only rendered when Wiktionary gave one (rule 4: roman, with its source). */
export function RadicalOrigin({ char, origin }: { char: string; origin: OriginView }) {
    return (
        <OriginCard
            lead={
                origin.formation ? (
                    <p className="flex flex-wrap gap-2">
                        <Tag>
                            {origin.formation.en}
                            {origin.formation.zh && (
                                <span lang="zh-Hant" className="font-jp">
                                    {origin.formation.zh}
                                </span>
                            )}
                        </Tag>
                    </p>
                ) : undefined
            }
            source={
                <>
                    Source:{" "}
                    <a href={origin.revisionUrl} target="_blank" rel="noopener noreferrer">
                        Wiktionary, <span lang="zh-Hant">{origin.page}</span>
                    </a>{" "}
                    (rev. {origin.revid}){origin.page !== char && <>, the entry for the full form</>}, CC BY-SA 4.0
                </>
            }
        >
            {origin.text && <p className="text-base leading-normal sm:text-lg">{origin.text}</p>}
            {origin.components.length > 0 && (
                <p className="mt-2 text-sm text-ink-2">
                    Built from{" "}
                    {origin.components.map((c, i) => (
                        <Fragment key={i}>
                            {i > 0 && " + "}
                            <span lang="zh-Hant" className="font-jp text-ink">
                                {c.form ?? c.char}
                            </span>
                            {c.gloss && <> “{c.gloss}”</>}
                            {c.role && <> ({c.role === "phonetic" ? "sound" : "meaning"})</>}
                        </Fragment>
                    ))}
                </p>
            )}
        </OriginCard>
    );
}

/** A kanji drawn from KanjiVG with the radical's strokes in the theme colour. */
function PlacedGlyph({ item }: { item: PlacementView }) {
    const marked = new Set(item.radical);
    return (
        <svg viewBox="0 0 109 109" aria-hidden focusable="false" className="size-11 flex-none fill-none [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:6]">
            {item.strokes.map((d, i) => (
                <path key={i} d={d} className={marked.has(i) ? "stroke-c" : "stroke-ink-2"} />
            ))}
        </svg>
    );
}

/** "Where it sits in a kanji": up to three kanji, one per placement (KanjiVG positions). */
export function Placements({ char, items, lead }: { char: string; items: PlacementView[]; lead?: string }) {
    if (items.length === 0) return null;
    return (
        <section aria-labelledby="placements-title" className="flex flex-col gap-2.5">
            <h2 id="placements-title" className="type-label">
                Where it sits in a kanji
            </h2>
            {lead && <p className="max-w-[60ch] text-sm leading-relaxed text-ink-2">{lead}</p>}
            <ul className="flex flex-wrap gap-2.5">
                {items.map((item) => (
                    <li key={item.char} className="min-w-0">
                        <Link
                            href={kanjiPath(item.char)}
                            className="flex items-center gap-3 rounded-2xl border border-line bg-card py-2.5 pl-3 pr-4 transition-[border-color,transform] duration-(--dur-ui) ease-(--ease-out) hover:border-ink-3 active:scale-[.98] motion-reduce:transition-none"
                        >
                            <PlacedGlyph item={item} />
                            <span className="min-w-0 text-sm text-ink-2">
                                <span lang="ja" className="sr-only">
                                    {item.char},{" "}
                                </span>
                                <span className="text-ink">{PLACEMENT_LABEL[item.placement]}</span>
                                <span className="sr-only"> ({char})</span>
                                {item.meaning && <> · {item.meaning}</>}
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

/** One part of a formula: solid accent line for meaning, dashed for sound (rule 2); the radical in --c. */
function FormulaGlyph({ part }: { part: FormulaPart }) {
    return (
        <span
            lang="ja"
            className={cn(
                "font-jp underline decoration-c decoration-[1.5px] underline-offset-[5px]",
                part.role === "sound" ? "decoration-dashed" : "decoration-solid",
                part.radical && "text-c",
            )}
        >
            {part.char}
        </span>
    );
}

function Formula({ parts, radicalChar, kanjiChar }: { parts: FormulaPart[]; radicalChar: string; kanjiChar: string }) {
    if (parts.length === 0) {
        return (
            <>
                <FormulaGlyph part={{ char: radicalChar, role: "meaning", radical: true, count: 1 }} />
                <span aria-hidden> → </span>
                <span className="sr-only"> becomes </span>
                <span lang="ja" className="font-jp">
                    {kanjiChar}
                </span>
            </>
        );
    }
    return (
        <>
            {parts.map((part, i) => (
                <Fragment key={i}>
                    {i > 0 && " + "}
                    {part.count > 2 ? (
                        <>
                            <FormulaGlyph part={part} /> × {part.count}
                        </>
                    ) : (
                        Array.from({ length: part.count }, (_, n) => (
                            <Fragment key={n}>
                                {n > 0 && " + "}
                                <FormulaGlyph part={part} />
                            </Fragment>
                        ))
                    )}
                    {part.role === "sound" && <span className="ml-1 text-xs font-normal text-ink-3">sound</span>}
                </Fragment>
            ))}
        </>
    );
}

/**
 * "What it grows into": sourced examples only, each a tile, its formula and
 * its source. The cards rise as they scroll in, and each tile's glyph flies to
 * its kanji page (the radical page's grid leaves these kanji out of its own morph).
 */
export function GrowthList({ radicalChar, items }: { radicalChar: string; items: GrowthView[] }) {
    return (
        <ul data-reveal-group="rise" className="grid gap-4 sm:gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr))]">
            {items.map((item) => (
                <li key={item.kanji.char} className="flex min-w-0 items-center gap-4 rounded-2xl border border-line bg-card p-4 sm:gap-5 sm:p-5">
                    <KanjiTile kanji={item.kanji} size="lg" morph className="w-[104px] flex-none px-2 sm:w-[120px]" />
                    <div className="flex min-w-0 flex-col gap-1.5">
                        <p className="text-[17px] font-bold leading-snug">
                            <Formula parts={item.formula} radicalChar={radicalChar} kanjiChar={item.kanji.char} />
                        </p>
                        {item.text && <p className="line-clamp-4 text-sm leading-normal text-ink-2">{item.text}</p>}
                        <p className="text-xs leading-normal text-ink-3">
                            {item.formation && <>{item.formation.en} · </>}
                            <a href={item.revisionUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-colors hover:text-ink">
                                Wiktionary{item.page !== item.kanji.char && <>, <span lang="zh-Hant">{item.page}</span></>}
                            </a>
                            , CC BY-SA 4.0
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    );
}

const ARROW = "text-sm text-ink-3 transition-transform duration-(--dur-ui) ease-(--ease-out) motion-reduce:transition-none";

/**
 * Previous or next radical in the theme, as a card with its seal. Its seal
 * flies into the radical page it opens; the arrow leans the way it goes on hover.
 */
export function NeighbourCard({ radical, dir, theme }: { radical: NeighbourRadical | null; dir: "prev" | "next"; theme: string }) {
    if (!radical) return <span />;
    const count = Array.from(radical.chars).length;
    const text = (
        <span className={cn("flex min-w-0 flex-col", dir === "next" && "items-end")}>
            <span className="text-xs text-ink-3">
                {dir === "prev" ? "Previous" : "Next"} in {theme}
            </span>
            <span className="max-w-full truncate">
                {shortMeaning(radical.meaning)}
                <span className="max-sm:hidden"> · {count} kanji</span>
            </span>
        </span>
    );
    return (
        <Link
            href={radicalPath(radical.key)}
            style={themeVars(radical.category)}
            className={cn(
                "group/card flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-card p-4 sm:gap-4 sm:px-[22px] sm:py-5",
                "transition-[border-color,transform] duration-(--dur-ui) ease-(--ease-out) hover:border-ink-3 active:scale-[.985] motion-reduce:transition-none",
                dir === "next" && "justify-end text-right",
            )}
        >
            {dir === "prev" && (
                <span aria-hidden className={cn(ARROW, "group-hover/card:-translate-x-1")}>
                    ‹
                </span>
            )}
            {dir === "next" && text}
            <RadicalSeal char={radical.char} size="md" chars={radical.chars} morph={radical.key} />
            {dir === "prev" && text}
            {dir === "next" && (
                <span aria-hidden className={cn(ARROW, "group-hover/card:translate-x-1")}>
                    ›
                </span>
            )}
        </Link>
    );
}
