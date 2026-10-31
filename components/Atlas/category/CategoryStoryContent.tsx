import { BookOpen, Sparkles, Lightbulb, ArrowRight } from "lucide-react";
import type { CategoryStoryData } from "@/lib/atlas/types";

type StoryText = Pick<CategoryStoryData, "description" | "whyItMatters" | "learningTip" | "commonPatterns">;

interface CategoryStoryContentProps {
    story: StoryText;
    /** "text-… border-… bg-…" theme triple (see getThemeClass). */
    themeClass: string;
    headingAs?: "h2" | "h3";
}

/**
 * The body of a theme story (description, why it matters, patterns, tip).
 * Hook-free: rendered inline on /category/[slug] and inside CategoryStoryModal.
 */
export function CategoryStoryContent({ story, themeClass, headingAs: H = "h3" }: CategoryStoryContentProps) {
    const [colorClass, borderClass] = themeClass.split(" ");
    const bgColorClass = colorClass.replace("text-", "bg-").replace("-400", "-500");

    return (
        <div className="space-y-8">
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={18} className={colorClass} aria-hidden />
                    <H className="text-lg font-semibold text-ink">About This Theme</H>
                </div>
                <p className="text-ink-2 leading-relaxed">{story.description}</p>
            </section>

            {story.whyItMatters && (
                <section className={`p-5 rounded-2xl border bg-gradient-to-br from-ink/5 to-transparent ${borderClass}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={18} className={colorClass} aria-hidden />
                        <H className="text-lg font-semibold text-ink">Why This Matters</H>
                    </div>
                    <p className="text-ink-2 leading-relaxed">{story.whyItMatters}</p>
                </section>
            )}

            {story.commonPatterns.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ArrowRight size={18} className={colorClass} aria-hidden />
                        <H className="text-lg font-semibold text-ink">Common Patterns</H>
                    </div>
                    <ol className="space-y-3">
                        {story.commonPatterns.map((pattern, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-card">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${bgColorClass} text-onacc text-xs font-bold flex-shrink-0 mt-0.5`}>
                                    {index + 1}
                                </span>
                                <p className="text-ink-2 text-sm leading-relaxed">{pattern}</p>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {story.learningTip && (
                <section className="p-5 rounded-2xl bg-tip/10 border border-tip/30">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb size={18} className="text-tip" aria-hidden />
                        <H className="text-lg font-semibold text-tip">Learning Tip</H>
                    </div>
                    <p className="text-ink-2 leading-relaxed">{story.learningTip}</p>
                </section>
            )}
        </div>
    );
}
