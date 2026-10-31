import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Page container: 1200px wide with 40px sides (16 on phones). The header is in
 * the flow, so templates (AtlasPath, Tool) set their own top space. `style`
 * can carry themeVars().
 */
export function PageShell({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return <div className={cn("mx-auto w-full max-w-[1200px] px-4 pb-16 text-ink sm:px-10 print:pt-0", className)} style={style}>{children}</div>;
}

export interface Crumb {
    href?: string;
    label: string;
}

/** Deprecated: atlas pages use components/Layout/AtlasPath. */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" className="pt-6 mb-6 text-sm text-ink-3">
            <ol className="flex flex-wrap items-center gap-1">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight size={14} className="text-ink-3" aria-hidden />}
                        {item.href ? (
                            <Link href={item.href} className="hover:text-ink transition-colors">{item.label}</Link>
                        ) : (
                            <span className="text-ink" aria-current="page">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

/** Deprecated: use components/ui/SectionHeader. */
export function Section({ title, children, className, id }: { title: string; children: React.ReactNode; className?: string; id?: string }) {
    return (
        <section id={id} className={cn("mt-10", className)}>
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            {children}
        </section>
    );
}
