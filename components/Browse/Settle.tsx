import type { ReactNode } from "react";
import "./tool-motion.css";

/**
 * A value that softly re-inks when it changes (a result count, "Card 3"):
 * the span is keyed by `value`, so a new value is a new span, and
 * tool-motion.css soaks it in. Only after hydration; numbers never tick.
 * Server-safe. Inside an aria-live region the new text is still announced.
 */
export function Settle({ value, children }: { value: string | number; children: ReactNode }) {
    return (
        <span key={value} data-settle="">
            {children}
        </span>
    );
}
