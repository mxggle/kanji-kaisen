import compiledStories from './compiled-stories.json';

export interface CategoryStory {
    name: string;
    title: string;
    description: string;
    whyItMatters: string;
    learningTip: string;
    commonPatterns: string[];
    icon: string;
}

export interface RadicalStory {
    key: string;
    char: string;
    name: string;
    meaning: string;
    origin: string;
    story: string;
    position: string;
    transformsMeaning: string;
    exampleKanji: Array<{
        char: string;
        meaning: string;
        explanation: string;
    }>;
}

// Load data from compiled JSON
export const CATEGORY_STORIES: Record<string, CategoryStory> = compiledStories.categories as Record<string, CategoryStory>;
export const RADICAL_STORIES: Record<string, RadicalStory> = compiledStories.radicals as Record<string, RadicalStory>;

// Helper functions
export function getCategoryStory(categoryName: string): CategoryStory | undefined {
    return CATEGORY_STORIES[categoryName];
}

export function getRadicalStory(radicalKey: string): RadicalStory | undefined {
    return RADICAL_STORIES[radicalKey];
}

export function getRadicalStoryByChar(char: string): RadicalStory | undefined {
    return Object.values(RADICAL_STORIES).find(story => story.char === char);
}

export function getAllRadicalStories(): RadicalStory[] {
    return Object.values(RADICAL_STORIES);
}
