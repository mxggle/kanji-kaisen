import { KANJI_DATA } from "@/lib/data";
import { StrokeLearning } from "@/components/StrokeLearning";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

interface PageProps {
    params: Promise<{ char: string }>;
}

function findKanji(char: string) {
    return KANJI_DATA.find(k => k.char === decodeURIComponent(char));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const kanji = findKanji((await params).char);
    if (!kanji) return {};
    const readings = [...kanji.onyomi, ...kanji.kunyomi].join(", ");
    const title = `${kanji.char} — meaning, readings and stroke order (${kanji.jlpt})`;
    const description = `${kanji.char} means "${kanji.meaning}". Readings: ${readings}. ${kanji.strokeCount} strokes, JLPT ${kanji.jlpt}. Practice writing it with stroke-by-stroke feedback.`;
    const path = `/kanji/${encodeURIComponent(kanji.char)}`;
    return {
        title,
        description,
        alternates: { canonical: path },
        openGraph: { title, description, url: path },
    };
}

export default async function KanjiPage({ params }: PageProps) {
    const kanji = findKanji((await params).char);

    if (!kanji) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header / Back */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-white/60 hover:text-[var(--accent)] transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Left Column: Big Char & Stroke Learning */}
                    <div className="space-y-8">
                        <div className="flex justify-center">
                            <div className="aspect-square w-48 md:w-64 flex items-center justify-center bg-white/5 rounded-3xl border border-white/10 text-9xl font-bold font-japanese">
                                {kanji.char}
                            </div>
                        </div>

                        <StrokeLearning kanji={kanji.char} />
                    </div>

                    {/* Right Column: Details */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">{kanji.meaning}</h1>
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-[var(--accent)]/20 text-[var(--accent)] rounded-full text-sm font-medium border border-[var(--accent)]/30">
                                    {kanji.jlpt}
                                </span>
                                <span className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-sm border border-white/10">
                                    {kanji.strokeCount} Strokes
                                </span>
                                <span className="px-3 py-1 bg-white/10 text-white/80 rounded-full text-sm border border-white/10">
                                    Frag: {kanji.frequency}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-white/40 text-sm uppercase tracking-wider mb-2">Onyomi (Chinese)</h3>
                                <div className="flex flex-wrap gap-2">
                                    {kanji.onyomi.map((reading) => (
                                        <span key={reading} className="px-3 py-1.5 bg-white/5 rounded-md text-lg">
                                            {reading}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-white/40 text-sm uppercase tracking-wider mb-2">Kunyomi (Japanese)</h3>
                                <div className="flex flex-wrap gap-2">
                                    {kanji.kunyomi.map((reading) => (
                                        <span key={reading} className="px-3 py-1.5 bg-white/5 rounded-md text-lg">
                                            {reading}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Examples could go here if available in data */}
                    </div>
                </div>
            </div>
        </div>
    );
}
