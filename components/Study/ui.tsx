// Small shared pieces of the study UI.

import { Check } from "lucide-react";

/** The study page's column: centred, 760px, with the top space a Tool title row would bring. */
export const STUDY_COLUMN = "mx-auto w-full max-w-[760px] pt-8 sm:pt-10";

/**
 * A checkbox drawn in the system's line and ink: an empty line-2 box, filled
 * with ink and a tick when on. The native input stays for keyboard and screen
 * readers; it is only made invisible.
 */
export function Checkbox({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
    return (
        <label className="group flex cursor-pointer items-start gap-3">
            <span className="relative mt-px flex size-[18px] shrink-0">
                <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer absolute inset-0 m-0 cursor-pointer opacity-0" />
                <span
                    aria-hidden
                    className="pointer-events-none flex size-full items-center justify-center rounded-[5px] border border-line-2 text-bg transition-colors group-hover:border-ink-3 peer-checked:border-ink peer-checked:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-ink"
                >
                    {checked && <Check className="size-3.5" strokeWidth={3} />}
                </span>
            </span>
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
