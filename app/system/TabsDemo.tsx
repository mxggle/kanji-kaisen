"use client";

import { useId, useState } from "react";
import { Tabs, tabId, tabPanelId } from "@/components/ui/Tabs";

const VIEWS = [
    { value: "parts", jp: "形", label: "Parts" },
    { value: "strokes", jp: "筆", label: "Strokes" },
    { value: "ancient", jp: "古", label: "Ancient" },
] as const;

const STEPS = ["meet", "recall", "trace", "write"] as const;
const STEP_LABELS = { meet: ["会", "Meet"], recall: ["想", "Recall"], trace: ["描", "Trace"], write: ["書", "Write"] } as const;

/** /system: the specimen tabs, and the learn steps with the current one live. */
export function TabsDemo() {
    const id = useId();
    const [view, setView] = useState<(typeof VIEWS)[number]["value"]>("parts");
    const [step, setStep] = useState<(typeof STEPS)[number]>("recall");
    return (
        <div className="flex flex-col gap-4">
            <Tabs id={`${id}v`} label="View" items={VIEWS} value={view} onChange={setView} />
            <p role="tabpanel" id={tabPanelId(`${id}v`, view)} aria-labelledby={tabId(`${id}v`, view)} className="text-sm text-ink-2">
                Panel: {view}. Arrow keys, Home and End move between tabs.
            </p>
            <Tabs
                id={`${id}s`}
                label="Learn steps"
                items={STEPS.map((s) => ({ value: s, jp: STEP_LABELS[s][0], label: STEP_LABELS[s][1], live: s === step }))}
                value={step}
                onChange={setStep}
            />
            <p role="tabpanel" id={tabPanelId(`${id}s`, step)} aria-labelledby={tabId(`${id}s`, step)} className="text-sm text-ink-2">
                The current step is live (lit in 夜, plain in 墨).
            </p>
        </div>
    );
}
