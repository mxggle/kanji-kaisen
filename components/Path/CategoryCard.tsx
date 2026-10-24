"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Checkpoint } from '@/lib/checkpoints';
import { practiceCategoryPath } from '@/lib/atlas/paths';
import { BookOpen } from 'lucide-react';
import { CategoryStoryModal } from '@/components/Story/CategoryStoryModal';
import { getThemeStyle } from '@/components/Atlas/category/themeStyles';
import { CategoryCardArt } from '@/components/Atlas/category/CategoryCardArt';

interface CategoryCardProps {
    title: string;
    checkpoints: Checkpoint[];
    completedCount: number;
}

export function CategoryCard({ title, checkpoints, completedCount }: CategoryCardProps) {
    const [showStory, setShowStory] = useState(false);
    const theme = getThemeStyle(title);
    const Icon = theme.icon;
    const total = checkpoints.length;
    const progress = Math.round((completedCount / total) * 100) || 0;
    const themeClass = `${theme.title} ${theme.border} ${theme.bg.split(' ')[0]}`;

    const handleInfoClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowStory(true);
    };

    return (
        <>
            <Link href={practiceCategoryPath(title)} className="block h-full">
                <div className={`
                h-full flex flex-col p-6 rounded-3xl border transition-all duration-500
                ${theme.bg} ${theme.border} backdrop-blur-md group
                hover:scale-[1.02] active:scale-[0.98]
                relative overflow-hidden shadow-lg hover:shadow-2xl
            `}>
                    <CategoryCardArt category={title} theme={theme} />

                    {/* Foreground Content */}
                    <div className="relative z-10 flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl bg-white/10 ${theme.title} backdrop-blur-md shadow-inner border border-white/5`}>
                                <Icon size={24} />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleInfoClick}
                                className={`
                                p-3 rounded-xl bg-white/10 hover:bg-white/20
                                ${theme.title} transition-all duration-200
                                opacity-60 group-hover:opacity-100
                                hover:scale-110 active:scale-95
                            `}
                                title="Learn about this category"
                            >
                                <BookOpen size={24} />
                            </button>
                            <span className="text-2xl font-bold opacity-60 group-hover:opacity-100 transition-opacity text-white">
                                {progress}%
                            </span>
                        </div>
                    </div>

                    <div className="relative z-10 mt-auto transform translate-y-0 transition-transform duration-300">
                        <h3 className={`text-2xl font-bold mb-2 ${theme.title} tracking-wide drop-shadow-lg`}>
                            {title}
                        </h3>

                        <div className="flex items-center justify-between text-white/60 text-sm mb-3">
                            <span>{completedCount} / {total} Radicals</span>
                        </div>

                        {/* Modern Progress Bar */}
                        <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                            <div
                                className={`h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,0,0,0.3)] ${theme.title.replace('text-', 'bg-')}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </Link>

            {/* Story Modal */}
            {showStory && (
                <CategoryStoryModal
                    category={title}
                    onClose={() => setShowStory(false)}
                    themeClass={themeClass}
                />
            )}
        </>
    );
}
