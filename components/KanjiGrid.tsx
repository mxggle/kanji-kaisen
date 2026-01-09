"use client";

import { KanjiData } from "@/types/kanji";
import { KanjiCard } from "./KanjiCard";

interface KanjiGridProps {
    items: KanjiData[];
}

export function KanjiGrid({ items }: KanjiGridProps) {
    // Find max frequency to normalize heat
    const maxFreq = Math.max(...items.map((i) => i.frequency));

    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2 p-4 pb-20">
            {items.map((item) => (
                <KanjiCard key={item.char} data={item} maxFreq={maxFreq} />
            ))}
        </div>
    );
}
