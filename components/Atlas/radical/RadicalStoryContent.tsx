import Link from "next/link";
import { Sparkles, MapPin, BookOpen, PenTool, ArrowRight } from "lucide-react";
import { kanjiPath } from "@/lib/atlas/paths";

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

export function usableExamples(examples: RadicalExample[] = []): RadicalExample[] {
    return examples.filter(
        (ex) =>
            ex.char &&
            ex.char !== "?" &&
            ex.char !== "undefined" &&
            ex.meaning &&
            ex.meaning !== "example" &&
            ex.meaning !== "undefined",
    );
}

/**
 * The body of a radical story (origin, mnemonic, position, meaning, examples).
 * Hook-free: rendered inline on /radical/[key] and inside RadicalStoryModal.
 */
export function RadicalStoryContent({ story, themeClass, headingAs: H = "h3" }: RadicalStoryContentProps) {
    const [colorClass, borderClass] = themeClass.split(" ");
    const bgColorClass = colorClass.replace("text-", "bg-").replace("-400", "-500");
    const examples = usableExamples(story.exampleKanji);

    return (
        <div className="space-y-8">
            {story.origin && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <BookOpen size={18} className={colorClass} aria-hidden />
                        <H className="text-lg font-semibold text-white">Origin</H>
                    </div>
                    <p className="text-white/70 leading-relaxed">{story.origin}</p>
                </section>
            )}

            {story.story && (
                <section className={`p-5 rounded-2xl border bg-gradient-to-br from-white/5 to-transparent ${borderClass}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={18} className={colorClass} aria-hidden />
                        <H className="text-lg font-semibold text-white">The Story</H>
                    </div>
                    <p className="text-white/80 leading-relaxed text-lg italic">&ldquo;{story.story}&rdquo;</p>
                </section>
            )}

            {story.position && (
                <section className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColorClass} flex-shrink-0`}>
                        <MapPin size={20} className="text-white" aria-hidden />
                    </div>
                    <div>
                        <H className="text-white font-medium mb-1">Where It Appears</H>
                        <p className="text-white/60 text-sm">{story.position}</p>
                    </div>
                </section>
            )}

            {story.transformsMeaning && (
                <section className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColorClass} flex-shrink-0`}>
                        <PenTool size={20} className="text-white" aria-hidden />
                    </div>
                    <div>
                        <H className="text-white font-medium mb-1">How It Changes Meaning</H>
                        <p className="text-white/60 text-sm">{story.transformsMeaning}</p>
                    </div>
                </section>
            )}

            {examples.length > 0 && (
                <section>
                    <H className="text-lg font-semibold text-white mb-4">Example Kanji</H>
                    <ul className="space-y-3">
                        {examples.map((example, index) => {
                            const body = (
                                <>
                                    <span className={`w-14 h-14 rounded-xl flex items-center justify-center bg-black/30 border ${borderClass} flex-shrink-0`}>
                                        <span className="text-3xl font-japanese text-white">{example.char}</span>
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="flex flex-wrap items-center gap-x-2 mb-1">
                                            <span className={`font-bold font-japanese ${colorClass}`}>{example.char}</span>
                                            <span className="text-white/60" aria-hidden>•</span>
                                            <span className="text-white/80">{example.meaning}</span>
                                        </span>
                                        <span className="block text-white/50 text-sm">{example.explanation}</span>
                                    </span>
                                    {example.exists && (
                                        <ArrowRight size={18} className="text-white/30 group-hover:text-[var(--accent)] flex-shrink-0 transition-colors" aria-hidden />
                                    )}
                                </>
                            );
                            const rowClass = "group flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors";
                            return (
                                <li key={index}>
                                    {example.exists ? (
                                        <Link href={kanjiPath(example.char)} className={`${rowClass} hover:border-[var(--accent)]`}>
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
