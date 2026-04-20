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
    export function toRomaji(input: string): string;
}
