// Small shared controls for the teacher pages, on the One Atlas primitives.

import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";
import { CHIP_CLASS } from "@/components/ui/Chip";

export const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export const BUTTON = buttonClass();

export const BUTTON_MAIN = buttonClass({ variant: "primary" });

export const CHIP = CHIP_CLASS;

/** One of a few options, as pressed chips (A4 · Letter). */
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
        <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
            {options.map((o) => (
                <button key={o.value} type="button" aria-pressed={o.value === value} onClick={() => onChange(o.value)} className={CHIP_CLASS}>
                    {o.label}
                </button>
            ))}
        </div>
    );
}

/** An on/off option as a pressed chip. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
    return (
        <button type="button" aria-pressed={checked} onClick={() => onChange(!checked)} className={cn(CHIP_CLASS)}>
            {label}
        </button>
    );
}
