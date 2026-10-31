import Link from "next/link";
import { cn } from "@/lib/utils";
import { kanjiPath } from "@/lib/atlas/paths";
import type { AtlasKanji } from "@/lib/atlas/types";

export type KanjiTileData = Pick<AtlasKanji, "char" | "meanings" | "jlpt" | "onyomi" | "kunyomi">;

interface KanjiTileProps {
    kanji: KanjiTileData;
    className?: string;
    // Optional overlay (e.g. a save toggle), rendered top-right outside the link.
    action?: React.ReactNode;
}

/** Server-safe kanji card linking to /kanji/[char]. Deprecated: use components/ui/KanjiTile. */
export function KanjiTile({ kanji, className, action }: KanjiTileProps) {
    const reading = kanji.kunyomi[0] ?? kanji.onyomi[0] ?? "";
    return (
        <div className={cn("relative group", className)}>
            <Link
                href={kanjiPath(kanji.char)}
                className="flex flex-col items-center justify-center aspect-square p-2 rounded-lg bg-card border border-line hover:bg-ink/10 hover:border-ink-3 transition-colors"
                title={`${kanji.char} – ${kanji.meanings.slice(0, 3).join(", ")}`}
            >
                <span className="text-[10px] text-ink-3 truncate w-full text-center font-japanese">{reading.replace(/\./g, "")}</span>
                <span className="text-3xl sm:text-4xl font-bold font-japanese text-ink my-0.5">{kanji.char}</span>
                <span className="text-[11px] text-ink truncate w-full text-center leading-tight">{kanji.meanings[0]}</span>
            </Link>
            {action && <div className="absolute top-1 right-1">{action}</div>}
        </div>
    );
}

export function KanjiTileGrid({ items, className }: { items: KanjiTileData[]; className?: string }) {
    if (items.length === 0) {
        return <p className="text-ink-3 text-sm">No kanji here yet.</p>;
    }
    return (
        <ul className={cn("grid grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2", className)}>
            {items.map((k) => (
                <li key={k.char}>
                    <KanjiTile kanji={k} />
                </li>
            ))}
        </ul>
    );
}
