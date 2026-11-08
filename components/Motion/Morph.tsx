import { ViewTransition, type ReactNode } from "react";

/** A CSS-ident-safe piece: ASCII letters, digits and "-" kept, anything else as its code point. */
function ident(value: string): string {
    return Array.from(value)
        .map((ch) => (/[a-zA-Z0-9-]/.test(ch) ? ch : `_${(ch.codePointAt(0) ?? 0).toString(16)}`))
        .join("");
}

/**
 * Shared-element names. The same name on two pages makes the element fly from
 * one to the other on navigation. A name must be on at most ONE mounted
 * element per page: a duplicate makes the browser skip the whole transition.
 */
export const morphName = {
    /** A kanji's glyph: tile → kanji page hero. */
    kanji: (char: string) => `kk-k${ident(char)}`,
    /** A radical's seal: seal → radical page. */
    radical: (key: string) => `kk-r-${ident(key)}`,
    /** A theme's art: gate → theme page. */
    theme: (slug: string) => `kk-t-${ident(slug)}`,
};

/**
 * Marks its child (one DOM element) as a shared element. Only flies when a
 * matching name is on the page being left or opened; otherwise it is part of
 * the page like anything else. Server-safe.
 *
 * Off (renders the child as is) when `name` is undefined, so lists can opt in
 * per item.
 */
export function Morph({ name, children }: { name: string | undefined | false; children: ReactNode }) {
    if (!name) return <>{children}</>;
    return (
        <ViewTransition name={name} share="kk-morph" enter="none" exit="none" update="none" default="none">
            {children}
        </ViewTransition>
    );
}
