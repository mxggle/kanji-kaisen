import { cn } from "@/lib/utils";
import type { JlptLevel } from "@/lib/atlas/types";

/** Deprecated: JLPT is a plain tag now (rule 1). Use components/ui/Tag. */
export function JlptBadge({ level, className }: { level: JlptLevel; className?: string }) {
    return (
        <span className={cn("inline-flex h-[26px] items-center rounded-full border border-line-2 px-2.5 text-[13px] leading-none text-ink-2", className)}>
            JLPT {level}
        </span>
    );
}

/** Deprecated: use components/ui/Tag. */
export function StatBadge({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={cn("inline-flex h-[26px] items-center rounded-full border border-line-2 px-2.5 text-[13px] leading-none text-ink-2", className)}>
            {children}
        </span>
    );
}
