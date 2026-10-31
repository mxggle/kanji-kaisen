import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageShell } from "@/components/Atlas/PageShell";
import { getAncientFormCredits } from "@/lib/story";

export const metadata: Metadata = {
    title: "Ancient form credits",
    description: "Every oracle bone, bronze and seal form shown on Kanji Kaisen, with its Wikimedia Commons file, author and licence.",
    alternates: { canonical: "/about/ancient-forms" },
};

const STAGE_LABEL: Record<string, string> = { oracle: "Oracle bone", bronze: "Bronze", seal: "Seal" };

export default function AncientFormCreditsPage() {
    // Only the files the site hosts and shows (oracle, bronze, seal); the
    // manifest also records other scripts that are never downloaded.
    const files = getAncientFormCredits().filter((f) => f.src);
    const byChar = new Map<string, typeof files>();
    for (const file of files) {
        const list = byChar.get(file.char) ?? [];
        list.push(file);
        byChar.set(file.char, list);
    }
    const chars = [...byChar.keys()].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!);

    return (
        <PageShell className="max-w-4xl">
            <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/about", label: "About" }, { label: "Ancient form credits" }]} />
            <h1 className="font-disp text-4xl font-bold mb-4">Ancient form credits</h1>
            <p className="text-ink-2 leading-relaxed">
                The oracle bone, bronze and seal forms in the journeys come from the{" "}
                <a href="https://commons.wikimedia.org/wiki/Commons:Ancient_Chinese_characters_project" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">
                    Ancient Chinese characters project
                </a>{" "}
                on Wikimedia Commons. We use only files in the public domain and CC0 tracings from Academia Sinica 小學堂, and we
                leave out every file sourced from Richard Sears. The files are shown as they are, recoloured but never redrawn.
                Where no file passes this check, no ancient form is shown. {files.length.toLocaleString("en")} files for{" "}
                {chars.length.toLocaleString("en")} characters are listed below.
            </p>
            <p className="mt-3 text-sm text-ink-3">
                <Link href="/about" className="text-[var(--accent)] hover:underline">All data sources and licences</Link>
            </p>

            <div className="mt-8 overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-sm">
                    <thead className="bg-card text-left text-ink-3">
                        <tr>
                            <th scope="col" className="px-3 py-2 font-medium">Character</th>
                            <th scope="col" className="px-3 py-2 font-medium">Stage</th>
                            <th scope="col" className="px-3 py-2 font-medium">Licence</th>
                            <th scope="col" className="px-3 py-2 font-medium">Source</th>
                            <th scope="col" className="px-3 py-2 font-medium">Commons file and author</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chars.flatMap((char) =>
                            byChar.get(char)!.map((file, i) => (
                                <tr key={file.name} className="border-t border-line align-top">
                                    <td className="px-3 py-2 font-jp text-lg" lang="zh-Hant">{i === 0 ? char : ""}</td>
                                    <td className="px-3 py-2 text-ink-2">{STAGE_LABEL[file.stage] ?? file.stage}</td>
                                    <td className="px-3 py-2 text-ink-2">{file.license === "CC0" ? "CC0" : "Public domain"}</td>
                                    <td className="px-3 py-2 text-ink-3">{file.source ?? "—"}</td>
                                    <td className="px-3 py-2">
                                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline break-all">
                                            {file.name}
                                        </a>
                                        <span className="block text-ink-3">{file.author}</span>
                                    </td>
                                </tr>
                            )),
                        )}
                    </tbody>
                </table>
            </div>
        </PageShell>
    );
}
