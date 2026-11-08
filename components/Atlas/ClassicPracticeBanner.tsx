import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";

/** Slim notice on the classic practice pages: a tag saying where you are and a quiet way back to the atlas. */
export function ClassicPracticeBanner({ className }: { className?: string }) {
    return (
        <div role="note" className={cn("flex flex-wrap items-center justify-between gap-x-4 gap-y-2", className)}>
            <Tag>Classic practice</Tag>
            <Button variant="quiet" size="sm" href="/">
                Back to the atlas ›
            </Button>
        </div>
    );
}
