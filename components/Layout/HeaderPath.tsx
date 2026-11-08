"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { InkPaint } from "@/components/Ink/InkPaint";

/** The phone header's slot for the compact atlas path (rendered by SiteHeader). */
export const HEADER_PATH_ID = "header-path";

const subscribe = () => () => {};

/**
 * Puts the compact atlas path into the phone header once mounted. It sits
 * outside the page's <InkPaint>, so it brings its own for the radical seal.
 */
export function HeaderPath({ children }: { children: ReactNode }) {
    const slot = useSyncExternalStore(
        subscribe,
        () => document.getElementById(HEADER_PATH_ID),
        () => null,
    );
    return slot ? createPortal(<InkPaint className="contents">{children}</InkPaint>, slot) : null;
}
