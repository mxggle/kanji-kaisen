import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PlateProps {
    /** Left, 5 parts: art, ancient forms or the glyph, with one set of tabs. Sticky on desktop. */
    specimen: ReactNode;
    /** Right, 7 parts: the facts that matter most and the page's actions. */
    reading: ReactNode;
    /**
     * Top of the reading column (kind label, title, tags). On phones it comes
     * first, before the specimen, when phoneOrder is "after-hero".
     */
    hero?: ReactNode;
    /** Phones: specimen first (theme, radical) or after the hero (kanji). */
    phoneOrder?: "first" | "after-hero";
    specimenLabel?: string;
    /**
     * The plate's entrance: the specimen arrives as a hanging scroll unrolls
     * ("unroll", app/motion.css) from 0ms, while the page staggers its reading
     * column in with data-enter (kind label → title → facts → the rest).
     * Off by default. A page whose specimen holds a <Morph> landing element
     * also mounts <MorphLanding /> (components/Atlas) so the two never fight.
     */
    specimenEnter?: "unroll" | "fade" | "rise";
    className?: string;
}

/**
 * The atlas page template: specimen beside reading, 5 : 7. Stacks below
 * 960px. Theme, radical and kanji pages use it. Server-safe.
 */
export function Plate({ specimen, reading, hero, phoneOrder = "first", specimenLabel = "Specimen", specimenEnter, className }: PlateProps) {
    return (
        <div className={cn("grid gap-6 min-[960px]:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-[960px]:gap-x-12 pt-2", hero && "min-[960px]:grid-rows-[auto_1fr]", className)}>
            {hero && <div className="min-w-0 min-[960px]:col-start-2 min-[960px]:row-start-1">{hero}</div>}
            <section
                aria-label={specimenLabel}
                data-enter={specimenEnter}
                className={cn(
                    "min-w-0 self-start min-[960px]:sticky min-[960px]:top-6 min-[960px]:col-start-1 min-[960px]:row-start-1",
                    hero && "min-[960px]:row-span-2",
                    phoneOrder === "first" && "max-[959px]:order-first",
                )}
            >
                {specimen}
            </section>
            <div className="min-w-0 min-[960px]:col-start-2">{reading}</div>
        </div>
    );
}
