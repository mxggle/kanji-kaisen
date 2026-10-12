import type { MetadataRoute } from "next";
import { KANJI_DATA } from "@/lib/data";
import { CATEGORIES, getCategorySlug } from "@/lib/checkpoints";
import { SITE_URL } from "@/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
    const url = (path: string) => new URL(path, SITE_URL).toString();
    return [
        { url: url("/"), changeFrequency: "weekly", priority: 1 },
        { url: url("/learn"), changeFrequency: "weekly", priority: 0.9 },
        ...CATEGORIES.map((category) => ({
            url: url(`/category/${getCategorySlug(category)}`),
            changeFrequency: "monthly" as const,
            priority: 0.7,
        })),
        ...KANJI_DATA.map((kanji) => ({
            url: url(`/kanji/${encodeURIComponent(kanji.char)}`),
            changeFrequency: "yearly" as const,
            priority: 0.5,
        })),
    ];
}
