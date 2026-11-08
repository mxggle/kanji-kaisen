// Site-wide constants for metadata, sitemap and robots.

export const SITE_NAME = "Kanji Kaisen";

export const SITE_DESCRIPTION =
    "A free kanji atlas: stroke order, readings, example words and radical stories for 2,200+ kanji, organized by JLPT level, radical and theme.";

function resolveSiteUrl(): string {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL;
    if (explicit) return explicit.replace(/\/+$/, "");
    const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    if (vercel) return `https://${vercel}`;
    return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
