"use client";

import { JLPTRank } from "@/types/kanji";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
    selectedLevels: JLPTRank[];
    onLevelChange: (levels: JLPTRank[]) => void;
    strokeRange: [number, number];
    onStrokeChange: (range: [number, number]) => void;
    sortBy: "frequency" | "stroke" | "jlpt";
    onSortChange: (sort: "frequency" | "stroke" | "jlpt") => void;
    isOpen: boolean;
    onClose: () => void;
}

const JLPT_LEVELS: JLPTRank[] = ["N5", "N4", "N3", "N2", "N1"];

export function FilterPanel({
    selectedLevels,
    onLevelChange,
    strokeRange,
    onStrokeChange,
    sortBy,
    onSortChange,
    isOpen,
    onClose
}: FilterPanelProps) {

    const toggleLevel = (level: JLPTRank) => {
        if (selectedLevels.includes(level)) {
            onLevelChange(selectedLevels.filter(l => l !== level));
        } else {
            onLevelChange([...selectedLevels, level]);
        }
    };

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={cn(
                "fixed right-0 top-14 bottom-0 w-80 bg-black/90 border-l border-white/10 z-50 p-6 shadow-2xl transition-transform duration-300 transform",
                isOpen ? "translate-x-0" : "translate-x-full"
            )}>
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white">Filters</h2>
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white"
                    >
                        Close
                    </button>
                </div>

                {/* JLPT Levels */}
                <div className="mb-8">
                    <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">JLPT Level</h3>
                    <div className="flex flex-wrap gap-2">
                        {JLPT_LEVELS.map((level) => {
                            const isActive = selectedLevels.includes(level);
                            return (
                                <button
                                    key={level}
                                    onClick={() => toggleLevel(level)}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all border-2",
                                        isActive
                                            ? "bg-white text-black border-transparent scale-110"
                                            : "bg-transparent text-white/50 border-white/20 hover:border-white/50"
                                    )}
                                    style={{
                                        borderColor: isActive ? `var(--${level.toLowerCase()})` : undefined,
                                        backgroundColor: isActive ? `var(--${level.toLowerCase()})` : undefined,
                                        color: isActive ? 'white' : undefined
                                    }}
                                >
                                    {level}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Sorting */}
                <div className="mb-8">
                    <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">Sort By</h3>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { id: 'frequency', label: 'Frequency' },
                            { id: 'stroke', label: 'Stroke Count' },
                            { id: 'jlpt', label: 'JLPT Level' }
                        ].map((option) => (
                            <button
                                key={option.id}
                                onClick={() => onSortChange(option.id as any)}
                                className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all",
                                    sortBy === option.id
                                        ? "bg-white text-black"
                                        : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {option.label}
                                {sortBy === option.id && <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Stroke Count */}
                <div className="mb-8">
                    <h3 className="text-sm font-medium text-white/70 mb-4 uppercase tracking-wider">
                        Stroke Count: {strokeRange[0]} - {strokeRange[1]}
                    </h3>
                    <input
                        type="range"
                        min="1"
                        max="30"
                        value={strokeRange[1]}
                        onChange={(e) => onStrokeChange([strokeRange[0], parseInt(e.target.value)])}
                        className="w-full accent-[var(--accent)] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
            </div>
        </>
    );
}
