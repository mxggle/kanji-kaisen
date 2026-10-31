"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Check, Copy, ExternalLink, MonitorPlay, Printer } from "lucide-react";
import { getThemeColor } from "@/lib/atlas/categories";
import { formatReading } from "@/lib/atlas/readings";
import type { SearchIndexEntry } from "@/lib/atlas/search-index";
import { trackEvent } from "@/lib/analytics";
import { setPath, type Paper } from "@/lib/teach-set";
import { cn } from "@/lib/utils";
import { Button, buttonClass } from "@/components/ui/Button";
import { Tabs, tabId, tabPanelId } from "@/components/ui/Tabs";
import { QrCode } from "./QrCode";
import { StrokeGlyph } from "./StrokeGlyph";
import { useKanjiStrokes, useTeachWords } from "./useTeachData";
import { Worksheet } from "./Worksheet";
import { Segmented, Toggle } from "./ui";

type Tab = "worksheet" | "projector" | "share";

const TABS = [
    { value: "worksheet", label: "Worksheet" },
    { value: "projector", label: "Projector" },
    { value: "share", label: "Share link" },
] as const;

const TABS_ID = "teach";
const PREVIEW_KANJI = 2;

interface TeachPreviewProps {
    chars: string[];
    title: string;
    entries: Map<string, SearchIndexEntry> | null;
    themeOf: (char: string) => string | null;
    origin: string;
    siteHost: string;
}

/** Output side of /teach: Worksheet / Projector / Share link, each with its own primary action. */
export function TeachPreview({ chars, title, entries, themeOf, origin, siteHost }: TeachPreviewProps) {
    const [tab, setTab] = useState<Tab>("worksheet");
    const [paper, setPaper] = useState<Paper>("a4");
    const [answerKey, setAnswerKey] = useState(false);
    const [showWords, setShowWords] = useState(true);
    // "selected": the clipboard was blocked and the link is selected for Ctrl+C.
    const [copied, setCopied] = useState<false | "copied" | "selected">(false);
    const linkRef = useRef<HTMLInputElement>(null);

    const set = { chars, title };
    const empty = chars.length === 0;
    const printHref = setPath("print", set, { paper, answerKey, words: showWords });
    const presentHref = setPath("present", set);
    const shareUrl = empty || !origin ? "" : `${origin}${setPath("set", set)}`;

    const copyLink = async () => {
        if (empty) return;
        const url = shareUrl || setPath("set", set);
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            // Clipboard blocked: select the link so it can be copied by hand.
            setTab("share");
            requestAnimationFrame(() => linkRef.current?.select());
            setCopied("selected");
            window.setTimeout(() => setCopied(false), 4000);
            return;
        }
        setCopied("copied");
        window.setTimeout(() => setCopied(false), 2000);
        trackEvent("share_link_created", { count: chars.length });
    };

    const off = empty ? "pointer-events-none opacity-50" : undefined;

    return (
        <div className="flex min-w-0 flex-col gap-[18px]">
            <div className="flex flex-wrap items-center gap-3">
                <Tabs id={TABS_ID} label="Use the set" items={TABS} value={tab} onChange={setTab} />
                <span className="flex-1" />
                {tab === "worksheet" && (
                    <a href={empty ? undefined : printHref} target="_blank" rel="noopener" aria-disabled={empty} className={cn(buttonClass({ variant: "primary" }), off)}>
                        <Printer aria-hidden /> Print or save PDF
                    </a>
                )}
                {tab === "projector" && (
                    <Link href={empty ? "/teach" : presentHref} aria-disabled={empty} className={cn(buttonClass({ variant: "primary" }), off)}>
                        <MonitorPlay aria-hidden /> Present full screen
                    </Link>
                )}
                {tab === "share" && (
                    <Button variant="primary" onClick={copyLink} disabled={empty}>
                        {copied === "copied" ? <Check aria-hidden /> : <Copy aria-hidden />}
                        <span aria-live="polite">{copied === "copied" ? "Link copied" : copied === "selected" ? "Link selected: press Ctrl+C" : "Copy link"}</span>
                    </Button>
                )}
            </div>

            <div role="tabpanel" id={tabPanelId(TABS_ID, tab)} aria-labelledby={tabId(TABS_ID, tab)} className="min-w-0">
                {tab === "worksheet" && (
                    <div className="flex flex-col gap-4">
                        <WorksheetPreview chars={chars} title={title} entries={entries} showWords={showWords} siteHost={siteHost} />
                        <div className="flex flex-wrap items-center gap-2">
                            <Segmented
                                label="Paper"
                                value={paper}
                                options={[
                                    { value: "a4", label: "A4" },
                                    { value: "letter", label: "Letter" },
                                ]}
                                onChange={setPaper}
                            />
                            <Toggle checked={showWords} onChange={setShowWords} label="Read these words" />
                            <Toggle checked={answerKey} onChange={setAnswerKey} label="Answer key" />
                        </div>
                    </div>
                )}

                {tab === "projector" && (
                    <div className="flex flex-col gap-3">
                        <ProjectorPreview chars={chars} entries={entries} themeOf={themeOf} />
                        <p className="text-sm leading-relaxed text-ink-2">
                            Full screen, large type, readable from the back of a room. Space draws one stroke at a time so you can talk
                            through each one; → moves to the next kanji; Q turns it into a quiz with four meanings, and Reveal shows the
                            answer with the radical highlighted.
                        </p>
                    </div>
                )}

                {tab === "share" && (
                    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-card px-[22px] py-5">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-[17px] font-bold leading-snug">Anyone with this link can open the set. No account needed.</h3>
                            <p className="text-sm text-ink-2">The set lives in the address itself, so nothing is stored on a server.</p>
                        </div>
                        {empty ? (
                            <p className="text-sm text-ink-3">Add kanji to get a link.</p>
                        ) : (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                                {shareUrl && <QrCode value={shareUrl} label="QR code for the set link" className="w-40 shrink-0 rounded-xl border border-line" />}
                                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                                    <label className="flex flex-col gap-2">
                                        <span className="type-label">Link</span>
                                        <input
                                            ref={linkRef}
                                            readOnly
                                            value={shareUrl || setPath("set", set)}
                                            onFocus={(e) => e.target.select()}
                                            className="h-10 min-w-0 rounded-full border border-line-2 bg-bg px-4 text-sm text-ink focus:border-ink focus:outline-none"
                                        />
                                    </label>
                                    <Button variant="quiet" size="sm" href={setPath("set", set)} target="_blank" className="self-start px-0">
                                        <ExternalLink aria-hidden /> Open the student page
                                    </Button>
                                    <p className="text-xs text-ink-3">Show the QR code on the projector and students can scan it with a phone.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function WorksheetPreview({ chars, title, entries, showWords, siteHost }: { chars: string[]; title: string; entries: Map<string, SearchIndexEntry> | null; showWords: boolean; siteHost: string }) {
    const first = chars.slice(0, PREVIEW_KANJI);
    const strokes = useKanjiStrokes(first);
    const words = useTeachWords(first, showWords);
    const ready = entries !== null && strokes.ready && words.ready;

    return (
        <div data-skin="ink" className="rounded-xl border border-line bg-bg p-3 text-ink sm:p-10">
            <div
                role="img"
                aria-label={chars.length ? `Worksheet preview: ${chars.length} kanji` : "Empty worksheet preview"}
                className="mx-auto max-w-[210mm] border border-line bg-paper p-[9mm] text-ink [zoom:.55] sm:[zoom:.7]"
            >
                {chars.length === 0 ? (
                    <p className="py-[30mm] text-center text-[14pt] text-ink-3">Add kanji to see the worksheet.</p>
                ) : !ready ? (
                    <p className="py-[30mm] text-center text-[14pt] text-ink-3">Preparing the preview…</p>
                ) : (
                    <Worksheet
                        title={title}
                        chars={chars}
                        entries={entries}
                        strokes={strokes.data}
                        words={words.data}
                        showWords={showWords}
                        answerKey={false}
                        siteHost={siteHost}
                        limit={PREVIEW_KANJI}
                    />
                )}
            </div>
        </div>
    );
}

function ProjectorPreview({ chars, entries, themeOf }: { chars: string[]; entries: Map<string, SearchIndexEntry> | null; themeOf: (char: string) => string | null }) {
    const first = chars.slice(0, 1);
    const strokes = useKanjiStrokes(first);
    const char = first[0];
    const entry = char ? entries?.get(char) : undefined;
    const glyph = char ? strokes.data.get(char) : null;

    return (
        <div
            aria-label="Projector preview"
            role="img"
            className="relative w-full aspect-video overflow-hidden rounded-xl border border-line bg-bg text-ink"
            style={{ "--tc": getThemeColor(char ? themeOf(char) : null) } as React.CSSProperties}
        >
            {!char ? (
                <p className="absolute inset-0 flex items-center justify-center text-ink-3">Add kanji to preview the projector.</p>
            ) : (
                <>
                    <div className="absolute left-[7%] top-[12%] w-[38%] h-[70%] flex items-center justify-center">
                        {glyph ? (
                            <StrokeGlyph strokes={glyph.strokes} label={char} strokeWidth={4.4} className="h-full aspect-square" />
                        ) : (
                            <span lang="ja" className="font-jp font-extrabold text-c text-[clamp(4rem,12vw,9rem)] leading-none">{char}</span>
                        )}
                    </div>
                    <div className="absolute left-[52%] right-[5%] top-[16%] flex flex-col gap-[3%]">
                        <p className="font-disp font-bold leading-none text-[clamp(1.4rem,3.4vw,2.8rem)] truncate">{entry?.m.slice(0, 2).join(", ")}</p>
                        <p lang="ja" className="font-jp font-semibold text-[clamp(1rem,2.2vw,1.8rem)] truncate">
                            {entry ? [...entry.on.slice(0, 2), ...entry.kun.slice(0, 2).map(formatReading)].join(" · ") : ""}
                        </p>
                    </div>
                    <p className="absolute left-[4%] right-[4%] bottom-[5%] text-[clamp(.65rem,1.2vw,.85rem)] text-ink-3 truncate">
                        1 / {chars.length} · Space: next stroke · → next kanji · Q: quiz the class
                    </p>
                </>
            )}
        </div>
    );
}
