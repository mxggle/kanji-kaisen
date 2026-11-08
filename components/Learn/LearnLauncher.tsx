"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/components/Motion/tokens";
import { closeLearn, forgetLearnEntry, useLearnOpen } from "./learn-hash";
import type { LearnData } from "./types";
import styles from "./learn.module.css";

// The layer's code (and kanji-recognizer, deeper still) loads only when it
// opens. Until then the paper fades in on its own (LearnLayer then skips its fade).
const LearnLayer = dynamic(() => import("./LearnLayer").then((m) => m.LearnLayer), {
    ssr: false,
    loading: () => <div data-learn-paper="" className={cn("fixed inset-0 z-[70] bg-bg", styles.paper)} aria-hidden />,
});

/** How long the layer's exit plays (learn.module.css, .leaving) before it unmounts. */
const LEAVE_MS = 200;

/**
 * Mounts the #learn layer for one kanji while the URL hash is #learn, and
 * keeps it a moment after the hash goes so it can play its exit.
 */
export function LearnLauncher({ data }: { data: LearnData }) {
    const open = useLearnOpen();
    // "open", "leaving" (playing its exit) or null (unmounted).
    const [layer, setLayer] = useState<"open" | "leaving" | null>(null);
    // A fresh layer per opening, also when it reopens mid-exit.
    const [run, setRun] = useState(0);

    if (open && layer !== "open") {
        if (layer === "leaving") setRun(run + 1);
        setLayer("open");
    } else if (!open && layer === "open") {
        setLayer(prefersReducedMotion() ? null : "leaving");
    }

    useEffect(() => {
        if (layer !== "leaving") return;
        const timer = window.setTimeout(() => setLayer(null), LEAVE_MS);
        return () => window.clearTimeout(timer);
    }, [layer]);

    // A new kanji page starts without a pushed #learn entry of its own.
    useEffect(() => () => forgetLearnEntry(), [data.char]);

    if (!layer) return null;
    return createPortal(<LearnLayer key={run} data={data} leaving={layer === "leaving"} onClose={() => closeLearn(data.char)} />, document.body);
}
