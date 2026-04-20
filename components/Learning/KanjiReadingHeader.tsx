"use client";

import { KanjiData } from "@/types/kanji";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toRomaji } from "wanakana";

interface KanjiReadingHeaderProps {
    data: KanjiData;
    className?: string;
}

export function KanjiReadingHeader({ data, className }: KanjiReadingHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Truncate meaning logic
    const meanings = data.meaning.split(",").map(m => m.trim());
    const displayMeanings = meanings.slice(0, 3).join(", ");
    const hasMoreMeanings = meanings.length > 3;

    return (
        <div className={cn("flex flex-col items-center relative z-50", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md px-5 py-2 rounded-full border shadow-lg text-sm max-w-full transition-all duration-200 cursor-pointer hover:bg-zinc-800/80 hover:border-white/20 active:scale-95 whitespace-nowrap",
                    isOpen ? "border-white/30 bg-zinc-800/90" : "border-white/10"
                )}
                aria-label={isOpen ? "Hide details" : "Show detailed readings and meanings"}
                aria-expanded={isOpen}
            >
                {/* Meaning Section */}
                <div className="flex flex-col items-start gap-0.5 truncate max-w-[120px] sm:max-w-[160px]">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold flex-shrink-0">
                        Meaning
                    </span>
                    <span className="font-bold text-white tracking-wide truncate w-full" title={data.meaning}>
                        {displayMeanings}{hasMoreMeanings ? "..." : ""}
                    </span>
                </div>

                <div className="w-px h-8 bg-white/10 flex-shrink-0" />

                {/* Primary Readings Section */}
                <div className="flex flex-col items-start gap-0.5 min-w-0 flex-1">
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold flex-shrink-0">
                        Readings
                    </span>
                    <div className="flex items-center gap-2 font-japanese text-zinc-300 truncate">
                        {data.onyomi[0] && (
                            <span className="group-hover:text-[var(--n5)] transition-colors flex-shrink-0">{data.onyomi[0]}</span>
                        )}
                        {data.kunyomi[0] && (
                            <span className="text-[var(--accent)] group-hover:opacity-100 opacity-90 transition-opacity flex-shrink-0">{data.kunyomi[0]}</span>
                        )}
                        {(data.onyomi.length > 1 || data.kunyomi.length > 1) && (
                            <span className="text-zinc-600 text-xs flex-shrink-0">...</span>
                        )}
                    </div>
                </div>

                {/* Chevron Indicator */}
                <div className="text-zinc-500 transition-transform duration-300 group-hover:text-zinc-300 flex-shrink-0" style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <ChevronDown size={14} />
                </div>
            </button>

            {/* Popover Content - Positioned relative to the container */}
            <div className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 mt-3 transition-all duration-300 transform bg-zinc-900/95 border border-zinc-700/50 backdrop-blur-md p-4 rounded-xl shadow-xl min-w-[280px]",
                isOpen
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-2 pointer-events-none"
            )}>
                <div className="flex flex-col gap-4 text-left">
                    {/* Full Meaning Section in Popover */}
                    <div>
                        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">
                            Full Meaning
                        </span>
                        <p className="text-white text-sm font-medium leading-relaxed">
                            {data.meaning}
                        </p>
                    </div>

                    <div className="h-px bg-white/10 my-1" />

                    {data.onyomi.length > 0 && (
                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">
                                Onyomi (Chinese)
                            </span>
                            <div className="flex flex-col gap-1">
                                {data.onyomi.map((r, i) => (
                                    <div key={i} className="flex justify-between items-baseline gap-4 group/item hover:bg-white/5 p-1 rounded transition-colors">
                                        <span className="text-[var(--n5)] font-japanese text-lg">{r}</span>
                                        <span className="text-zinc-500 text-sm font-mono group-hover/item:text-zinc-300">{toRomaji(r)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {data.kunyomi.length > 0 && (
                        <div>
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold block mb-1">
                                Kunyomi (Japanese)
                            </span>
                            <div className="flex flex-col gap-1">
                                {data.kunyomi.map((r, i) => (
                                    <div key={i} className="flex justify-between items-baseline gap-4 group/item hover:bg-white/5 p-1 rounded transition-colors">
                                        <span className="text-[var(--accent)] font-japanese text-lg">{r}</span>
                                        <span className="text-zinc-500 text-sm font-mono group-hover/item:text-zinc-300">{toRomaji(r)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
