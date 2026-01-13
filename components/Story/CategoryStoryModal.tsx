"use client";

import { X, BookOpen, Sparkles, Lightbulb, ArrowRight } from "lucide-react";
import { getCategoryStory, getAllRadicalStories } from "@/lib/story-loader";
import { CHECKPOINTS } from "@/lib/checkpoints";
import { useEffect } from "react";

interface CategoryStoryModalProps {
    category: string;
    onClose: () => void;
    themeClass: string;
}

// Theme icon mapping
const THEME_ICONS: Record<string, string> = {
    "Nature & Elements": "🌿",
    "Human Body & People": "👤",
    "Action & Movement": "🏃",
    "Structures & Home": "🏠",
    "Animals & Wildlife": "🦊",
    "Tools & Weapons": "⚔️",
    "Communication & Thought": "💭",
    "Textiles, Plants & Food": "🌾",
    "States & Attributes": "✨",
    "Time & Sequence": "⏰"
};

export function CategoryStoryModal({ category, onClose, themeClass }: CategoryStoryModalProps) {
    const story = getCategoryStory(category);
    const icon = THEME_ICONS[category] || "📚";

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!story) {
        return null;
    }

    // Get radicals in this category with stories
    const allRadicals = getAllRadicalStories();
    const categoryRadicals = allRadicals.filter(radical => {
        // Find checkpoints that use this radical
        return CHECKPOINTS.some(cp =>
            cp.category === category && cp.radical === radical.char
        );
    });

    // Extract the color from themeClass for styling
    const colorClass = themeClass.split(' ')[0]; // e.g., "text-emerald-400"
    const bgColorClass = colorClass.replace('text-', 'bg-').replace('-400', '-500');

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`
                relative w-full max-w-2xl max-h-[90vh] overflow-y-auto
                bg-zinc-900/95 rounded-3xl border ${themeClass.split(' ')[1]}
                shadow-2xl custom-scrollbar
            `}>
                {/* Header */}
                <div className={`
                    sticky top-0 z-10 p-6 pb-4
                    bg-gradient-to-b from-zinc-900 via-zinc-900 to-transparent
                    border-b border-white/5
                `}>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`
                                w-16 h-16 rounded-2xl flex items-center justify-center
                                bg-white/10 backdrop-blur-md text-4xl
                            `}>
                                {icon}
                            </div>
                            <div>
                                <p className="text-white/40 text-sm uppercase tracking-widest mb-1">
                                    Category Guide
                                </p>
                                <h2 className={`text-2xl font-bold ${colorClass}`}>
                                    {story.title}
                                </h2>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                            <X size={20} className="text-white/60" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 pt-2 space-y-8">
                    {/* Description */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen size={18} className={colorClass} />
                            <h3 className="text-lg font-semibold text-white">About This Category</h3>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            {story.description}
                        </p>
                    </section>

                    {/* Why It Matters */}
                    <section className={`
                        p-5 rounded-2xl border
                        bg-gradient-to-br from-white/5 to-transparent
                        ${themeClass.split(' ')[1]}
                    `}>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={18} className={colorClass} />
                            <h3 className="text-lg font-semibold text-white">Why This Matters</h3>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            {story.whyItMatters}
                        </p>
                    </section>

                    {/* Common Patterns */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <ArrowRight size={18} className={colorClass} />
                            <h3 className="text-lg font-semibold text-white">Common Patterns</h3>
                        </div>
                        <div className="space-y-3">
                            {story.commonPatterns.map((pattern, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
                                >
                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center
                                        ${bgColorClass} text-white text-xs font-bold
                                        flex-shrink-0 mt-0.5
                                    `}>
                                        {index + 1}
                                    </div>
                                    <p className="text-white/70 text-sm leading-relaxed">
                                        {pattern}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Learning Tip */}
                    <section className={`
                        p-5 rounded-2xl
                        bg-amber-500/10 border border-amber-500/30
                    `}>
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb size={18} className="text-amber-400" />
                            <h3 className="text-lg font-semibold text-amber-400">Learning Tip</h3>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            {story.learningTip}
                        </p>
                    </section>

                    {/* Featured Radicals */}
                    {categoryRadicals.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`text-xl ${colorClass}`}>部</span>
                                <h3 className="text-lg font-semibold text-white">Featured Radicals</h3>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {categoryRadicals.slice(0, 6).map((radical) => (
                                    <div
                                        key={radical.key}
                                        className={`
                                            p-4 rounded-xl border bg-white/5
                                            ${themeClass.split(' ')[1]}
                                            hover:bg-white/10 transition-colors
                                        `}
                                    >
                                        <div className="text-3xl font-serif mb-2">{radical.char}</div>
                                        <div className="text-sm text-white font-medium">{radical.name}</div>
                                        <div className="text-xs text-white/50">{radical.meaning}</div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 p-4 bg-gradient-to-t from-zinc-900 to-transparent">
                    <button
                        onClick={onClose}
                        className={`
                            w-full py-3 rounded-xl font-medium
                            ${bgColorClass} text-white
                            hover:opacity-90 transition-opacity
                        `}
                    >
                        Start Learning
                    </button>
                </div>
            </div>
        </div>
    );
}
