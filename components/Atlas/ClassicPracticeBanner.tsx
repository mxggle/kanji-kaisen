import Link from "next/link";
import { ArrowRight, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { browsePath } from "@/lib/atlas/paths";

/** Slim notice on the classic practice pages pointing back to the atlas. */
export function ClassicPracticeBanner({ className }: { className?: string }) {
    return (
        <div
            role="note"
            className={cn(
                "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 rounded-xl",
                "bg-white/5 border border-white/10 text-sm",
                className,
            )}
        >
            <span className="flex items-center gap-2 text-white/60">
                <Swords size={16} className="text-[var(--accent)]" aria-hidden />
                Classic practice mode
            </span>
            <Link
                href={browsePath()}
                className="inline-flex items-center gap-1 font-medium text-[var(--accent)] hover:underline underline-offset-4"
            >
                Browse the kanji atlas <ArrowRight size={14} aria-hidden />
            </Link>
        </div>
    );
}
