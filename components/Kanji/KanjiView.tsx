"use client";

import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tabs, tabId, tabPanelId, type TabItem } from "@/components/ui/Tabs";
import styles from "./kanji.module.css";

// One set of tabs for the plate. Desktop: Parts · Strokes · Ancient in the
// specimen, readings in the reading column. Phones: Readings · Strokes ·
// Ancient, where the reading column is the Readings panel. Panels are
// server-rendered children; before hydration CSS shows each breakpoint's default.

export type KanjiViewValue = "parts" | "readings" | "strokes" | "ancient";

const ID = "kanji-view";
const WIDE = "(min-width: 960px)";

function subscribe(onChange: () => void) {
    const query = window.matchMedia(WIDE);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
}

/** True on phones, false from 960px (the Plate's breakpoint), null before hydration. */
function usePhone(): boolean | null {
    return useSyncExternalStore(
        subscribe,
        () => !window.matchMedia(WIDE).matches,
        () => null,
    );
}

interface ViewState {
    desk: KanjiViewValue;
    phone: KanjiViewValue;
    isPhone: boolean | null;
    /** The learner has switched tabs: from now on a panel that opens cross-fades in. */
    switched: boolean;
    pick: (value: KanjiViewValue) => void;
}

const ViewContext = createContext<ViewState | null>(null);

function useView(): ViewState {
    const view = useContext(ViewContext);
    if (!view) throw new Error("KanjiView parts must sit inside <KanjiView>");
    return view;
}

/** Holds the selected tab for each breakpoint. `desk` is the desktop default (parts, else strokes). */
export function KanjiView({ desk: deskDefault, children }: { desk: KanjiViewValue; children: ReactNode }) {
    const isPhone = usePhone();
    const [desk, setDesk] = useState<KanjiViewValue>(deskDefault);
    const [phone, setPhone] = useState<KanjiViewValue>("readings");
    const [switched, setSwitched] = useState(false);
    const pick = (value: KanjiViewValue) => {
        const next = isPhone ? (value === "parts" ? "readings" : value) : value === "readings" ? deskDefault : value;
        if (next !== (isPhone ? phone : desk)) setSwitched(true);
        if (isPhone) setPhone(next);
        else setDesk(next);
    };
    return <ViewContext.Provider value={{ desk, phone, isPhone, switched, pick }}>{children}</ViewContext.Provider>;
}

const JP: Record<KanjiViewValue, string> = { parts: "形", readings: "読", strokes: "筆", ancient: "古" };
const LABEL: Record<KanjiViewValue, string> = { parts: "Parts", readings: "Readings", strokes: "Strokes", ancient: "Ancient" };

/**
 * The plate's tab list. Parts shows only from 960px, Readings only below it;
 * the hidden one is also disabled once hydrated, so arrow keys skip it.
 */
export function KanjiViewTabs({ values, className }: { values: readonly KanjiViewValue[]; className?: string }) {
    const { desk, phone, isPhone, pick } = useView();
    const items: TabItem<KanjiViewValue>[] = values.map((value) => ({
        value,
        label: LABEL[value],
        jp: JP[value],
        disabled: (value === "parts" && isPhone === true) || (value === "readings" && isPhone === false),
        className: value === "parts" ? "max-[959px]:hidden" : value === "readings" ? "min-[960px]:hidden" : undefined,
    }));
    return (
        <Tabs
            id={ID}
            label="View"
            items={items}
            value={isPhone ? phone : desk}
            onChange={pick}
            className={cn(
                "max-[959px]:flex max-[959px]:w-full max-[959px]:[&>button]:flex-1 max-[959px]:[&>button]:justify-center",
                className,
            )}
        />
    );
}

/** A panel of the plate's tabs. "readings" is a tab panel on phones only; on desktop it always shows. */
export function KanjiViewPanel({ value, children, className }: { value: KanjiViewValue; children: ReactNode; className?: string }) {
    const { desk, phone, isPhone, switched } = useView();
    const onDesk = value === "readings" || desk === value;
    const onPhone = value !== "parts" && phone === value;
    const isTabPanel = value !== "readings" || isPhone === true;
    // A panel is display:none until picked, so its CSS fade (and any entrance
    // inside) replays each time it opens. Not on first paint, and not on the
    // desktop readings, which never hide. --delay is reset so the specimen's
    // own entrance delay doesn't hold up what plays inside a panel.
    return (
        <div
            id={tabPanelId(ID, value)}
            role={isTabPanel ? "tabpanel" : undefined}
            aria-labelledby={isTabPanel ? tabId(ID, value) : undefined}
            className={cn(!onDesk && "min-[960px]:hidden", !onPhone && "max-[959px]:hidden", "[--delay:0ms]", switched && isTabPanel && styles.switched, switched && isTabPanel && value === "readings" && styles.quiet, className)}
        >
            {children}
        </div>
    );
}
