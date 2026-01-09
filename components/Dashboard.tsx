"use client";

import { useState, useMemo } from "react";
import { KanjiGrid } from "./KanjiGrid";
import { FilterPanel } from "./FilterPanel";
import { KanjiData, JLPTRank } from "@/types/kanji";
import { Settings, Search } from "lucide-react";

interface DashboardProps {
    initialData: KanjiData[];
}

export function Dashboard({ initialData }: DashboardProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedLevels, setSelectedLevels] = useState<JLPTRank[]>(["N1", "N2", "N3", "N4", "N5"]);
    const [strokeRange, setStrokeRange] = useState<[number, number]>([1, 30]);
    const [sortBy, setSortBy] = useState<"frequency" | "stroke" | "jlpt">("frequency");
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Filter & Sort Logic
    const filteredData = useMemo(() => {
        // 1. Filter
        const filtered = initialData.filter((item) => {
            // 1. JLPT Level
            if (!selectedLevels.includes(item.jlpt)) return false;

            // 2. Stroke Count
            if (item.strokeCount < strokeRange[0] || item.strokeCount > strokeRange[1]) return false;

            // 3. Search Query
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchChar = item.char.includes(query);
                const matchMeaning = item.meaning.toLowerCase().includes(query);
                const matchOn = item.onyomi.some(r => r.toLowerCase().includes(query));
                const matchKun = item.kunyomi.some(r => r.toLowerCase().includes(query));
                return matchChar || matchMeaning || matchOn || matchKun;
            }

            return true;
        });

        // 2. Sort
        return filtered.sort((a, b) => {
            switch (sortBy) {
                case "frequency":
                    return a.frequency - b.frequency; // Low index = High freq
                case "stroke":
                    return a.strokeCount - b.strokeCount; // Low stroke = first
                case "jlpt":
                    // N5 = 5 (Target), N1 = 1. We want N5 first usually for beginners, or N1 first?
                    // Let's assume N5 -> N1 (easiest to hardest).
                    // Extract number from "N5" -> 5
                    const getLvl = (n: string) => parseInt(n.replace("N", ""));
                    // Wait, N5 is easiest. N1 is hardest.
                    // Usually people want simple first.
                    // Let's do N5 first. So Descending numerical value.
                    return getLvl(b.jlpt) - getLvl(a.jlpt);
                default:
                    return 0;
            }
        });

    }, [initialData, selectedLevels, strokeRange, searchQuery, sortBy]);

    return (
        <div>
            {/* Sub-Header / Search Bar Area (Sticky below main header) */}
            <div className="sticky top-14 md:top-[3.5rem] z-30 bg-black/95 border-b border-white/10 p-2 md:p-4 transition-all">
                <div className="container mx-auto flex gap-2 items-center">
                    {/* Search Input */}
                    <div className="relative flex-1 group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[var(--accent)] transition-colors">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            type="text"
                            placeholder="Search kanji, meaning, reading..."
                            className="w-full bg-white/5 border border-white/10 rounded-md py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-[var(--accent)] focus:bg-white/10 transition-all placeholder:text-white/20"
                        />
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setIsFilterOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-md text-white/80 hover:text-white transition-all text-sm font-medium"
                    >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto p-4 min-h-[calc(100vh-140px)]">
                {filteredData.length === 0 ? (
                    <div className="text-center text-white/40 mt-20">
                        <p>No kanji found matching your filters.</p>
                    </div>
                ) : (
                    <KanjiGrid items={filteredData} />
                )}
            </div>

            {/* Filter Sidebar */}
            <FilterPanel
                selectedLevels={selectedLevels}
                onLevelChange={setSelectedLevels}
                strokeRange={strokeRange}
                onStrokeChange={setStrokeRange}
                sortBy={sortBy}
                onSortChange={setSortBy}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </div>
    );
}
