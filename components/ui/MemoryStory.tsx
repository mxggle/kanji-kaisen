import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MemoryStoryProps {
    /** The mnemonic, without quote marks. */
    children: ReactNode;
    label?: string;
    /** Below the story, e.g. a link to the radical whose story it is. */
    footer?: ReactNode;
    /**
     * Motion (docs/design/motion.md): the card fades in and the story soaks in
     * after it, on mount ("enter") or as it scrolls in ("reveal"). Story text
     * only ever takes the `ink` kind (rule 4), so the hooks are not open to callers.
     */
    motion?: "enter" | "reveal";
    className?: string;
}

/**
 * A memory story (rule 4): the only italic text on the site, always labelled
 * as made up so it is never mistaken for history. Server-safe.
 */
export function MemoryStory({ children, label = "Memory story · made up to help you remember", footer, motion, className }: MemoryStoryProps) {
    const card = motion && { [`data-${motion}`]: "fade" };
    const story = motion && { [`data-${motion}`]: "ink", style: { "--delay": "140ms" } as CSSProperties };
    return (
        <section {...card} className={cn("flex flex-col gap-2.5 rounded-2xl border border-line bg-card px-[22px] py-5", className)}>
            <h3 className="type-label">{label}</h3>
            <blockquote {...story} className="type-story">“{children}”</blockquote>
            {footer && <div className="text-sm text-ink-2">{footer}</div>}
        </section>
    );
}
