import { getCategoryImage } from "@/lib/atlas/categories";
import { themeVars, type ThemeStyle } from "./themeStyles";

/**
 * Background layers of a theme card: category image, readability gradient and
 * decorative glyphs. Place inside a `relative overflow-hidden group` container.
 * The art is full colour in 夜 and ink wash in 墨; glyphs use the theme accent.
 * Hook-free, so it works in server and client components.
 */
export function CategoryCardArt({ category, theme }: { category: string; theme: ThemeStyle }) {
    return (
        <>
            <div className="absolute inset-0 pointer-events-none overflow-hidden art-blend">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={getCategoryImage(category)}
                    alt=""
                    loading="lazy"
                    className="ink-art w-full h-full object-cover opacity-40 group-hover:opacity-60 scale-105 group-hover:scale-100 transition-[opacity,transform] duration-700"
                />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-bg/40 to-transparent opacity-80" />

            <div className="absolute inset-0 pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity duration-500 overflow-hidden" style={themeVars(category)} aria-hidden>
                <div className="absolute -right-4 -bottom-12 text-[10rem] font-bold select-none font-japanese text-c transform -rotate-12 opacity-50">
                    {theme.elements[0]}
                </div>
                {theme.radicals.slice(0, 3).map((radical, i) => (
                    <div
                        key={i}
                        className="absolute text-4xl font-bold font-japanese text-c opacity-60"
                        style={{
                            top: `${15 + i * 30}%`,
                            left: `${10 + i * 60}%`,
                            transform: `rotate(${i * 20}deg)`,
                        }}
                    >
                        {radical}
                    </div>
                ))}
            </div>
        </>
    );
}
