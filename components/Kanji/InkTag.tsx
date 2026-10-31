"use client";

import { useShade } from "@/lib/ink-store";
import { shadeLabel } from "@/lib/ink";
import { Tag } from "@/components/ui/Tag";
import { InkSwatch } from "@/components/ui/InkLegend";

/** Your ink on this kanji, as a tag with its swatch ("淡 Met"). Not met until the store hydrates. */
export function InkTag({ char }: { char: string }) {
    const shade = useShade(char);
    return (
        <Tag>
            <InkSwatch shade={shade} className="size-3 rounded-[3px]" />
            <span className="sr-only">Your ink: </span>
            {shadeLabel(shade)}
        </Tag>
    );
}
