import type { ReactNode } from "react";
import { KindLabel } from "@/components/ui/SectionHeader";
import { enterOrder } from "@/components/Motion/tokens";

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
    /**
     * The result rises in after the rail (default). Pass false when it holds
     * shared elements (<Morph> tiles), which must not sit under a motion
     * hook; the result then brings its own entrance.
     */
    enterResult?: boolean;
    className?: string;
}

/**
 * The tool page template: title row, then a 288px rail beside the result.
 * Browse, My list and Teach use it. Server-safe.
 *
 * Entrance (docs/design/motion.md): kind label, title, lede and actions,
 * then the rail drifts in from the side, then the result rises.
 */
export function Tool({ jp, kind, title, lede, actions, rail, railLabel = "Filters", children, enterResult = true, className }: ToolProps) {
    return (
        <div className={className}>
            <div className="flex flex-wrap items-end gap-5 pt-8 pb-8 sm:pt-10">
                <div className="flex min-w-0 flex-col gap-3">
                    <KindLabel jp={jp} data-enter="fade">
                        {kind}
                    </KindLabel>
                    <h1 className="type-title" data-enter="ink" style={enterOrder(1)}>
                        {title}
                    </h1>
                    {lede && (
                        <p className="max-w-[60ch] text-base leading-relaxed text-ink-2" data-enter="" style={enterOrder(2)}>
                            {lede}
                        </p>
                    )}
                </div>
                {actions && (
                    <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto" data-enter="fade" style={enterOrder(3)}>
                        {actions}
                    </div>
                )}
            </div>
            <div className="grid items-start gap-8 lg:grid-cols-[288px_minmax(0,1fr)]">
                {/* A rail taller than the screen scrolls inside its sticky card. */}
                <aside
                    aria-label={railLabel}
                    data-enter="drift"
                    style={enterOrder(3)}
                    className="flex min-w-0 flex-col gap-[26px] rounded-2xl border border-line bg-card p-[22px] lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto lg:overscroll-contain lg:scroll-quiet"
                >
                    {rail}
                </aside>
                <div className="min-w-0" data-enter={enterResult ? "" : undefined} style={enterResult ? enterOrder(5) : undefined}>
                    {children}
                </div>
            </div>
        </div>
    );
}
