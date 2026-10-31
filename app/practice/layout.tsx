import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Classic practice",
    description: "The classic Kanji Kaisen practice path: learn kanji radical by radical through stroke tracing, quizzes and handwriting challenges.",
    openGraph: { title: "Classic practice", type: "website", siteName: "Kanji Kaisen" },
};

// Classic practice keeps its original dark look: the 夜 skin is forced on this
// subtree so its hard-coded colours stay readable when the site is in 墨.
export default function PracticeLayout({ children }: { children: React.ReactNode }) {
    return (
        <div data-skin="night" className="bg-bg text-ink">
            {children}
        </div>
    );
}
