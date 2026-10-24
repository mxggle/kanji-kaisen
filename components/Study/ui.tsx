// Small shared pieces of the study UI.

export function Checkbox({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
    return (
        <label className="flex items-start gap-3 cursor-pointer">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[var(--accent)] shrink-0"
            />
            <span className="text-sm">
                {label}
                {hint && <span className="block text-xs text-white/50 mt-0.5">{hint}</span>}
            </span>
        </label>
    );
}

export function SessionSkeleton() {
    return (
        <div aria-busy="true" aria-label="Loading deck" className="space-y-4">
            <div className="h-9 w-48 rounded bg-white/5 animate-pulse" />
            <div className="h-64 rounded-2xl bg-white/5 border border-white/10 animate-pulse" />
        </div>
    );
}
