declare module "kanji-recognizer" {
    export interface ExportImageOptions {
        includeGrid?: boolean;
        backgroundColor?: string;
    }

    export class KanjiWriter {
        constructor(elementId: string, data: unknown, options?: Record<string, unknown>);
        animate(): void;
        clear(): void;
        hint(): void;
        destroy?(): void;
        exportImage?(options?: ExportImageOptions): Promise<string | null>;
        onComplete?: () => void;
    }

    export const KanjiVGParser: {
        parse(svg: string): unknown;
    };
}

declare module "wanakana" {
    export interface WanakanaOptions {
        passRomaji?: boolean;
        upcaseKatakana?: boolean;
        IMEMode?: boolean | "toHiragana" | "toKatakana";
    }

    export function toRomaji(input: string, options?: WanakanaOptions): string;
    export function toHiragana(input: string, options?: WanakanaOptions): string;
    export function toKatakana(input: string, options?: WanakanaOptions): string;
    export function toKana(input: string, options?: WanakanaOptions): string;
    export function isKana(input: string): boolean;
    export function isKanji(input: string): boolean;
    export function isRomaji(input: string): boolean;
}
