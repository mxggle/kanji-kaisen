import Link from "next/link";
import { radicalPath } from "@/lib/atlas/paths";
import { cn } from "@/lib/utils";

interface RadicalChipProps {
    radical: { key: string; char: string; name?: string; meaning?: string };
    className?: string;
}

export function RadicalChip({ radical, className }: RadicalChipProps) {
    return (
        <Link
            href={radicalPath(radical.key)}
            className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/15 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors", className)}
        >
            <span className="text-lg font-japanese font-bold">{radical.char}</span>
            {radical.name && <span className="text-sm">{radical.name}</span>}
            {radical.meaning && <span className="text-xs text-white/50">{radical.meaning}</span>}
        </Link>
    );
}
