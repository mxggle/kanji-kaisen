"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

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

/** Segmented tabs (role="tablist"), with arrow-key, Home and End navigation. */
export function Tabs<T extends string>({ items, value, onChange, label, id, className }: TabsProps<T>) {
    const refs = useRef<(HTMLButtonElement | null)[]>([]);
    const enabled = items.filter((item) => !item.disabled);

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

    return (
        <div
            role="tablist"
            aria-label={label}
            onKeyDown={onKeyDown}
            className={cn("inline-flex w-fit max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-bg p-1", className)}
        >
            {items.map((item, i) => {
                const selected = item.value === value;
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
                            "inline-flex h-9 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors",
                            "focus-visible:outline-offset-[-2px] disabled:cursor-not-allowed disabled:opacity-50",
                            selected ? "bg-ink text-bg" : "text-ink-2 hover:text-ink",
                            item.live && "live",
                            item.className,
                        )}
                    >
                        {item.jp && (
                            <span lang="ja" aria-hidden className="font-jp text-[15px]">
                                {item.jp}
                            </span>
                        )}
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
