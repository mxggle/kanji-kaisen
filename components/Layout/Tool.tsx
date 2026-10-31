import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { KindLabel } from "@/components/ui/SectionHeader";

interface ToolProps {
    /** Japanese kind label (探す). */
    jp: string;
    /** English kind label (Browse). */
    kind: string;
    title: ReactNode;
    /** One line on what the tool does. */
    lede?: ReactNode;
    /** Right of the title; at most one primary. */
    actions?: ReactNode;
    /** Filters or sources. Sticky on desktop. */
    rail: ReactNode;
    railLabel?: string;
    /** The result: count, sort, legend and the tile grid (or Teach's paper preview). */
    children: ReactNode;
    className?: string;
}

/**
 * The tool page template: title row, then a 288px rail beside the result.
 * Browse, My list and Teach use it. Server-safe.
 */
export function Tool({ jp, kind, title, lede, actions, rail, railLabel = "Filters", children, className }: ToolProps) {
    return (
        <div className={className}>
            <div className="flex flex-wrap items-end gap-5 pt-8 pb-8 sm:pt-10">
                <div className="flex min-w-0 flex-col gap-3">
                    <KindLabel jp={jp}>{kind}</KindLabel>
                    <h1 className="type-title">{title}</h1>
                    {lede && <p className="max-w-[60ch] text-base leading-relaxed text-ink-2">{lede}</p>}
                </div>
                {actions && <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto">{actions}</div>}
            </div>
            <div className="grid items-start gap-8 lg:grid-cols-[288px_minmax(0,1fr)]">
                <aside aria-label={railLabel} className={cn("flex min-w-0 flex-col gap-[26px] rounded-2xl border border-line bg-card p-[22px] lg:sticky lg:top-6")}>
                    {rail}
                </aside>
                <div className="min-w-0">{children}</div>
            </div>
        </div>
    );
}
