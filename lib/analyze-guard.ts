// Checks for /api/analyze-kanji before it spends a Gemini call: the request
// must come from this site's own pages, and the body must look like what the
// handwriting canvas sends (one kanji, a small PNG). Pure, so it can be tested.

/** The canvas exports a 109×109 PNG (a few KB); this leaves plenty of room. */
export const MAX_IMAGE_DATA_LENGTH = 200_000;
/** A JSON body larger than this is refused before parsing. */
export const MAX_BODY_BYTES = MAX_IMAGE_DATA_LENGTH + 1_000;

const PNG_PREFIX = "data:image/png;base64,";
const BASE64_RE = /^[A-Za-z0-9+/]+={0,2}$/;
const KANJI_RE = /^[\p{Script=Han}々]$/u;

export type GuardHeaders = { get(name: string): string | null };

/**
 * True when a browser sent the request from a page on the same host. Browsers
 * send Origin on every fetch POST and Sec-Fetch-Site where they support it;
 * a script can forge both, so this only stops casual reuse of the endpoint.
 */
export function isSameOriginRequest(headers: GuardHeaders, host: string): boolean {
    const fetchSite = headers.get("sec-fetch-site");
    if (fetchSite && fetchSite !== "same-origin") return false;
    const origin = headers.get("origin");
    if (!origin) return false;
    try {
        return new URL(origin).host === host;
    } catch {
        return false;
    }
}

export type AnalyzeInput = { base64Data: string; expectedKanji: string };

/** The PNG's base64 and the kanji, or null when the body isn't what the canvas sends. */
export function parseAnalyzeBody(body: unknown): AnalyzeInput | null {
    if (!body || typeof body !== "object") return null;
    const { imageData, expectedKanji } = body as Record<string, unknown>;
    if (typeof expectedKanji !== "string" || !KANJI_RE.test(expectedKanji)) return null;
    if (typeof imageData !== "string" || imageData.length > MAX_IMAGE_DATA_LENGTH) return null;
    if (!imageData.startsWith(PNG_PREFIX)) return null;
    const base64Data = imageData.slice(PNG_PREFIX.length);
    if (!BASE64_RE.test(base64Data)) return null;
    return { base64Data, expectedKanji };
}
