"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { PLACES, placeFor } from "./places";
import { usePlaceMarker } from "./usePlaceMarker";

/**
 * Phones: the four places at the bottom (学 Learn · 探 Browse · 墨 My list · 教 Teach).
 * A short mark on the bar's top line sits over the current place and slides
 * to the next one, like the header's underline; a press sinks the glyph.
 */
export function TabBar() {
    const place = placeFor(usePathname());
    const nav = useRef<HTMLElement>(null);
    usePlaceMarker(nav, place);
    return (
        <nav
            ref={nav}
            aria-label="Main"
            data-chrome
            className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(76px+env(safe-area-inset-bottom))] grid-cols-4 border-t border-line bg-[rgba(var(--shade),.94)] px-2 pt-1.5 pb-[calc(18px+env(safe-area-inset-bottom))] backdrop-blur-[10px] lg:hidden print:hidden"
        >
            {PLACES.map((item) => (
                <Link
                    key={item.place}
                    href={item.href}
                    data-place={item.place}
                    aria-current={item.place === place ? "page" : undefined}
                    className="group relative flex flex-col items-center justify-center gap-[3px] rounded-xl text-[11px] text-ink-3 transition-colors duration-(--dur-ui) hover:text-ink aria-[current=page]:text-ink"
                >
                    {/* On the bar's top line: the link starts 6px of padding and the 1px border below it. */}
                    <span
                        aria-hidden
                        data-place-marker=""
                        className="pointer-events-none absolute inset-x-0 -top-[7px] mx-auto h-0.5 w-7 origin-left bg-ink opacity-0 group-aria-[current=page]:opacity-100"
                    />
                    <span
                        lang="ja"
                        aria-hidden
                        className="font-jp text-xl font-extrabold leading-none transition-[scale] duration-(--dur-ui) ease-(--ease-out) group-active:scale-[.86] group-active:duration-(--dur-micro) motion-reduce:transition-none"
                    >
                        {item.jp}
                    </span>
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
