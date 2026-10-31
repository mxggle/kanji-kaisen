import type { Metadata } from "next";
import { Suspense } from "react";
import { ProjectorClient } from "@/components/Teach/ProjectorClient";
import { getTeachRadicals } from "@/components/Teach/server";

export const metadata: Metadata = {
    title: "Present kanji",
    description: "Projector mode: one kanji at a time, a stroke per key press, and a quiz for the class.",
    robots: { index: false, follow: false },
};

// The set lives in the query string, so the page is a static shell. Radicals
// (with their kanji) give the radical highlight and the theme colour.
export default function PresentPage() {
    return (
        <Suspense fallback={<div className="fixed inset-0 z-[70] bg-bg" aria-busy="true" />}>
            <ProjectorClient radicals={getTeachRadicals()} />
        </Suspense>
    );
}
