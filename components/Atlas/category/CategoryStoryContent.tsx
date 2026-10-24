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
                    <H className="text-lg font-semibold text-white">About This Theme</H>
                </div>
                <p className="text-white/70 leading-relaxed">{story.description}</p>
            </section>

            {story.whyItMatters && (
                <section className={`p-5 rounded-2xl border bg-gradient-to-br from-white/5 to-transparent ${borderClass}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={18} className={colorClass} aria-hidden />
                        <H className="text-lg font-semibold text-white">Why This Matters</H>
                    </div>
                    <p className="text-white/70 leading-relaxed">{story.whyItMatters}</p>
                </section>
            )}

            {story.commonPatterns.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ArrowRight size={18} className={colorClass} aria-hidden />
                        <H className="text-lg font-semibold text-white">Common Patterns</H>
                    </div>
                    <ol className="space-y-3">
                        {story.commonPatterns.map((pattern, index) => (
                            <li key={index} className="flex items-start gap-3 p-3 rounded-xl bg-white/5">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center ${bgColorClass} text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
                                    {index + 1}
                                </span>
                                <p className="text-white/70 text-sm leading-relaxed">{pattern}</p>
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            {story.learningTip && (
                <section className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                    <div className="flex items-center gap-2 mb-3">
                        <Lightbulb size={18} className="text-amber-400" aria-hidden />
                        <H className="text-lg font-semibold text-amber-400">Learning Tip</H>
                    </div>
                    <p className="text-white/70 leading-relaxed">{story.learningTip}</p>
                </section>
            )}
        </div>
    );
}
