import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Standard atlas page container: clears the fixed header and caps the width. */
export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("max-w-5xl mx-auto w-full px-4 pt-24 pb-16 text-white", className)}>{children}</div>;
}

export interface Crumb {
    href?: string;
    label: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/50">
            <ol className="flex flex-wrap items-center gap-1">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-1">
                        {i > 0 && <ChevronRight size={14} className="text-white/30" aria-hidden />}
                        {item.href ? (
                            <Link href={item.href} className="hover:text-[var(--accent)] transition-colors">{item.label}</Link>
                        ) : (
                            <span className="text-white/80" aria-current="page">{item.label}</span>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export function Section({ title, children, className, id }: { title: string; children: React.ReactNode; className?: string; id?: string }) {
    return (
        <section id={id} className={cn("mt-10", className)}>
            <h2 className="text-xl font-bold mb-4">{title}</h2>
            {children}
        </section>
    );
}
