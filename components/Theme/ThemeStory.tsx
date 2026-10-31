import { Lightbulb } from "lucide-react";
import type { CategoryStoryData } from "@/lib/atlas/types";

/** The theme's story (about, why it matters, patterns, tip), low on the theme page. Server-compatible; needs themeVars() above it. */
export function ThemeStory({ story, name }: { story: CategoryStoryData; name: string }) {
    return (
        <section aria-labelledby="about-theme" className="grid gap-10 border-t border-line pt-10 lg:grid-cols-2 lg:gap-14">
            <div>
                <h2 id="about-theme" className="font-disp text-3xl font-bold lg:text-4xl">About {name}</h2>
                <p className="mt-4 leading-relaxed text-ink-2">{story.description}</p>
                {story.whyItMatters && (
                    <>
                        <h3 className="mt-8 font-disp text-2xl font-bold">Why it matters</h3>
                        <p className="mt-3 leading-relaxed text-ink-2">{story.whyItMatters}</p>
                    </>
                )}
            </div>
            <div>
                {story.commonPatterns.length > 0 && (
                    <>
                        <h3 className="font-disp text-2xl font-bold">Common patterns</h3>
                        <ol className="mt-4 space-y-3">
                            {story.commonPatterns.map((pattern, i) => (
                                <li key={i} className="flex items-start gap-3 rounded-xl border border-line bg-card p-3.5">
                                    <span aria-hidden className="mt-0.5 flex size-6 flex-none items-center justify-center rounded-full bg-c text-xs font-bold text-onacc">
                                        {i + 1}
                                    </span>
                                    <p className="text-sm leading-relaxed text-ink-2">{pattern}</p>
                                </li>
                            ))}
                        </ol>
                    </>
                )}
                {story.learningTip && (
                    <aside aria-labelledby="theme-tip" className="mt-8 rounded-2xl border border-c/40 bg-c/10 p-5">
                        <h3 id="theme-tip" className="flex items-center gap-2 font-disp text-2xl font-bold">
                            <Lightbulb size={20} className="text-c" aria-hidden /> Learning tip
                        </h3>
                        <p className="mt-3 leading-relaxed text-ink-2">{story.learningTip}</p>
                    </aside>
                )}
            </div>
        </section>
    );
}
