// Small shared controls for the teacher pages.

import { cn } from "@/lib/utils";

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export const BUTTON =
    "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-full border border-line-2 text-sm text-ink hover:border-accent transition-colors disabled:opacity-50 disabled:pointer-events-none " +
    FOCUS;

export const BUTTON_MAIN =
    "inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-accent border border-accent text-onacc text-sm font-bold hover:bg-ink hover:border-ink hover:text-bg transition-colors disabled:opacity-50 disabled:pointer-events-none " +
    FOCUS;

export const CHIP =
    "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border border-line-2 text-sm text-ink-2 hover:text-ink hover:border-ink-3 transition-colors aria-pressed:bg-ink aria-pressed:border-ink aria-pressed:text-bg " +
    FOCUS;

export function Segmented<T extends string>({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
}) {
    return (
        <div role="group" aria-label={label} className="flex items-center gap-2">
            <span className="text-ink-3" aria-hidden>{label}</span>
            <div className="inline-flex overflow-hidden rounded-full border border-line-2">
                {options.map((o) => (
                    <button
                        key={o.value}
                        type="button"
                        aria-pressed={o.value === value}
                        onClick={() => onChange(o.value)}
                        className={cn(
                            "h-8 px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent",
                            o.value === value ? "bg-ink text-bg" : "text-ink-2 hover:text-ink",
                        )}
                    >
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
    return (
        <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[var(--accent)]" />
            <span>{label}</span>
        </label>
    );
}
