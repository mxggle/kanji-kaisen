import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { enterOrder } from "@/components/Motion/tokens";

/** Height of the action bar row, for anything that must clear it. */
export const ACTION_BAR_HEIGHT = 64;

/**
 * Phone only: the page's one primary action plus icon buttons, pinned above
 * the tab bar. Renders a spacer in the flow so the page's end stays reachable.
 * It rises out from behind the tab bar a beat after the page arrives.
 * Server-safe.
 */
export function ActionBar({ children, label = "Actions", className }: { children: ReactNode; label?: string; className?: string }) {
    return (
        <>
            <div aria-hidden className="h-16 lg:hidden print:hidden" />
            <div
                role="group"
                aria-label={label}
                data-enter="rise"
                style={enterOrder(0, 220, { "--rise": "100%" } as CSSProperties)}
                className={cn(
                    "fixed inset-x-0 bottom-[calc(76px+env(safe-area-inset-bottom))] z-40 flex h-16 items-center gap-2 border-t border-line bg-[rgba(var(--shade),.94)] px-4 backdrop-blur-[10px] lg:hidden print:hidden",
                    "[&>*:first-child]:flex-1",
                    className,
                )}
            >
                {children}
            </div>
        </>
    );
}
