// Pure ink logic (see lib/ink-store.ts). Each kanji has one of five shades of
// ink. Shades rise through the four-step loop (meet, recall, trace, write) or
// when the learner marks them by hand. Wrong answers never lower a shade.

export type Shade = 0 | 1 | 2 | 3 | 4;
export type InkStep = "meet" | "recall" | "trace" | "write";

export const SHADES: readonly Shade[] = [0, 1, 2, 3, 4];
export const SHADE_JP = ["白", "淡", "中", "濃", "印"] as const;
export const SHADE_NAMES = ["Not met", "Met", "Learning", "Familiar", "Mastered"] as const;

/** "印 Mastered" style label. */
export function shadeLabel(shade: Shade): string {
    return `${SHADE_JP[shade]} ${SHADE_NAMES[shade]}`;
}

export interface InkEntry {
    shade: Shade;
    updatedAt: string;
    /** A meaning recall answered right. */
    recall?: true;
    /** Every stroke traced. */
    trace?: true;
    /** Distinct local days (YYYY-MM-DD) with a correct write, at most two. */
    writeDays?: string[];
    /** Time of the first correct write. */
    firstWrite?: string;
}

export type InkEntries = Record<string, InkEntry>;

const DAY_MS = 24 * 60 * 60 * 1000;
export const MASTERY_DAYS = 21;

export function isShade(value: unknown): value is Shade {
    return value === 0 || value === 1 || value === 2 || value === 3 || value === 4;
}

/** Local calendar day, so "two different days" means the learner's days. */
export function dayKey(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function getShade(entries: InkEntries, char: string): Shade {
    return entries[char]?.shade ?? 0;
}

const maxShade = (a: Shade, b: Shade): Shade => (a > b ? a : b);

function withEntry(entries: InkEntries, char: string, entry: InkEntry): InkEntries {
    return { ...entries, [char]: entry };
}

/**
 * Records one step of the loop.
 * - meet → at least 淡 (1)
 * - recall ok and trace ok (any order) → at least 中 (2)
 * - write ok on two different days → at least 濃 (3)
 * - write ok 21+ days after the first ok write → 印 (4)
 * A shade never goes down here, and a step that isn't ok changes nothing.
 * Returns the same object when nothing changed.
 */
export function recordStep(entries: InkEntries, char: string, step: InkStep, ok: boolean, now = new Date()): InkEntries {
    const prev = entries[char];
    const current: Shade = prev?.shade ?? 0;

    if (step === "meet") {
        if (current >= 1) return entries;
        return withEntry(entries, char, { ...prev, shade: 1, updatedAt: now.toISOString() });
    }
    if (!ok) return entries;

    const next: InkEntry = { ...prev, shade: current, updatedAt: prev?.updatedAt ?? now.toISOString() };
    let shade = current;

    if (step === "recall") next.recall = true;
    if (step === "trace") next.trace = true;
    if (next.recall && next.trace) shade = maxShade(shade, 2);

    if (step === "write") {
        const day = dayKey(now);
        const days = next.writeDays ?? [];
        if (!days.includes(day) && days.length < 2) next.writeDays = [...days, day];
        if (!next.firstWrite) next.firstWrite = now.toISOString();
        if ((next.writeDays?.length ?? 0) >= 2) shade = maxShade(shade, 3);
        if (now.getTime() - Date.parse(next.firstWrite) >= MASTERY_DAYS * DAY_MS) shade = 4;
    }

    const changedEvidence =
        next.recall !== prev?.recall ||
        next.trace !== prev?.trace ||
        next.firstWrite !== prev?.firstWrite ||
        (next.writeDays?.length ?? 0) !== (prev?.writeDays?.length ?? 0);
    if (shade === current && !changedEvidence) return entries;

    next.shade = shade;
    if (shade !== current) next.updatedAt = now.toISOString();
    return withEntry(entries, char, next);
}

/**
 * Self-marking: sets any shade, up or down. Evidence that would imply a
 * higher shade than the one chosen is dropped, so the next step doesn't
 * jump straight back up. Returns the same object when nothing changed.
 */
export function setShade(entries: InkEntries, char: string, shade: Shade, now = new Date()): InkEntries {
    const prev = entries[char];
    if ((prev?.shade ?? 0) === shade) return entries;
    if (shade === 0) {
        const next = { ...entries };
        delete next[char];
        return next;
    }
    const next: InkEntry = { ...prev, shade, updatedAt: now.toISOString() };
    if (shade < 2) {
        delete next.recall;
        delete next.trace;
    }
    if (shade < 3) {
        delete next.writeDays;
        delete next.firstWrite;
    } else if (shade < 4 && prev?.shade === 4 && next.firstWrite) {
        // Marked down from 印: mastery needs three more weeks from now.
        next.firstWrite = now.toISOString();
    }
    return withEntry(entries, char, next);
}

export interface ThemeProgress {
    /** Σshade / (4·N), from 0 to 1. */
    painted: number;
    /** Kanji at 濃 or 印. */
    known: number;
    /** Kanji at 淡 or above. */
    met: number;
    /** Distinct kanji counted. */
    total: number;
}

/** Progress over a set of kanji (duplicates count once). */
export function themeProgress(entries: InkEntries, chars: Iterable<string>): ThemeProgress {
    const unique = new Set(chars);
    let sum = 0;
    let known = 0;
    let met = 0;
    for (const char of unique) {
        const shade = getShade(entries, char);
        sum += shade;
        if (shade >= 3) known += 1;
        if (shade >= 1) met += 1;
    }
    const total = unique.size;
    return { painted: total === 0 ? 0 : sum / (4 * total), known, met, total };
}

/** Whole percent for captions: a little ink never rounds to 0, a gap never rounds to 100. */
export function paintedPercent(painted: number): number {
    if (painted <= 0) return 0;
    if (painted >= 1) return 100;
    return Math.min(99, Math.max(1, Math.round(painted * 100)));
}

/**
 * One-time migration from the saved-kanji list (`kanji-study-list` entries):
 * known → 濃 (3), learning → 中 (2). Existing shades are never lowered.
 */
export function migrateFromStudyList(entries: InkEntries, studyEntries: unknown, now = new Date()): InkEntries {
    if (!studyEntries || typeof studyEntries !== "object") return entries;
    let next = entries;
    for (const [char, value] of Object.entries(studyEntries as Record<string, unknown>)) {
        if (!value || typeof value !== "object") continue;
        const { status, updatedAt } = value as { status?: unknown; updatedAt?: unknown };
        const shade: Shade | null = status === "known" ? 3 : status === "learning" ? 2 : null;
        if (shade === null || getShade(next, char) >= shade) continue;
        next = withEntry(next, char, {
            ...next[char],
            shade,
            updatedAt: typeof updatedAt === "string" ? updatedAt : now.toISOString(),
        });
    }
    return next;
}

/** The entries inside the persisted study list JSON (`{ state: { entries } }`). */
export function studyEntriesFromJson(raw: string | null): unknown {
    if (!raw) return null;
    try {
        return (JSON.parse(raw) as { state?: { entries?: unknown } } | null)?.state?.entries ?? null;
    } catch {
        return null;
    }
}

/** Drops malformed entries from persisted state. */
export function sanitizeInk(value: unknown): InkEntries {
    if (!value || typeof value !== "object") return {};
    const result: InkEntries = {};
    for (const [char, raw] of Object.entries(value as Record<string, unknown>)) {
        const e = raw as Partial<InkEntry> | null;
        if (!e || !isShade(e.shade) || e.shade === 0 || typeof e.updatedAt !== "string") continue;
        const entry: InkEntry = { shade: e.shade, updatedAt: e.updatedAt };
        if (e.recall === true) entry.recall = true;
        if (e.trace === true) entry.trace = true;
        if (Array.isArray(e.writeDays)) {
            const days = e.writeDays.filter((d): d is string => typeof d === "string").slice(0, 2);
            if (days.length) entry.writeDays = days;
        }
        if (typeof e.firstWrite === "string") entry.firstWrite = e.firstWrite;
        result[char] = entry;
    }
    return result;
}
