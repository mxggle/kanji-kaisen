import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Classic practice",
    description: "The classic Kanji Kaisen practice path: learn kanji radical by radical through stroke tracing, quizzes and handwriting challenges.",
    openGraph: { title: "Classic practice", type: "website", siteName: "Kanji Kaisen" },
};

export default function PracticeLayout({ children }: { children: React.ReactNode }) {
    return children;
}
