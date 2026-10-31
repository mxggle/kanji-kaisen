import type { Metadata } from "next";
import { Suspense } from "react";
import { WorksheetClient } from "@/components/Teach/WorksheetClient";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
    title: "Kanji worksheet",
    description: "A printable kanji worksheet with stroke order, tracing cells and practice grids.",
    robots: { index: false, follow: false },
};

// The set lives in the query string, so the page is a static shell and the
// worksheet is built in the browser.
export default function PrintPage() {
    return (
        <Suspense fallback={<div data-skin="ink" className="min-h-screen bg-bg" aria-busy="true" />}>
            <WorksheetClient siteHost={SITE_URL.replace(/^https?:\/\//, "")} />
        </Suspense>
    );
}
