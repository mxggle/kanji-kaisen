import { cn } from "@/lib/utils";
import { KanjiTile, type KanjiTileData } from "@/components/ui/KanjiTile";

/**
 * The Browse and Search result grid: md tiles, each in its own theme colour,
 * 88px columns (76 on phones, so four fit). Server-safe; the page's <InkPaint>
 * fills the tiles.
 */
export function TileGrid({ items, label, className }: { items: readonly KanjiTileData[]; label?: string; className?: string }) {
    return (
        <ul aria-label={label} className={cn("grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(88px,1fr))]", className)}>
            {items.map((k) => (
                <li key={k.char} className="min-w-0">
                    <KanjiTile kanji={k} />
                </li>
            ))}
        </ul>
    );
}
