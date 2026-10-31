import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface OriginCardProps {
    /** The sourced account, in roman type. */
    children: ReactNode;
    /** Required (rule 4): who says so, e.g. "Ideogrammic compound · Wiktionary, CC BY-SA 4.0". Links underline. */
    source: ReactNode;
    /** A line between label and text, e.g. the formation tag and parts. */
    lead?: ReactNode;
    label?: string;
    className?: string;
}

/** Sourced etymology (rule 4): roman type, always with its source. Server-safe. */
export function OriginCard({ children, source, lead, label = "Origin · sourced", className }: OriginCardProps) {
    return (
        <section className={cn("flex flex-col gap-2.5 rounded-2xl border border-line bg-card px-[22px] py-5", className)}>
            <h3 className="type-label">{label}</h3>
            {lead}
            <div className="text-[15px] leading-relaxed text-ink">{children}</div>
            <p className="text-xs leading-normal text-ink-3 [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-ink">{source}</p>
        </section>
    );
}
