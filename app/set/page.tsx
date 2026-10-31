import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/Atlas/PageShell";
import { SetClient } from "@/components/Teach/SetClient";

export const metadata: Metadata = {
    title: "Kanji set",
    description: "A shared kanji set: open each kanji, study the set with flashcards or a quiz, print or present it. No account needed.",
    robots: { index: false, follow: true },
};

// The set lives in the query string (no backend), so this is a static shell.
export default function SetPage() {
    return (
        <PageShell>
            <Suspense fallback={<p className="py-10 text-ink-3">Loading the set…</p>}>
                <SetClient />
            </Suspense>
        </PageShell>
    );
}
