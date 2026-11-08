"use client";

import { useState } from "react";
import { useShade } from "@/lib/ink-store";
import { shadeLabel } from "@/lib/ink";
import { Tag } from "@/components/ui/Tag";
import { InkSwatch } from "@/components/ui/InkLegend";
import styles from "./kanji.module.css";

/** Your ink on this kanji, as a tag with its swatch ("淡 Met"). Not met until the store hydrates. */
export function InkTag({ char }: { char: string }) {
    const shade = useShade(char);
    // When your ink changes on the page (the store arriving, a learn session),
    // the swatch is pressed in like a seal. Not on first paint.
    const [prev, setPrev] = useState(shade);
    const [changed, setChanged] = useState(false);
    if (shade !== prev) {
        setPrev(shade);
        setChanged(true);
    }
    return (
        <Tag>
            <InkSwatch key={shade} shade={shade} className={changed ? `size-3 rounded-[3px] ${styles.stamp}` : "size-3 rounded-[3px]"} />
            <span className="sr-only">Your ink: </span>
            {shadeLabel(shade)}
        </Tag>
    );
}
