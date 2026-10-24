import type { Metadata } from "next";

/** Trim text to `max` chars on a word boundary, adding an ellipsis when cut. */
export function truncate(text: string, max = 160): string {
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max - 1);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–-]+$/, "")}…`;
}

/** Title, ≤160-char description, canonical URL and basic Open Graph tags. */
export function atlasMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
    const desc = truncate(description);
    return {
        title,
        description: desc,
        alternates: { canonical: path },
        openGraph: { title, description: desc, url: path, type: "website", siteName: "Kanji Kaisen" },
    };
}
