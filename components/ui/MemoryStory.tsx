import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface MemoryStoryProps {
    /** The mnemonic, without quote marks. */
    children: ReactNode;
    label?: string;
    /** Below the story, e.g. a link to the radical whose story it is. */
    footer?: ReactNode;
    className?: string;
}

/**
 * A memory story (rule 4): the only italic text on the site, always labelled
 * as made up so it is never mistaken for history. Server-safe.
 */
export function MemoryStory({ children, label = "Memory story · made up to help you remember", footer, className }: MemoryStoryProps) {
    return (
        <section className={cn("flex flex-col gap-2.5 rounded-2xl border border-line bg-card px-[22px] py-5", className)}>
            <h3 className="type-label">{label}</h3>
            <blockquote className="type-story">“{children}”</blockquote>
            {footer && <div className="text-sm text-ink-2">{footer}</div>}
        </section>
    );
}
