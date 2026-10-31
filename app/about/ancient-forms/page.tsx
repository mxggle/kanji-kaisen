import type { Metadata } from "next";
import Link from "next/link";
import { getAncientFormCredits } from "@/lib/story";
import { DocumentPage, PROSE_LINK } from "@/components/Layout/Document";

export const metadata: Metadata = {
    title: "Ancient form credits",
    description:
        "Every oracle bone, bronze and seal form shown on Kanji Kaisen, with its Wikimedia Commons file or Academia Sinica 小學堂 glyph, author and licence.",
    alternates: { canonical: "/about/ancient-forms" },
};

const STAGE_LABEL: Record<string, string> = { oracle: "Oracle bone", bronze: "Bronze", seal: "Seal" };
const XIAOXUE_LICENSE_URL = "https://xiaoxue.iis.sinica.edu.tw/License/License";
const LINK = PROSE_LINK;

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
        <DocumentPage
            jp="古文字"
            kind="About · credits"
            title="Ancient form credits"
            wide
            lede={
            <p className="text-base">
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
            }
        >
            <p className="-mt-8 text-sm text-ink-3">
                <Link href="/about" className={LINK}>All data sources and licences</Link>
            </p>

            <div className="overflow-x-auto rounded-2xl border border-line">
                <table className="w-full text-sm">
                    <thead className="bg-card text-left">
                        <tr>
                            <th scope="col" className="type-label px-3 py-2.5">Character</th>
                            <th scope="col" className="type-label px-3 py-2.5">Stage</th>
                            <th scope="col" className="type-label px-3 py-2.5">Licence</th>
                            <th scope="col" className="type-label px-3 py-2.5">Source</th>
                            <th scope="col" className="type-label px-3 py-2.5">File and author</th>
                        </tr>
                    </thead>
                    <tbody>
                        {chars.flatMap((char) =>
                            byChar.get(char)!.map((file, i) => (
                                <tr key={file.name} className="border-t border-line align-top">
                                    <td className="px-3 py-2 font-jp text-lg font-extrabold" lang="zh-Hant">{i === 0 ? char : ""}</td>
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
        </DocumentPage>
    );
}
