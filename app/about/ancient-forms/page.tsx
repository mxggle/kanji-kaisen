import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, PageShell } from "@/components/Atlas/PageShell";
import { getAncientFormCredits } from "@/lib/story";

export const metadata: Metadata = {
    title: "Ancient form credits",
    description:
        "Every oracle bone, bronze and seal form shown on Kanji Kaisen, with its Wikimedia Commons file or Academia Sinica 小學堂 glyph, author and licence.",
    alternates: { canonical: "/about/ancient-forms" },
};

const STAGE_LABEL: Record<string, string> = { oracle: "Oracle bone", bronze: "Bronze", seal: "Seal" };
const XIAOXUE_LICENSE_URL = "https://xiaoxue.iis.sinica.edu.tw/License/License";
const LINK = "text-[var(--accent)] hover:underline";

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
    const stageOrder = Object.keys(STAGE_LABEL);
    for (const list of byChar.values()) list.sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));
    const chars = [...byChar.keys()].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!);
    const xiaoxueCount = files.filter((f) => f.provider === "xiaoxue").length;

    return (
        <PageShell className="max-w-4xl">
            <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/about", label: "About" }, { label: "Ancient form credits" }]} />
            <h1 className="font-disp text-4xl font-bold mb-4">Ancient form credits</h1>
            <p className="text-ink-2 leading-relaxed">
                The oracle bone, bronze and seal forms in the journeys come from two sources. The first is the{" "}
                <a href="https://commons.wikimedia.org/wiki/Commons:Ancient_Chinese_characters_project" target="_blank" rel="noopener noreferrer" className={LINK}>
                    Ancient Chinese characters project
                </a>{" "}
                on Wikimedia Commons. We use only files in the public domain and CC0 tracings from Academia Sinica 小學堂, and we
                leave out every file sourced from Richard Sears. Where Commons has no such file for a stage, we take the glyph
                directly from Academia Sinica&apos;s{" "}
                <a href="https://xiaoxue.iis.sinica.edu.tw/yanbian" target="_blank" rel="noopener noreferrer" className={LINK} lang="zh-Hant">
                    小學堂 字形演變
                </a>{" "}
                database, whose glyph images and glyph data are released under CC0 1.0 (
                <a href={XIAOXUE_LICENSE_URL} target="_blank" rel="noopener noreferrer" className={`${LINK} break-all`}>
                    {XIAOXUE_LICENSE_URL}
                </a>
                ). Commons files are shown as they are, recoloured; 小學堂 glyphs are cropped, made transparent and recoloured.
                Neither is ever redrawn. Where neither source has a form, no ancient form is shown.{" "}
                {files.length.toLocaleString("en")} files for {chars.length.toLocaleString("en")} characters are listed below,{" "}
                {xiaoxueCount.toLocaleString("en")} of them from 小學堂.
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
                            <th scope="col" className="px-3 py-2 font-medium">File and author</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chars.flatMap((char) =>
                            byChar.get(char)!.map((file, i) => (
                                <tr key={file.name} className="border-t border-line align-top">
                                    <td className="px-3 py-2 font-jp text-lg" lang="zh-Hant">{i === 0 ? char : ""}</td>
                                    <td className="px-3 py-2 text-ink-2">{STAGE_LABEL[file.stage] ?? file.stage}</td>
                                    <td className="px-3 py-2 text-ink-2">{file.license === "CC0" ? "CC0" : "Public domain"}</td>
                                    <td className="px-3 py-2 text-ink-3">
                                        {file.source ?? "—"}
                                        {file.ref && <span className="block" lang="zh-Hant">{file.ref}</span>}
                                    </td>
                                    <td className="px-3 py-2">
                                        {file.provider === "xiaoxue" ? (
                                            <>
                                                <a href={file.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                                                    <span lang="zh-Hant">小學堂 字形演變: {file.char}</span>
                                                </a>
                                                {file.imageUrl && (
                                                    <>
                                                        {" · "}
                                                        <a href={file.imageUrl} target="_blank" rel="noopener noreferrer" className={LINK}>
                                                            glyph image
                                                        </a>
                                                    </>
                                                )}
                                            </>
                                        ) : (
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className={`${LINK} break-all`}>
                                                {file.name}
                                            </a>
                                        )}
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
