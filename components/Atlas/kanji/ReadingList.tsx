import { readingToRomaji, splitReading } from "@/lib/atlas/readings";

/** One reading in KANJIDIC notation: stem, de-emphasized okurigana, romaji below. */
export function Reading({ reading }: { reading: string }) {
    const { prefix, suffix, stem, okurigana } = splitReading(reading);
    return (
        <span className="inline-flex flex-col items-start px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <span className="text-xl font-japanese leading-tight">
                {suffix && <span className="text-white/40">-</span>}
                {stem}
                {okurigana && <span className="text-white/40">{okurigana}</span>}
                {prefix && <span className="text-white/40">-</span>}
            </span>
            <span className="text-xs text-white/50">{readingToRomaji(reading)}</span>
        </span>
    );
}

export function ReadingList({ label, hint, readings }: { label: string; hint: string; readings: string[] }) {
    return (
        <div>
            <h3 className="text-white/50 text-xs uppercase tracking-wider mb-2">
                {label} <span className="normal-case tracking-normal text-white/30">({hint})</span>
            </h3>
            {readings.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                    {readings.map((reading) => (
                        <li key={reading}>
                            <Reading reading={reading} />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-white/40">None</p>
            )}
        </div>
    );
}
