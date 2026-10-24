import type { MetadataRoute } from "next";
import { getAllKanji, getAllRadicals, getCategories } from "@/lib/atlas";
import { categoryPath, kanjiPath, radicalPath } from "@/lib/atlas/paths";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
    const url = (path: string) => `${SITE_URL}${path}`;

    const staticPages: MetadataRoute.Sitemap = [
        { url: url("/"), changeFrequency: "daily", priority: 1 },
        { url: url("/browse"), changeFrequency: "weekly", priority: 0.9 },
        { url: url("/radicals"), changeFrequency: "monthly", priority: 0.8 },
        { url: url("/categories"), changeFrequency: "monthly", priority: 0.8 },
        { url: url("/practice"), changeFrequency: "monthly", priority: 0.4 },
        { url: url("/about"), changeFrequency: "yearly", priority: 0.3 },
        ...(["N5", "N4", "N3", "N2", "N1"] as const).map((level) => ({
            url: url(`/browse?jlpt=${level}`),
            changeFrequency: "monthly" as const,
            priority: 0.7,
        })),
    ];

    return [
        ...staticPages,
        ...getCategories().map((c) => ({ url: url(categoryPath(c.name)), changeFrequency: "monthly" as const, priority: 0.7 })),
        ...getAllRadicals().map((r) => ({ url: url(radicalPath(r.key)), changeFrequency: "monthly" as const, priority: 0.6 })),
        ...getAllKanji().map((k) => ({ url: url(kanjiPath(k.char)), changeFrequency: "monthly" as const, priority: 0.6 })),
    ];
}
