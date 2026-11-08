"use client";

import { ViewTransition, useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Page change: the old page drifts up and fades, the new one rises in
 * (app/motion.css, .kk-page-out / .kk-page-in). Keyed by pathname, so a new
 * path is an exit + enter while query changes (Browse filters, search) don't
 * animate the page. Named <Morph> elements inside fly between the two pages.
 *
 * React runs it only for navigations (they are transitions), never on the
 * first load, and browsers without View Transitions just swap the page.
 */
export function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const firstPath = useRef(pathname);
    // The site intro's --intro-wait holds only the first page's entrance (see
    // components/Motion/script.ts). A page opened during or just after the
    // intro must not wait behind it, so drop it before that page paints.
    useLayoutEffect(() => {
        if (pathname !== firstPath.current) document.documentElement.style.removeProperty("--intro-wait");
    }, [pathname]);
    return (
        <ViewTransition key={pathname} enter="kk-page-in" exit="kk-page-out" update="none" default="none">
            <div data-page="">{children}</div>
        </ViewTransition>
    );
}
