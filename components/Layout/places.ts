// The four places every page is reached from. Their names and URLs stay
// (owner, 2026-10-31); what changes is which routes each one owns: kanji pages
// belong to Learn with themes and radicals. Pure; tests in places.test.mjs.

export type Place = "learn" | "browse" | "mine" | "teach";

export interface PlaceLink {
    place: Place;
    href: string;
    label: string;
    /** Tab bar glyph. */
    jp: string;
}

export const PLACES: readonly PlaceLink[] = [
    { place: "learn", href: "/", label: "Learn", jp: "学" },
    { place: "browse", href: "/browse", label: "Browse", jp: "探" },
    { place: "mine", href: "/my-list", label: "My list", jp: "墨" },
    { place: "teach", href: "/teach", label: "Teach", jp: "教" },
];

// "/" owns only itself; every other entry owns itself and everything below it.
const OWNED: readonly [Place, readonly string[]][] = [
    ["learn", ["/", "/categories", "/category", "/radicals", "/radical", "/kanji"]],
    ["browse", ["/browse", "/search"]],
    ["mine", ["/my-list", "/study", "/practice"]],
    ["teach", ["/teach", "/set"]],
];

const ATLAS = ["/category", "/radical", "/kanji"];

/** Strips the query, hash and any trailing slash ("/kanji/休/?x#learn" -> "/kanji/休"). */
function clean(pathname: string): string {
    const path = pathname.split(/[?#]/)[0] || "/";
    return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
}

function owns(root: string, path: string): boolean {
    return root === "/" ? path === "/" : path === root || path.startsWith(`${root}/`);
}

/** The place that is current on a route, or null (about, settings, 404). */
export function placeFor(pathname: string): Place | null {
    const path = clean(pathname);
    for (const [place, roots] of OWNED) {
        if (roots.some((root) => owns(root, path))) return place;
    }
    return null;
}

/** Theme, radical and kanji pages: the ones with an atlas path. */
export function isAtlasPage(pathname: string): boolean {
    const path = clean(pathname);
    return ATLAS.some((root) => path.startsWith(`${root}/`));
}
