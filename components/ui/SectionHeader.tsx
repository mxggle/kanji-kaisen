import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    /** Japanese label in --c (成り立ち). */
    jp: string;
    title: ReactNode;
    /** Right-hand note or control. */
    aside?: ReactNode;
    as?: "h2" | "h3";
    id?: string;
    className?: string;
    style?: CSSProperties;
    /** Motion hooks (data-enter, data-reveal…) pass through to the wrapper. */
    [data: `data-${string}`]: string | undefined;
}

/** Every section opens with the same pair: a Japanese label in the accent, then the title. Server-safe. */
export function SectionHeader({ jp, title, aside, as: Heading = "h2", id, className, ...rest }: SectionHeaderProps) {
    return (
        <div {...rest} className={cn("flex flex-wrap items-baseline gap-x-3.5 gap-y-2", className)}>
            <span lang="ja" className="font-jp text-base text-c">
                {jp}
            </span>
            <Heading id={id} className="type-section">
                {title}
            </Heading>
            {aside && <div className="ml-auto text-sm text-ink-3">{aside}</div>}
        </div>
    );
}

/** The kind line over a title: "漢字  KANJI · BODY & PEOPLE". Server-safe. */
export function KindLabel({
    jp,
    children,
    className,
    ...rest
}: {
    jp: string;
    children?: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Motion hooks (data-enter, data-reveal…) pass through. */
    [data: `data-${string}`]: string | undefined;
}) {
    return (
        <p {...rest} className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1", className)}>
            <span lang="ja" className="font-jp text-base text-c">
                {jp}
            </span>
            {children && <span className="type-label">{children}</span>}
        </p>
    );
}
