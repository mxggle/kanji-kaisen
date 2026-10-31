import { Presentation, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { ActionBar } from "@/components/ui/ActionBar";
import { Button, buttonClass } from "@/components/ui/Button";
import { LearnButton } from "@/components/Learn/LearnButton";
import { ShareCardButton } from "@/components/ShareCard/ShareCardButton";
import type { ShareCardInput } from "@/lib/share-card";
import { MoreMenu } from "./MoreMenu";
import { SaveButton } from "./SaveButton";

const MENU_ITEM = "h-11 w-full justify-start rounded-xl px-3";

const hrefs = (char: string) => {
    const k = encodeURIComponent(char);
    return { print: `/teach/print?k=${k}`, present: `/teach/present?k=${k}` };
};

/**
 * Desktop: Learn it (the one primary), Save, then the quiet card · print ·
 * present. Below 1024px the ActionBar takes over.
 */
export function KanjiActions({ char, card }: { char: string; card: ShareCardInput }) {
    const { print, present } = hrefs(char);
    return (
        <div role="group" aria-label="Actions" className="hidden flex-wrap items-center gap-2.5 lg:flex">
            <LearnButton char={char} />
            <SaveButton char={char} />
            <span aria-hidden className="flex-1" />
            <ShareCardButton {...card} className="[&_svg]:hidden" />
            <Button variant="quiet" href={print} prefetch={false} rel="nofollow">
                Print sheet
            </Button>
            <Button variant="quiet" href={present} prefetch={false} rel="nofollow">
                Present
            </Button>
        </div>
    );
}

/** Phones and tablets: Learn it, Save (icon) and More (card, print, present), pinned above the tab bar. */
export function KanjiActionBar({ char, card }: { char: string; card: ShareCardInput }) {
    const { print, present } = hrefs(char);
    return (
        <ActionBar label={`Actions for ${char}`}>
            <LearnButton char={char} />
            <SaveButton char={char} size="md" iconOnly />
            <MoreMenu label="More: card, print, present">
                <ShareCardButton {...card} className={MENU_ITEM} />
                <a href={print} rel="nofollow" className={cn(buttonClass({ variant: "quiet" }), MENU_ITEM)}>
                    <Printer aria-hidden /> Print sheet
                </a>
                <a href={present} rel="nofollow" className={cn(buttonClass({ variant: "quiet" }), MENU_ITEM)}>
                    <Presentation aria-hidden /> Present
                </a>
            </MoreMenu>
        </ActionBar>
    );
}
