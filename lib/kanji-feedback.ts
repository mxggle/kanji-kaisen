export interface KanjiFeedback {
    isRecognizable: boolean;
    confidence: number;
    strokeOrderIssues: string[];
    strokeFormIssues: string[];
    shapeIssues: string[];
    suggestions: string[];
}

export interface AnalyzeKanjiRequest {
    imageData: string;
    expectedKanji: string;
}

// Exported drawings are small PNGs (about 109px * device scale); this leaves generous headroom.
export const MAX_IMAGE_DATA_LENGTH = 300_000;

const PNG_DATA_URL = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;
const SINGLE_HAN_CHARACTER = /^\p{Script=Han}$/u;

export function parseAnalyzeRequest(body: unknown): AnalyzeKanjiRequest | null {
    if (!body || typeof body !== "object") return null;

    const { imageData, expectedKanji } = body as Record<string, unknown>;
    if (typeof imageData !== "string" || typeof expectedKanji !== "string") return null;
    if (imageData.length > MAX_IMAGE_DATA_LENGTH || !PNG_DATA_URL.test(imageData)) return null;
    if (!SINGLE_HAN_CHARACTER.test(expectedKanji)) return null;

    return { imageData, expectedKanji };
}

function toStringList(value: unknown, limit: number): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .slice(0, limit)
        .map((item) => item.slice(0, 300));
}

// Coerces model output into the feedback shape the UI renders. Returns null when the
// verdict fields are missing, so a malformed response is never treated as a wrong answer.
export function normalizeFeedback(raw: unknown): KanjiFeedback | null {
    if (!raw || typeof raw !== "object") return null;

    const value = raw as Record<string, unknown>;
    if (typeof value.isRecognizable !== "boolean") return null;

    const confidence = value.confidence;
    if (typeof confidence !== "number" || !Number.isFinite(confidence)) return null;

    return {
        isRecognizable: value.isRecognizable,
        confidence: Math.min(100, Math.max(0, confidence)),
        strokeOrderIssues: toStringList(value.strokeOrderIssues, 5),
        strokeFormIssues: toStringList(value.strokeFormIssues, 5),
        shapeIssues: toStringList(value.shapeIssues, 5),
        suggestions: toStringList(value.suggestions, 5),
    };
}
