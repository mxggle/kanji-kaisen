export type JLPTRank = "N1" | "N2" | "N3" | "N4" | "N5";

export interface KanjiData {
    char: string;
    meaning: string;
    onyomi: string[];
    kunyomi: string[];
    jlpt: JLPTRank;
    strokeCount: number;
    frequency: number; // 1 to ~3000 (1 being most frequent)
    grade?: number;
}
