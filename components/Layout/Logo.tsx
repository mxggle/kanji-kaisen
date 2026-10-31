import Link from "next/link";
import { cn } from "@/lib/utils";

const SIZES = {
    sm: { mark: "size-[26px] text-[15px]", word: "text-lg" },
    md: { mark: "size-7 text-base lg:size-8 lg:text-[19px]", word: "text-[19px] lg:text-[22px]" },
};

/** The 解 mark and the wordmark, linking home. */
export function Logo({ size = "md", wordmarkClassName, className }: { size?: keyof typeof SIZES; wordmarkClassName?: string; className?: string }) {
    const s = SIZES[size];
    return (
        <Link href="/" aria-label="Kanji Kaisen home" className={cn("flex flex-none items-center gap-3 text-ink", className)}>
            <span lang="ja" aria-hidden className={cn("flex items-center justify-center border border-ink-2 font-jp font-extrabold leading-none", s.mark)}>
                解
            </span>
            <span className={cn("whitespace-nowrap font-disp font-semibold leading-none tracking-[.04em]", s.word, wordmarkClassName)}>Kanji Kaisen</span>
        </Link>
    );
}
