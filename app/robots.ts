import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/settings"] },
        sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
    };
}
