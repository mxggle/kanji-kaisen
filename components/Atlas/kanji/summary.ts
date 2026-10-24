// Pure text helpers for atlas pages. Client-safe.

/** The first `count` sentences of `text` (whole text if it has fewer). */
export function firstSentences(text: string, count = 2): string {
    const trimmed = text.trim();
    if (!trimmed) return "";
    // A sentence ends at . ! or ? (optionally followed by a closing quote) and whitespace.
    const sentences = trimmed.split(/(?<=[.!?]["'”’)]?)\s+/);
    return sentences.slice(0, count).join(" ");
}

/** Cuts `text` to at most `max` characters at a word boundary, adding "…". */
export function truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    const cut = text.slice(0, max - 1);
    const space = cut.lastIndexOf(" ");
    return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:.]+$/, "")}…`;
}
