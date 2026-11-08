import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/Atlas/PageShell";
import { KindLabel, SectionHeader } from "@/components/ui/SectionHeader";
import { enterOrder } from "@/components/Motion/tokens";

/** A link inside running text: ink with an underline, never a colour. */
export const PROSE_LINK = "text-ink underline decoration-line-2 underline-offset-[3px] transition-colors hover:decoration-ink";

interface DocumentPageProps {
    jp: string;
    kind: string;
    title: ReactNode;
    lede?: ReactNode;
    children: ReactNode;
    /** Width of the column; 680px reads best, wide tables may need more. */
    wide?: boolean;
    className?: string;
}

/**
 * The document template (about, credits, settings, 404): kind label, title and
 * lede, then sections in a 680px measure. The kind label fades in, the title
 * soaks in, the lede rises; each section rises as it scrolls into view.
 * Server-safe.
 */
export function DocumentPage({ jp, kind, title, lede, children, wide, className }: DocumentPageProps) {
    return (
        <PageShell className="pt-8 sm:pt-10">
            <article className={cn("flex flex-col gap-14", wide ? "max-w-[960px]" : "max-w-[680px]", className)}>
                <header className="flex max-w-[680px] flex-col gap-3">
                    <KindLabel jp={jp} data-enter="fade">
                        {kind}
                    </KindLabel>
                    <h1 data-enter="ink" style={enterOrder(1)} className="type-title">
                        {title}
                    </h1>
                    {lede && (
                        <div data-enter="rise" style={enterOrder(3)} className="text-lg leading-relaxed text-ink-2">
                            {lede}
                        </div>
                    )}
                </header>
                {children}
            </article>
        </PageShell>
    );
}

/**
 * A section of a document: SectionHeader, then body text at 16px. It rises as
 * it scrolls into view (data-reveal), so don't put reveal hooks inside it.
 */
export function DocumentSection({ jp, title, id, children, className }: { jp: string; title: ReactNode; id?: string; children: ReactNode; className?: string }) {
    return (
        <section data-reveal="rise" aria-labelledby={id} className={cn("flex flex-col gap-4 text-base leading-relaxed text-ink-2", className)}>
            <SectionHeader jp={jp} title={title} id={id} />
            {children}
        </section>
    );
}
