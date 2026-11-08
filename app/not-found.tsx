import { DocumentPage } from "@/components/Layout/Document";
import { Button } from "@/components/ui/Button";
import { enterOrder } from "@/components/Motion/tokens";

// Token-styled 404 so both skins apply (Next's default page sets its own colours).
export default function NotFound() {
    return (
        <DocumentPage jp="無" kind="Not found" title="Page not found" lede={<p>This page doesn&apos;t exist. Try searching for a kanji instead.</p>}>
            <div data-enter="rise" style={enterOrder(5)} className="-mt-6 flex flex-wrap gap-2.5">
                <Button variant="primary" href="/">
                    Go to Learn
                </Button>
                <Button href="/search">Search</Button>
            </div>
        </DocumentPage>
    );
}
