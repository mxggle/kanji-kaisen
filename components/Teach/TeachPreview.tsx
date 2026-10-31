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
import { QrCode } from "./QrCode";
import { StrokeGlyph } from "./StrokeGlyph";
import { useKanjiStrokes, useTeachWords } from "./useTeachData";
import { Worksheet } from "./Worksheet";
import { BUTTON, BUTTON_MAIN, Segmented, Toggle } from "./ui";

type Tab = "worksheet" | "projector" | "share";

const TABS: { id: Tab; jp: string; label: string }[] = [
    { id: "worksheet", jp: "紙", label: "Worksheet" },
    { id: "projector", jp: "映", label: "Projector" },
    { id: "share", jp: "送", label: "Share" },
];

const PREVIEW_KANJI = 2;

interface TeachPreviewProps {
    chars: string[];
    title: string;
    entries: Map<string, SearchIndexEntry> | null;
    themeOf: (char: string) => string | null;
    origin: string;
    siteHost: string;
}

/** Output side of /teach: the three actions, then Worksheet / Projector / Share previews. */
export function TeachPreview({ chars, title, entries, themeOf, origin, siteHost }: TeachPreviewProps) {
    const [tab, setTab] = useState<Tab>("worksheet");
    const [paper, setPaper] = useState<Paper>("a4");
    const [answerKey, setAnswerKey] = useState(false);
    const [showWords, setShowWords] = useState(true);
    // "selected": the clipboard was blocked and the link is selected for Ctrl+C.
    const [copied, setCopied] = useState<false | "copied" | "selected">(false);
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
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

    const onTabKey = (e: React.KeyboardEvent, i: number) => {
        const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        const target = e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : delta ? (i + delta + TABS.length) % TABS.length : -1;
        if (target < 0) return;
        e.preventDefault();
        setTab(TABS[target].id);
        tabRefs.current[target]?.focus();
    };

    const disabled = "opacity-50 pointer-events-none";

    return (
        <div className="flex flex-col gap-4 min-w-0">
            <div className="flex flex-wrap gap-2">
                <a
                    href={empty ? undefined : printHref}
                    target="_blank"
                    rel="noopener"
                    aria-disabled={empty}
                    className={cn(BUTTON_MAIN, empty && disabled)}
                >
                    <Printer size={18} aria-hidden /> Print or save PDF
                </a>
                <Link href={empty ? "/teach" : presentHref} aria-disabled={empty} className={cn(BUTTON, empty && disabled)}>
                    <MonitorPlay size={18} aria-hidden /> Present full screen
                </Link>
                <button type="button" onClick={copyLink} disabled={empty} className={BUTTON}>
                    {copied === "copied" ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
                    <span aria-live="polite">
                        {copied === "copied" ? "Link copied" : copied === "selected" ? "Link selected: press Ctrl+C" : "Copy link"}
                    </span>
                </button>
            </div>

            <div role="tablist" aria-label="Use the set" className="flex gap-1 border-b border-line overflow-x-auto">
                {TABS.map((t, i) => (
                    <button
                        key={t.id}
                        ref={(el) => {
                            tabRefs.current[i] = el;
                        }}
                        type="button"
                        role="tab"
                        id={`teach-tab-${t.id}`}
                        aria-selected={tab === t.id}
                        aria-controls={`teach-panel-${t.id}`}
                        tabIndex={tab === t.id ? 0 : -1}
                        onClick={() => setTab(t.id)}
                        onKeyDown={(e) => onTabKey(e, i)}
                        className={cn(
                            "h-11 px-4 flex items-center gap-2 border-b-2 text-[15px] whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                            tab === t.id ? "border-accent text-ink" : "border-transparent text-ink-2 hover:text-ink",
                        )}
                    >
                        <span lang="ja" aria-hidden className="font-jp font-extrabold">{t.jp}</span>
                        {t.label}
                    </button>
                ))}
            </div>

            <div role="tabpanel" id={`teach-panel-${tab}`} aria-labelledby={`teach-tab-${tab}`} className="min-w-0">
                {tab === "worksheet" && (
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
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
                            <Toggle checked={answerKey} onChange={setAnswerKey} label="Answer key page" />
                        </div>
                        <WorksheetPreview chars={chars} title={title} entries={entries} showWords={showWords} siteHost={siteHost} />
                    </div>
                )}

                {tab === "projector" && (
                    <div className="flex flex-col gap-3">
                        <ProjectorPreview chars={chars} entries={entries} themeOf={themeOf} />
                        <p className="text-sm text-ink-2 leading-relaxed">
                            Full screen, large type, readable from the back of a room. Space draws one stroke at a time so you can talk
                            through each one; → moves to the next kanji; Q turns it into a quiz with four meanings, and Reveal shows the
                            answer with the radical highlighted.
                        </p>
                        <Link href={empty ? "/teach" : presentHref} aria-disabled={empty} className={cn(BUTTON_MAIN, "self-start", empty && disabled)}>
                            <MonitorPlay size={18} aria-hidden /> Present full screen
                        </Link>
                    </div>
                )}

                {tab === "share" && (
                    <div className="flex flex-col gap-4">
                        <div>
                            <h3 className="font-disp text-2xl font-bold">Share with students</h3>
                            <p className="mt-1 text-sm text-ink-2">
                                They open the link and study the set. No account needed: the set lives in the link itself.
                            </p>
                        </div>
                        {empty ? (
                            <p className="text-sm text-ink-3">Add kanji to get a link.</p>
                        ) : (
                            <div className="flex flex-col sm:flex-row gap-4 sm:items-start">
                                {shareUrl && <QrCode value={shareUrl} label="QR code for the set link" className="w-44 shrink-0 border border-line" />}
                                <div className="flex flex-col gap-2 min-w-0 flex-1">
                                    <label className="flex flex-col gap-1 text-[13px] text-ink-3">
                                        Link
                                        <input
                                            ref={linkRef}
                                            readOnly
                                            value={shareUrl || setPath("set", set)}
                                            onFocus={(e) => e.target.select()}
                                            className="h-11 px-3 rounded-lg border border-line-2 bg-card text-ink text-sm font-medium min-w-0 focus-visible:outline-2 focus-visible:outline-accent"
                                        />
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button type="button" onClick={copyLink} className={cn(BUTTON, "h-9")}>
                                            {copied === "copied" ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />} {copied === "copied" ? "Copied" : "Copy link"}
                                        </button>
                                        <Link href={setPath("set", set)} target="_blank" className={cn(BUTTON, "h-9")}>
                                            <ExternalLink size={16} aria-hidden /> Open the student page
                                        </Link>
                                    </div>
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
        <div data-skin="ink" className="rounded-xl bg-bg border border-line p-3 sm:p-5">
            <div
                role="img"
                aria-label={chars.length ? `Worksheet preview: ${chars.length} kanji` : "Empty worksheet preview"}
                className="mx-auto max-w-[210mm] bg-card text-ink shadow-[0_1px_2px_rgb(0_0_0/.08),0_24px_48px_-24px_rgb(40_30_20/.45)] p-[9mm] [zoom:.55] sm:[zoom:.7]"
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
                            <span lang="ja" className="font-jp font-extrabold text-c glow text-[clamp(4rem,12vw,9rem)] leading-none">{char}</span>
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
