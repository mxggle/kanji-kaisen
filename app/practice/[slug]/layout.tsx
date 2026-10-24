import { notFound } from "next/navigation";
import { CATEGORIES, getCategoryFromSlug, getCategorySlug } from "@/lib/atlas/categories";

// The practice page itself is a client component; this server layout gives
// unknown slugs a real 404 status and prerenders the ten known ones.
export const dynamicParams = false;

export function generateStaticParams() {
    return CATEGORIES.map((category) => ({ slug: getCategorySlug(category) }));
}

export default async function PracticeCategoryLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ slug: string }>;
}) {
    if (!getCategoryFromSlug((await params).slug)) notFound();
    return children;
}
