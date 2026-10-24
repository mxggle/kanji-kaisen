import { cn } from "@/lib/utils";
import type { JlptLevel } from "@/lib/atlas/types";

// JLPT colors come from the --n1…--n5 tokens in globals.css.
export function jlptColor(level: JlptLevel) {
    return `var(--${level.toLowerCase()})`;
}

export function JlptBadge({ level, className }: { level: JlptLevel; className?: string }) {
    return (
        <span
            className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border", className)}
            style={{ color: jlptColor(level), borderColor: jlptColor(level), backgroundColor: `color-mix(in oklab, ${jlptColor(level)} 12%, transparent)` }}
        >
            JLPT {level}
        </span>
    );
}

export function StatBadge({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10", className)}>
            {children}
        </span>
    );
}
