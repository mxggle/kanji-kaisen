"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";
import { useStudyStore, useStudyStoreHydrated } from "@/lib/study-store";
import { Button, type ButtonSize } from "@/components/ui/Button";

/**
 * Save to My list (lib/study-store). A secondary button, or an icon button for
 * the phone action bar; the pressed state shows as a solid ink border. Fires
 * `kanji_saved` like the old StudyControls.
 */
export function SaveButton({ char, size = "lg", iconOnly = false, className }: { char: string; size?: ButtonSize; iconOnly?: boolean; className?: string }) {
    const hydrated = useStudyStoreHydrated();
    const entry = useStudyStore((state) => state.entries[char]);
    const toggle = useStudyStore((state) => state.toggle);
    const saved = hydrated && Boolean(entry);

    const onClick = () => {
        if (!hydrated) return;
        toggle(char);
        trackEvent("kanji_saved", { kanji: char, saved: !saved, source: "kanji_page" });
    };

    return (
        <Button
            size={size}
            iconOnly={iconOnly}
            onClick={onClick}
            aria-pressed={saved}
            aria-label={iconOnly ? `Save ${char} to My list` : undefined}
            className={cn(saved && "border-ink", className)}
        >
            {saved ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
            {!iconOnly && (
                // The name stays "Save 休 to My list"; aria-pressed carries the state.
                <span>
                    Save<span aria-hidden>{saved ? "d" : ""}</span>
                    <span className="sr-only"> {char} to My list</span>
                </span>
            )}
        </Button>
    );
}
