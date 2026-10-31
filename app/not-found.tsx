import Link from "next/link";
import { PageShell } from "@/components/Atlas/PageShell";

// Token-styled 404 so both skins apply (Next's default page sets its own colours).
export default function NotFound() {
    return (
        <PageShell className="text-center space-y-6">
            <p lang="ja" className="font-jp text-8xl text-ink-3" aria-hidden>無</p>
            <h1 className="font-disp text-4xl font-bold">Page not found</h1>
            <p className="text-ink-2">This page doesn&apos;t exist. Try searching for a kanji instead.</p>
            <div className="flex flex-wrap justify-center gap-3">
                <Link href="/" className="px-5 py-2 rounded-full bg-ink text-bg font-bold">Go to Learn</Link>
                <Link href="/search" className="px-5 py-2 rounded-full border border-line-2 hover:border-ink">Search</Link>
            </div>
        </PageShell>
    );
}
