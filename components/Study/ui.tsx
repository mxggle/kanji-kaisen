// Small shared pieces of the study UI.

/** The study page's column: centred, 760px, with the top space a Tool title row would bring. */
export const STUDY_COLUMN = "mx-auto w-full max-w-[760px] pt-8 sm:pt-10";

export function Checkbox({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
    return (
        <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-ink" />
            <span className="text-sm text-ink">
                {label}
                {hint && <span className="mt-0.5 block text-xs text-ink-3">{hint}</span>}
            </span>
        </label>
    );
}

export function SessionSkeleton() {
    return (
        <div aria-busy="true" aria-label="Loading deck" className="flex flex-col gap-4">
            <div className="h-9 w-48 animate-pulse rounded-full bg-card" />
            <div className="h-64 animate-pulse rounded-2xl border border-line bg-card" />
        </div>
    );
}
