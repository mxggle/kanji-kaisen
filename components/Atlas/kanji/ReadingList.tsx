import { readingToRomaji, splitReading } from "@/lib/atlas/readings";

/** One reading in KANJIDIC notation: stem, de-emphasized okurigana, romaji below. */
export function Reading({ reading }: { reading: string }) {
    const { prefix, suffix, stem, okurigana } = splitReading(reading);
    return (
        <span className="inline-flex flex-col items-start px-3 py-1.5 bg-card border border-line rounded-lg">
            <span className="text-xl font-japanese leading-tight">
                {suffix && <span className="text-ink-3">-</span>}
                {stem}
                {okurigana && <span className="text-ink-3">{okurigana}</span>}
                {prefix && <span className="text-ink-3">-</span>}
            </span>
            <span className="text-xs text-ink-3">{readingToRomaji(reading)}</span>
        </span>
    );
}

export function ReadingList({ label, hint, readings }: { label: string; hint: string; readings: string[] }) {
    return (
        <div>
            <h3 className="text-ink-3 text-xs uppercase tracking-wider mb-2">
                {label} <span className="normal-case tracking-normal text-ink-3">({hint})</span>
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
                <p className="text-sm text-ink-3">None</p>
            )}
        </div>
    );
}
