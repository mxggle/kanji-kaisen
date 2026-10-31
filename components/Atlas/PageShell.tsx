import { cn } from "@/lib/utils";

/**
 * Page container: 1200px wide with 40px sides (16 on phones). The header is in
 * the flow, so templates (AtlasPath, Tool) set their own top space. `style`
 * can carry themeVars().
 */
export function PageShell({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
    return <div className={cn("mx-auto w-full max-w-[1200px] px-4 pb-16 text-ink sm:px-10 print:pt-0", className)} style={style}>{children}</div>;
}
