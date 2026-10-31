"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";

/**
 * The phone action bar's "More" (card, print, present): a <details> that
 * opens upward and closes on Escape or a tap outside.
 */
export function MoreMenu({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        const close = () => {
            if (ref.current) ref.current.open = false;
        };
        const onPointer = (e: PointerEvent) => {
            if (ref.current?.open && !ref.current.contains(e.target as Node)) close();
        };
        const onKey = (e: KeyboardEvent) => {
            // A dialog opened from the menu handles its own Escape.
            if (e.key !== "Escape" || !ref.current?.open || document.querySelector("dialog[open]")) return;
            close();
            ref.current.querySelector("summary")?.focus();
        };
        document.addEventListener("pointerdown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    return (
        <details ref={ref} className={cn("group relative", className)}>
            <summary aria-label={label} className={cn(buttonClass({ iconOnly: true }), "list-none group-open:border-ink [&::-webkit-details-marker]:hidden")}>
                <Ellipsis aria-hidden />
            </summary>
            <div className="absolute right-0 bottom-full mb-3 flex w-52 flex-col gap-0.5 rounded-2xl border border-line bg-card p-1.5">{children}</div>
        </details>
    );
}
