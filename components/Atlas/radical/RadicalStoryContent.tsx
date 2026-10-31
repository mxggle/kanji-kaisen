import Link from "next/link";
import { Sparkles, MapPin, PenTool, ArrowRight } from "lucide-react";
import { kanjiPath } from "@/lib/atlas/paths";
import { usableExamples } from "@/components/Journey/radical";

export { usableExamples };

export interface RadicalExample {
    char: string;
    meaning: string;
    explanation: string;
    /** True when the kanji has an atlas page; such examples become links. */
    exists?: boolean;
}

export interface RadicalStoryText {
    origin: string;
    story: string;
    position: string;
    transformsMeaning: string;
    exampleKanji?: RadicalExample[];
}

interface RadicalStoryContentProps {
    story: RadicalStoryText;
    /** "text-… border-… bg-…" theme triple (see getThemeClass). */
    themeClass: string;
    headingAs?: "h2" | "h3";
}

/**
 * The body of a radical story (memory story, position, meaning, examples).
 * Hook-free: rendered inside RadicalStoryModal (classic practice). The
 * story's `origin` text is unsourced, so it sits under "Memory story" with
 * the mnemonic; sourced origins live on /radical/[key].
 */
export function RadicalStoryContent({ story, themeClass, headingAs: H = "h3" }: RadicalStoryContentProps) {
    const [colorClass, borderClass] = themeClass.split(" ");
    const bgColorClass = colorClass.replace("text-", "bg-").replace("-400", "-500");
    const examples = usableExamples(story.exampleKanji);

    return (
        <div className="space-y-8">
            {(story.story || story.origin) && (
                <section className={`p-5 rounded-2xl border bg-gradient-to-br from-ink/5 to-transparent ${borderClass}`}>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 mb-3">
                        <Sparkles size={18} className={`${colorClass} self-center`} aria-hidden />
                        <H className="text-lg font-semibold text-ink">Memory story</H>
                        <span className="text-xs text-ink-3">A mnemonic, not a history</span>
                    </div>
                    {story.story && <p className="type-story">&ldquo;{story.story}&rdquo;</p>}
                    {story.origin && <p className={`text-ink-2 leading-relaxed text-sm${story.story ? " mt-3" : ""}`}>{story.origin}</p>}
                </section>
            )}

            {story.position && (
                <section className="flex items-start gap-4 p-4 rounded-xl bg-card">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColorClass} flex-shrink-0`}>
                        <MapPin size={20} className="text-onacc" aria-hidden />
                    </div>
                    <div>
                        <H className="text-ink font-medium mb-1">Where It Appears</H>
                        <p className="text-ink-2 text-sm">{story.position}</p>
                    </div>
                </section>
            )}

            {story.transformsMeaning && (
                <section className="flex items-start gap-4 p-4 rounded-xl bg-card">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColorClass} flex-shrink-0`}>
                        <PenTool size={20} className="text-onacc" aria-hidden />
                    </div>
                    <div>
                        <H className="text-ink font-medium mb-1">How It Changes Meaning</H>
                        <p className="text-ink-2 text-sm">{story.transformsMeaning}</p>
                    </div>
                </section>
            )}

            {examples.length > 0 && (
                <section>
                    <H className="text-lg font-semibold text-ink mb-4">Example Kanji</H>
                    <ul className="space-y-3">
                        {examples.map((example, index) => {
                            const body = (
                                <>
                                    <span className={`w-14 h-14 rounded-xl flex items-center justify-center bg-bg/30 border ${borderClass} flex-shrink-0`}>
                                        <span className="text-3xl font-japanese text-ink">{example.char}</span>
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="flex flex-wrap items-center gap-x-2 mb-1">
                                            <span className={`font-bold font-japanese ${colorClass}`}>{example.char}</span>
                                            <span className="text-ink-2" aria-hidden>•</span>
                                            <span className="text-ink">{example.meaning}</span>
                                        </span>
                                        <span className="block text-ink-3 text-sm">{example.explanation}</span>
                                    </span>
                                    {example.exists && (
                                        <ArrowRight size={18} className="text-ink-3 group-hover:text-[var(--classic-accent)] flex-shrink-0 transition-colors" aria-hidden />
                                    )}
                                </>
                            );
                            const rowClass = "group flex items-center gap-4 p-4 rounded-xl bg-card border border-line hover:bg-ink/10 transition-colors";
                            return (
                                <li key={index}>
                                    {example.exists ? (
                                        <Link href={kanjiPath(example.char)} className={`${rowClass} hover:border-[var(--classic-accent)]`}>
                                            {body}
                                        </Link>
                                    ) : (
                                        <div className={rowClass}>{body}</div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}
        </div>
    );
}
