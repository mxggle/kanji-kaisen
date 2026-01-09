export interface Checkpoint {
    id: string;
    title: string;
    radical: string;
    level: string;
    kanji: string[];
    isLocked?: boolean;
}

export const CHECKPOINTS: Checkpoint[] = [
    {
        id: "n5-water",
        title: "The Water Flow",
        radical: "氵",
        level: "N5",
        kanji: ["海", "泳", "洗", "池", "酒", "油", "活", "漢", "港", "深"]
    },
    {
        id: "n5-person",
        title: "The People's Path",
        radical: "亻",
        level: "N5",
        kanji: ["休", "体", "作", "使", "信", "代", "化", "何", "住", "低"]
    },
    {
        id: "n5-hand",
        title: "Hand of Mastery",
        radical: "扌",
        level: "N5",
        kanji: ["持", "指", "拾", "打", "投", "払", "技", "押", "折", "招"]
    },
    {
        id: "n5-tree",
        title: "Forest of Wisdom",
        radical: "木",
        level: "N5",
        kanji: ["木", "本", "林", "森", "校", "村", "相", "松", "果", "板"]
    },
    {
        id: "n5-sun",
        title: "Sunlit Peaks",
        radical: "日",
        level: "N5",
        kanji: ["日", "時", "間", "明", "春", "昼", "晴", "曜", "映", "晩"]
    },
    {
        id: "n5-gate",
        title: "Ancient Gates",
        radical: "門",
        level: "N5",
        kanji: ["門", "間", "聞", "開", "閉", "問", "関", "閣", "閲", "閑"]
    }
];

// Helper to get next checkpoint ID
export function getNextCheckpointId(currentId: string): string | null {
    const index = CHECKPOINTS.findIndex(c => c.id === currentId);
    if (index === -1 || index === CHECKPOINTS.length - 1) return null;
    return CHECKPOINTS[index + 1].id;
}
