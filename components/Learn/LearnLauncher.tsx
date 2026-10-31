"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { closeLearn, forgetLearnEntry, useLearnOpen } from "./learn-hash";
import type { LearnData } from "./types";

// The layer's code (and kanji-recognizer, deeper still) loads only when it opens.
const LearnLayer = dynamic(() => import("./LearnLayer").then((m) => m.LearnLayer), {
    ssr: false,
    loading: () => <div className="fixed inset-0 z-[70] bg-bg" aria-hidden />,
});

/** Mounts the #learn layer for one kanji while the URL hash is #learn. */
export function LearnLauncher({ data }: { data: LearnData }) {
    const open = useLearnOpen();

    // A new kanji page starts without a pushed #learn entry of its own.
    useEffect(() => () => forgetLearnEntry(), [data.char]);

    if (!open) return null;
    return createPortal(<LearnLayer data={data} onClose={() => closeLearn(data.char)} />, document.body);
}
