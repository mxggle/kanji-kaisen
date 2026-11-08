// Motion tokens for code that animates from JS (framer-motion, the Web
// Animations API, canvas). They mirror the CSS custom properties in
// app/motion.css; keep the two in step. Spec: docs/design/motion.md.

import type { CSSProperties } from "react";

/** Cubic-bezier control points (framer-motion `ease`, or `cubic-bezier(${x.join()})`). */
export const EASE = {
    /** The house curve: arrives fast, settles slow. */
    out: [0.2, 0.8, 0.2, 1],
    /** Expo-out: ink soaking in. */
    ink: [0.16, 1, 0.3, 1],
    /** Leaving. */
    in: [0.5, 0, 0.75, 0],
    /** Lifts and wipes. */
    inOut: [0.65, 0, 0.35, 1],
    /** A seal pressed: one small overshoot. */
    stamp: [0.34, 1.4, 0.64, 1],
} as const;

/** Seconds (framer-motion). Multiply by 1000 for WAAPI. */
export const DUR = {
    micro: 0.14,
    ui: 0.24,
    enter: 0.56,
    art: 0.9,
    stroke: 0.42,
} as const;

export const STAGGER = 0.055;

/** For things that follow a finger or a layout change (indicators, sheets). Critically damped: no wobble. */
export const SPRING = { type: "spring", stiffness: 520, damping: 42, mass: 0.9 } as const;

export const cssEase = (e: readonly number[]) => `cubic-bezier(${e.join(",")})`;

/**
 * Inline style for a data-enter / data-reveal element: its order in a
 * sequence (--i) and an extra delay in ms. Merges into an existing style.
 *
 *   <h1 data-enter="ink" style={enterOrder(1)}>
 */
export function enterOrder(i: number, delayMs?: number, style?: CSSProperties): CSSProperties {
    return { ...style, "--i": i, ...(delayMs ? { "--delay": `${delayMs}ms` } : null) } as CSSProperties;
}

/** True when the visitor asked for less motion. Client only. */
export function prefersReducedMotion(): boolean {
    return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
