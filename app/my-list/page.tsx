import type { Metadata } from "next";
import { PageShell, Breadcrumbs } from "@/components/Atlas/PageShell";
import { MyList } from "@/components/Study/MyList";

export const metadata: Metadata = {
    title: "My list",
    description: "Your saved kanji, marked as still learning or known.",
    robots: { index: false, follow: true },
};

export default function MyListPage() {
    return (
        <PageShell>
            <Breadcrumbs items={[{ href: "/", label: "Home" }, { label: "My list" }]} />
            <MyList />
        </PageShell>
    );
}
