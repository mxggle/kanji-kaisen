import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "quiet";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full border font-medium leading-none transition-[border-color,background-color,color,opacity] disabled:cursor-not-allowed aria-disabled:pointer-events-none [&_svg]:size-[18px] [&_svg]:flex-none";

// Faded, for the outline variants.
const FADE = "disabled:opacity-50 aria-disabled:opacity-50";
// A disabled primary drops its ink fill and reads as an empty outline: half-opacity
// ink on the dark skin is a grey slab that matches nothing else on the page.
const EMPTY =
    "disabled:border-line-2 disabled:bg-transparent disabled:text-ink-3 aria-disabled:border-line-2 aria-disabled:bg-transparent aria-disabled:text-ink-3";

const VARIANTS: Record<ButtonVariant, string> = {
    // Ink, never a theme colour (rule 1). At most one per screen.
    primary: cn("border-ink bg-ink font-bold text-bg hover:opacity-90", EMPTY),
    secondary: cn("border-line-2 bg-transparent text-ink hover:border-ink", FADE),
    quiet: cn("border-transparent bg-transparent text-ink-2 hover:text-ink", FADE),
};

const SIZES: Record<ButtonSize, string> = {
    sm: "h-9 px-3.5 text-sm",
    md: "h-11 px-5 text-[15px]",
    lg: "h-[52px] px-[26px] text-base",
};

const ICON_SIZES: Record<ButtonSize, string> = { sm: "w-9 px-0", md: "w-11 px-0", lg: "w-[52px] px-0" };

/** Button classes, for elements that can't be a <Button> (a <summary>, a label). */
export function buttonClass({ variant = "secondary", size = "md", iconOnly = false }: { variant?: ButtonVariant; size?: ButtonSize; iconOnly?: boolean } = {}) {
    return cn(BASE, VARIANTS[variant], SIZES[size], variant === "quiet" && !iconOnly && "px-2.5", iconOnly && ICON_SIZES[size]);
}

interface CommonProps {
    variant?: ButtonVariant;
    size?: ButtonSize;
    /** A square button holding one icon; give it an aria-label. */
    iconOnly?: boolean;
    className?: string;
    children?: ReactNode;
}

type LinkButtonProps = CommonProps & { href: string; prefetch?: false } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "className" | "children">;
type PlainButtonProps = CommonProps & { href?: undefined } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">;

export type ButtonProps = LinkButtonProps | PlainButtonProps;

/**
 * primary · secondary · quiet, in sm · md · lg. With `href` it renders a link.
 * Server-safe; pass event handlers only from a client component.
 */
export function Button({ variant, size, iconOnly, className, children, ...props }: ButtonProps) {
    const cls = cn(buttonClass({ variant, size, iconOnly }), className);
    if (typeof props.href === "string") {
        const { href, prefetch, ...rest } = props as Omit<LinkButtonProps, keyof CommonProps>;
        return (
            <Link href={href} prefetch={prefetch} className={cls} {...rest}>
                {children}
            </Link>
        );
    }
    const { type = "button", ...rest } = props as Omit<PlainButtonProps, keyof CommonProps | "href">;
    return (
        <button type={type} className={cls} {...rest}>
            {children}
        </button>
    );
}
