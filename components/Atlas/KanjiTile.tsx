import Link from "next/link";
import { cn } from "@/lib/utils";
import { kanjiPath } from "@/lib/atlas/paths";
import type { AtlasKanji } from "@/lib/atlas/types";
import { jlptColor } from "./JlptBadge";

export type KanjiTileData = Pick<AtlasKanji, "char" | "meanings" | "jlpt" | "onyomi" | "kunyomi">;

interface KanjiTileProps {
    kanji: KanjiTileData;
    className?: string;
    // Optional overlay (e.g. a save toggle), rendered top-right outside the link.
    action?: React.ReactNode;
}

/** Server-safe kanji card linking to /kanji/[char]. Bottom border shows the JLPT level. */
export function KanjiTile({ kanji, className, action }: KanjiTileProps) {
    const reading = kanji.kunyomi[0] ?? kanji.onyomi[0] ?? "";
    return (
        <div className={cn("relative group", className)}>
            <Link
                href={kanjiPath(kanji.char)}
                className="flex flex-col items-center justify-center aspect-square p-2 rounded-lg bg-white/5 border border-white/10 border-b-4 hover:bg-white/10 hover:border-[var(--accent)] transition-colors"
                style={{ borderBottomColor: jlptColor(kanji.jlpt) }}
                title={`${kanji.char} – ${kanji.meanings.slice(0, 3).join(", ")}`}
            >
                <span className="text-[10px] text-white/50 truncate w-full text-center font-japanese">{reading.replace(/\./g, "")}</span>
                <span className="text-3xl sm:text-4xl font-bold font-japanese text-white my-0.5">{kanji.char}</span>
                <span className="text-[11px] text-white/80 truncate w-full text-center leading-tight">{kanji.meanings[0]}</span>
            </Link>
            {action && <div className="absolute top-1 right-1">{action}</div>}
        </div>
    );
}

export function KanjiTileGrid({ items, className }: { items: KanjiTileData[]; className?: string }) {
    if (items.length === 0) {
        return <p className="text-white/50 text-sm">No kanji here yet.</p>;
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
