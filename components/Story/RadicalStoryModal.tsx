"use client";

import { X, Sparkles, MapPin, BookOpen, PenTool } from "lucide-react";
import { getRadicalStory, getRadicalStoryByChar, RadicalStory } from "@/lib/story-loader";
import { useEffect } from "react";

interface RadicalStoryModalProps {
    radicalKey?: string;
    radicalChar?: string;
    onClose: () => void;
    themeClass: string;
}

export function RadicalStoryModal({ radicalKey, radicalChar, onClose, themeClass }: RadicalStoryModalProps) {
    // Get story by key or by character
    let story: RadicalStory | undefined;
    if (radicalKey) {
        story = getRadicalStory(radicalKey);
    } else if (radicalChar) {
        story = getRadicalStoryByChar(radicalChar);
    }

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    if (!story) {
        // Fallback for radicals without stories
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                />
                <div className={`
                    relative w-full max-w-md p-8 text-center
                    bg-zinc-900/95 rounded-3xl border ${themeClass.split(' ')[1]}
                `}>
                    <div className="text-6xl font-serif mb-4">{radicalChar}</div>
                    <p className="text-white/60 mb-6">
                        Story coming soon! This radical is part of your learning journey.
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    }

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
                {/* Hero Section with Large Radical */}
                <div className={`
                    relative py-12 px-6 text-center overflow-hidden
                    bg-gradient-to-b ${themeClass.split(' ')[2]} to-transparent
                `}>
                    {/* Background watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                        <span className="text-[20rem] font-serif">{story.char}</span>
                    </div>

                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
                    >
                        <X size={20} className="text-white/60" />
                    </button>

                    {/* Main radical display */}
                    <div className="relative z-10">
                        <div className={`
                            inline-flex items-center justify-center
                            w-32 h-32 rounded-3xl
                            bg-black/30 backdrop-blur-md border border-white/10
                            mb-4
                        `}>
                            <span className="text-7xl font-serif text-white">{story.char}</span>
                        </div>
                        <h1 className={`text-3xl font-bold ${colorClass} mb-2`}>
                            {story.name}
                        </h1>
                        <p className="text-white/60 text-lg">
                            {story.meaning}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-8">
                    {/* Origin Story */}
                    <section>
                        <div className="flex items-center gap-2 mb-3">
                            <BookOpen size={18} className={colorClass} />
                            <h3 className="text-lg font-semibold text-white">Origin</h3>
                        </div>
                        <p className="text-white/70 leading-relaxed">
                            {story.origin}
                        </p>
                    </section>

                    {/* The Story - Mnemonic */}
                    <section className={`
                        p-5 rounded-2xl border
                        bg-gradient-to-br from-white/5 to-transparent
                        ${themeClass.split(' ')[1]}
                    `}>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={18} className={colorClass} />
                            <h3 className="text-lg font-semibold text-white">The Story</h3>
                        </div>
                        <p className="text-white/80 leading-relaxed text-lg italic">
                            "{story.story}"
                        </p>
                    </section>

                    {/* Position Info */}
                    <section className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center
                            ${bgColorClass} flex-shrink-0
                        `}>
                            <MapPin size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium mb-1">Where It Appears</h4>
                            <p className="text-white/60 text-sm">
                                {story.position}
                            </p>
                        </div>
                    </section>

                    {/* How It Transforms Meaning */}
                    <section className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center
                            ${bgColorClass} flex-shrink-0
                        `}>
                            <PenTool size={20} className="text-white" />
                        </div>
                        <div>
                            <h4 className="text-white font-medium mb-1">Its Power</h4>
                            <p className="text-white/60 text-sm">
                                {story.transformsMeaning}
                            </p>
                        </div>
                    </section>

                    {/* Example Kanji */}
                    {story.exampleKanji && story.exampleKanji.filter(ex =>
                        ex.char &&
                        ex.char !== '?' &&
                        ex.char !== 'undefined' &&
                        ex.meaning &&
                        ex.meaning !== 'example' &&
                        ex.meaning !== 'undefined'
                    ).length > 0 && (
                            <section>
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    Example Kanji
                                </h3>
                                <div className="space-y-3">
                                    {story.exampleKanji.filter(ex =>
                                        ex.char &&
                                        ex.char !== '?' &&
                                        ex.char !== 'undefined' &&
                                        ex.meaning &&
                                        ex.meaning !== 'example' &&
                                        ex.meaning !== 'undefined'
                                    ).map((example, index) => (
                                        <div
                                            key={index}
                                            className={`
                                            flex items-center gap-4 p-4 rounded-xl
                                            bg-white/5 border border-white/5
                                            hover:bg-white/10 transition-colors
                                        `}
                                        >
                                            <div className={`
                                            w-14 h-14 rounded-xl flex items-center justify-center
                                            bg-black/30 border ${themeClass.split(' ')[1]}
                                            flex-shrink-0
                                        `}>
                                                <span className="text-3xl font-serif text-white">{example.char}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-bold ${colorClass}`}>
                                                        {example.char}
                                                    </span>
                                                    <span className="text-white/60">•</span>
                                                    <span className="text-white/80">
                                                        {example.meaning}
                                                    </span>
                                                </div>
                                                <p className="text-white/50 text-sm">
                                                    {example.explanation}
                                                </p>
                                            </div>
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
                        Got It!
                    </button>
                </div>
            </div>
        </div>
    );
}
