"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { DUR, prefersReducedMotion } from "@/components/Motion/tokens";
import styles from "./Tabs.module.css";

export interface TabItem<T extends string> {
    value: T;
    label: ReactNode;
    /** Japanese mark before the label (形, 筆, 古). */
    jp?: string;
    /** The current learn step lights up (rule 5, 夜 only). */
    live?: boolean;
    disabled?: boolean;
    /** Extra classes for this tab, e.g. to show it at one breakpoint only. */
    className?: string;
}

interface TabsProps<T extends string> {
    items: readonly TabItem<T>[];
    value: T;
    onChange: (value: T) => void;
    /** Accessible name of the tab list. */
    label: string;
    /** Prefix for tab and panel ids; panels use tabPanelId(id, value) and aria-labelledby tabId(id, value). */
    id: string;
    className?: string;
}

export const tabId = (id: string, value: string) => `${id}-tab-${value}`;
export const tabPanelId = (id: string, value: string) => `${id}-panel-${value}`;

/**
 * Class for a tab panel's content: it fades in (200ms) when it mounts or is
 * shown again. Put it on the panel, or on an element keyed by the tab value.
 */
export const tabPanelMotion = styles.panel;

/** Where each tab sits in the list (layout px, so ancestors' transforms don't skew it). */
interface Pill {
    w: number;
    h: number;
    tabs: ({ x: number; y: number; w: number; h: number } | null)[];
    clip: string;
    /** Slide to it (a new tab) or jump (a resize). */
    slide: boolean;
    /** A live tab's glow is out while the pill travels and relights as it lands. */
    lit: boolean;
}

const TAB = "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium";

function Label({ item }: { item: TabItem<string> }) {
    return (
        <>
            {item.jp && (
                <span lang="ja" aria-hidden className="font-jp text-[15px]">
                    {item.jp}
                </span>
            )}
            {item.label}
        </>
    );
}

/**
 * Segmented tabs (role="tablist"), with arrow-key, Home and End navigation.
 *
 * The selected tab is one ink pill that slides to the next tab. It lies over
 * the tabs, clipped to the selected one, and carries their labels in --bg, so
 * a label turns exactly where the pill covers it. Until it has measured the
 * tabs (server render, hydration) the selected tab paints its own pill.
 */
export function Tabs<T extends string>({ items, value, onChange, label, id, className }: TabsProps<T>) {
    const listRef = useRef<HTMLDivElement>(null);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const [pill, setPill] = useState<Pill | null>(null);
    const shownFor = useRef<T | null>(null);
    const enabled = items.filter((item) => !item.disabled);
    const at = items.findIndex((item) => item.value === value);
    const shape = items.map((item) => item.value).join("\n");

    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list) return;
        const measure = () => {
            const tab = refs.current[at];
            // Hidden (display: none somewhere above): keep the last pill until it shows again.
            if (!list.clientWidth) return;
            if (!tab || !tab.offsetWidth) {
                setPill(null);
                return;
            }
            const w = list.scrollWidth;
            const h = list.clientHeight;
            const right = w - tab.offsetLeft - tab.offsetWidth;
            const bottom = h - tab.offsetTop - tab.offsetHeight;
            const clip = `inset(${tab.offsetTop}px ${right}px ${bottom}px ${tab.offsetLeft}px round 999px)`;
            const tabs = refs.current.map((el) => (el && el.offsetWidth ? { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight } : null));
            const slide = shownFor.current !== null && shownFor.current !== value && !prefersReducedMotion();
            shownFor.current = value;
            setPill((prev) =>
                prev && !slide && prev.clip === clip && prev.w === w && prev.h === h && JSON.stringify(prev.tabs) === JSON.stringify(tabs)
                    ? prev
                    : { w, h, tabs, clip, slide, lit: !slide && (prev?.lit ?? true) },
            );
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(list);
        refs.current.forEach((el) => el && ro.observe(el));
        return () => ro.disconnect();
    }, [at, value, shape]);

    // The pill has landed: light it again.
    const landed = pill?.lit ?? true;
    useEffect(() => {
        if (landed) return;
        const timer = window.setTimeout(() => setPill((prev) => prev && { ...prev, lit: true }), DUR.ui * 1000);
        return () => window.clearTimeout(timer);
    }, [landed]);

    const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        const at = enabled.findIndex((item) => item.value === value);
        let next = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (at + 1) % enabled.length;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (at - 1 + enabled.length) % enabled.length;
        else if (e.key === "Home") next = 0;
        else if (e.key === "End") next = enabled.length - 1;
        if (next < 0) return;
        e.preventDefault();
        const target = enabled[next];
        onChange(target.value);
        refs.current[items.indexOf(target)]?.focus();
    };

    const liveSelected = !!items[at]?.live;

    return (
        <div
            ref={listRef}
            role="tablist"
            aria-label={label}
            onKeyDown={onKeyDown}
            className={cn("relative inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-bg p-1", className)}
        >
            {items.map((item, i) => {
                const selected = item.value === value;
                // Once the pill is measured it paints the selected look; before that, the tab does.
                const ownPill = selected && !pill;
                return (
                    <button
                        key={item.value}
                        ref={(el) => {
                            refs.current[i] = el;
                        }}
                        type="button"
                        role="tab"
                        id={tabId(id, item.value)}
                        aria-selected={selected}
                        aria-controls={tabPanelId(id, item.value)}
                        tabIndex={selected ? 0 : -1}
                        disabled={item.disabled}
                        onClick={() => onChange(item.value)}
                        className={cn(
                            TAB,
                            "cursor-pointer transition-colors",
                            "focus-visible:outline-offset-[-2px] disabled:cursor-not-allowed disabled:opacity-50",
                            ownPill ? "bg-ink text-bg" : "text-ink-2 hover:text-ink",
                            item.live && (ownPill || !selected) && "live",
                            item.className,
                        )}
                    >
                        <Label item={item} />
                    </button>
                );
            })}
            {pill && (
                <span
                    aria-hidden
                    className={cn("pointer-events-none absolute top-0 left-0", liveSelected && pill.lit && cn("live", pill.slide && styles.relight))}
                    style={{ width: pill.w, height: pill.h }}
                >
                    <span className={cn(styles.ink, pill.slide && styles.slide, "bg-ink text-bg")} style={{ clipPath: pill.clip }}>
                        {items.map((item, i) => {
                            const box = pill.tabs[i];
                            if (!box) return null;
                            return (
                                <span
                                    key={item.value}
                                    className={cn(TAB, "absolute justify-center px-0", item.disabled && "opacity-50")}
                                    style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
                                >
                                    <Label item={item} />
                                </span>
                            );
                        })}
                    </span>
                </span>
            )}
        </div>
    );
}
