"use client";

import { X } from "lucide-react";
import { getRadicalStory, getRadicalStoryByChar, RadicalStory } from "@/lib/story-loader";
import { useEffect } from "react";
import { RadicalStoryContent } from "@/components/Atlas/radical/RadicalStoryContent";
import { enterOrder } from "@/components/Motion/tokens";
import { useDialogMotion } from "./useDialogMotion";

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

    // Opens with the dialog pattern; every way out plays the exit first.
    const { backdrop, panel, close } = useDialogMotion<HTMLDivElement, HTMLDivElement>(onClose);

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
                    ref={backdrop}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={close}
                />
                <div ref={panel} className={`
                    relative w-full max-w-md p-8 text-center
                    bg-zinc-900/95 rounded-3xl border ${themeClass.split(' ')[1]}
                `}>
                    <div className="text-6xl font-serif mb-4">{radicalChar}</div>
                    <p className="text-white/60 mb-6">
                        Story coming soon! This radical is part of your learning journey.
                    </p>
                    <button
                        onClick={close}
                        className="px-6 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-[background-color,transform] duration-(--dur-micro) active:scale-[.97]"
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
                ref={backdrop}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={close}
            />

            {/* Modal Content */}
            <div ref={panel} className={`
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
                        onClick={close}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-[background-color,transform] duration-(--dur-micro) active:scale-[.97]"
                    >
                        <X size={20} className="text-white/60" />
                    </button>

                    {/* Main radical display */}
                    <div className="relative z-10">
                        {/* The radical is pressed in like a seal, then its name and meaning rise under it. */}
                        <div data-enter="stamp" style={enterOrder(1)} className={`
                            inline-flex items-center justify-center
                            w-32 h-32 rounded-3xl
                            bg-black/30 backdrop-blur-md border border-white/10
                            mb-4
                        `}>
                            <span className="text-7xl font-serif text-white">{story.char}</span>
                        </div>
                        <h1 data-enter style={enterOrder(3)} className={`text-3xl font-bold ${colorClass} mb-2`}>
                            {story.name}
                        </h1>
                        <p data-enter style={enterOrder(4)} className="text-white/60 text-lg">
                            {story.meaning}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    <RadicalStoryContent story={story} themeClass={themeClass} />
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 p-4 bg-gradient-to-t from-zinc-900 to-transparent">
                    <button
                        onClick={close}
                        className={`
                            w-full py-3 rounded-xl font-medium
                            ${bgColorClass} text-white
                            hover:opacity-90 transition-[opacity,transform] duration-(--dur-micro) active:scale-[.97]
                        `}
                    >
                        Got It!
                    </button>
                </div>
            </div>
        </div>
    );
}
