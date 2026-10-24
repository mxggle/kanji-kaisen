// Pure helpers for the saved-kanji list (see lib/study-store.ts).

export type StudyStatus = "learning" | "known";

export interface StudyEntry {
    status: StudyStatus;
    addedAt: string;
    updatedAt: string;
}

export type StudyEntries = Record<string, StudyEntry>;

const nowIso = (now: Date) => now.toISOString();

export function saveKanji(entries: StudyEntries, char: string, now = new Date(), status: StudyStatus = "learning"): StudyEntries {
    if (entries[char]) return entries;
    const at = nowIso(now);
    return { ...entries, [char]: { status, addedAt: at, updatedAt: at } };
}

export function unsaveKanji(entries: StudyEntries, char: string): StudyEntries {
    if (!entries[char]) return entries;
    const next = { ...entries };
    delete next[char];
    return next;
}

export function toggleSaved(entries: StudyEntries, char: string, now = new Date()): StudyEntries {
    return entries[char] ? unsaveKanji(entries, char) : saveKanji(entries, char, now);
}

/** Sets the status, saving the kanji first if needed. */
export function setStatus(entries: StudyEntries, char: string, status: StudyStatus, now = new Date()): StudyEntries {
    const existing = entries[char];
    if (existing?.status === status) return entries;
    const at = nowIso(now);
    return { ...entries, [char]: { status, addedAt: existing?.addedAt ?? at, updatedAt: at } };
}

/** Saved characters, newest first, optionally filtered by status. */
export function listSaved(entries: StudyEntries, status?: StudyStatus): string[] {
    return Object.entries(entries)
        .filter(([, entry]) => !status || entry.status === status)
        .sort(([a, x], [b, y]) => y.addedAt.localeCompare(x.addedAt) || a.localeCompare(b))
        .map(([char]) => char);
}

export function countByStatus(entries: StudyEntries): Record<StudyStatus | "all", number> {
    const counts = { all: 0, learning: 0, known: 0 };
    for (const entry of Object.values(entries)) {
        counts.all += 1;
        counts[entry.status] += 1;
    }
    return counts;
}

/** Drops malformed entries from persisted state. */
export function sanitizeEntries(value: unknown): StudyEntries {
    if (!value || typeof value !== "object") return {};
    const result: StudyEntries = {};
    for (const [char, entry] of Object.entries(value as Record<string, unknown>)) {
        const e = entry as Partial<StudyEntry> | null;
        if (!e || (e.status !== "learning" && e.status !== "known")) continue;
        if (typeof e.addedAt !== "string" || typeof e.updatedAt !== "string") continue;
        result[char] = { status: e.status, addedAt: e.addedAt, updatedAt: e.updatedAt };
    }
    return result;
}
