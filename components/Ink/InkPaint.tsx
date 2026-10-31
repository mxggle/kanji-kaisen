"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getShade, paintedPercent, themeProgress, type InkEntries } from "@/lib/ink";
import { useInkHydrated, useInkStore } from "@/lib/ink-store";
import { paintCaption, sealShade } from "@/lib/ink-paint";

function setAttr(el: HTMLElement, name: string, value: string) {
    if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

/** Fills every tile, seal and painted bar under `root` from the entries. Writes only what changed. */
function paint(root: HTMLElement, entries: InkEntries) {
    for (const el of root.querySelectorAll<HTMLElement>("[data-kanji]")) {
        setAttr(el, "data-ink", String(getShade(entries, el.dataset.kanji ?? "")));
    }
    for (const el of root.querySelectorAll<HTMLElement>("[data-radical-chars]")) {
        const shades = Array.from(el.dataset.radicalChars ?? "", (char) => getShade(entries, char));
        setAttr(el, "data-ink", String(sealShade(shades)));
    }
    for (const el of root.querySelectorAll<HTMLElement>("[data-paint-chars]")) {
        const progress = themeProgress(entries, Array.from(el.dataset.paintChars ?? ""));
        const width = `${paintedPercent(progress.painted)}%`;
        if (el.style.getPropertyValue("--painted") !== width) el.style.setProperty("--painted", width);
        const caption = el.querySelector<HTMLElement>("[data-paint-caption]");
        const text = paintCaption(progress);
        if (caption && caption.textContent !== text) caption.textContent = text;
    }
}

/**
 * The page's one ink island. Tiles (data-kanji), seals (data-radical-chars)
 * and painted bars (data-paint-chars) stay server-rendered at "not met"; once
 * the ink store hydrates, and on every change to it, this fills them in. It
 * also repaints content a client component adds later (e.g. "Show more").
 */
export function InkPaint({ children, className }: { children: ReactNode; className?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const hydrated = useInkHydrated();
    const entries = useInkStore((state) => state.entries);

    useEffect(() => {
        const root = ref.current;
        if (!hydrated || !root) return;
        paint(root, entries);
        let frame = 0;
        const observer = new MutationObserver(() => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => paint(root, entries));
        });
        observer.observe(root, { childList: true, subtree: true });
        return () => {
            observer.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [hydrated, entries]);

    return (
        <div ref={ref} className={cn("contents", className)}>
            {children}
        </div>
    );
}
