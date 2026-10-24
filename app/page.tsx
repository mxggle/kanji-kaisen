import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Brain, Droplets, Sparkles } from "lucide-react";
import { getAllKanji, getAllRadicals, getCategories, getKanjiByJlpt, getKanjiOfTheDay, JLPT_LEVELS } from "@/lib/atlas";
import { formatReading, readingToRomaji } from "@/lib/atlas/readings";
import { browsePath, kanjiPath, radicalPath } from "@/lib/atlas/paths";
import { SearchBox } from "@/components/Search/SearchBox";
import { JlptBadge, jlptColor } from "@/components/Atlas/JlptBadge";
import { ThemeCard } from "@/components/Atlas/category/ThemeCard";
import { FloatingKanji } from "@/components/Home/FloatingKanji";
import { RadicalDemo } from "@/components/Home/RadicalDemo";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { title: "Kanji Kaisen – kanji atlas", description: SITE_DESCRIPTION, url: "/", type: "website", siteName: "Kanji Kaisen" },
};

// Kanji of the day is picked from the date; rebuild the page hourly so it rolls over.
export const revalidate = 3600;

const FEATURED_RADICALS = ["氵", "木", "火", "亻", "口", "扌", "糸", "言", "心", "土", "日", "艹"];

const STROKE_BANDS = [
  { label: "1–3", min: 1, max: 3 },
  { label: "4–5", min: 4, max: 5 },
  { label: "6–7", min: 6, max: 7 },
  { label: "8–9", min: 8, max: 9 },
  { label: "10–12", min: 10, max: 12 },
  { label: "13–15", min: 13, max: 15 },
  { label: "16+", min: 16, max: 30 },
];

export default function HomePage() {
  const allKanji = getAllKanji();
  const radicals = getAllRadicals();
  const categories = getCategories();
  const today = getKanjiOfTheDay();
  const featured = FEATURED_RADICALS
    .map((char) => radicals.find((r) => r.char === char && r.kanjiCount > 0))
    .filter((r) => r !== undefined);
  const strokeCounts = STROKE_BANDS.map((band) => ({
    ...band,
    count: allKanji.filter((k) => k.strokeCount >= band.min && k.strokeCount <= band.max).length,
  }));
  const exampleCount = allKanji.reduce((sum, k) => sum + k.examples.length, 0);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 relative">
      {/* Hero: brand, pitch, search */}
      <section className="relative flex items-center justify-center overflow-hidden pt-28 pb-16 md:pt-32 md:pb-24">
        <FloatingKanji />
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-950/20 via-black to-slate-950/20" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="z-10 w-full max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm mb-6 font-medium text-blue-200 backdrop-blur-sm">
                <Sparkles size={14} className="text-yellow-400" />
                <span>A free kanji atlas</span>
              </div>

              <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tighter">
                <span className="block bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">漢字</span>
                <span className="block text-3xl md:text-4xl text-gray-500 font-japanese mt-2 tracking-widest">KANJI KAISEN</span>
              </h1>

              <h2 className="text-2xl md:text-3xl font-bold mb-3 leading-tight">
                Logic, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Not Magic.</span>
              </h2>
              <p className="text-base md:text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed mb-6">
                Most kanji are built from smaller parts. Learn the <span className="text-white font-medium">radicals</span> and
                a wall of strokes turns into a few familiar pieces. Every kanji here has stroke order, readings, example
                words and the story of its radical.
              </p>

              <div className="max-w-lg mx-auto lg:mx-0 mb-6">
                <SearchBox variant="hero" placeholder="Search: water, みず, mizu or 水" />
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                <Link href="/browse" className="group inline-flex items-center gap-3 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-blue-50 transition-colors">
                  Browse kanji
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href={browsePath({ jlpt: "N5" })} className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold border border-[var(--n5)] text-[var(--n5)] hover:bg-[var(--n5)]/10 transition-colors">
                  Start with N5
                </Link>
              </div>

              <dl className="flex justify-center lg:justify-start gap-6 mt-8">
                <div className="flex flex-col">
                  <dt className="order-2 text-xs text-gray-500 uppercase tracking-widest">Kanji</dt>
                  <dd className="text-2xl md:text-3xl font-bold text-pink-500">{allKanji.length.toLocaleString("en")}</dd>
                </div>
                <div className="w-px bg-white/10 h-12" />
                <div className="flex flex-col">
                  <dt className="order-2 text-xs text-gray-500 uppercase tracking-widest">Radicals</dt>
                  <dd className="text-2xl md:text-3xl font-bold text-blue-500">{radicals.length}</dd>
                </div>
                <div className="w-px bg-white/10 h-12" />
                <div className="flex flex-col">
                  <dt className="order-2 text-xs text-gray-500 uppercase tracking-widest">Example words</dt>
                  <dd className="text-2xl md:text-3xl font-bold text-emerald-500">{exampleCount.toLocaleString("en")}</dd>
                </div>
              </dl>
            </div>

            <RadicalDemo />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 space-y-20 pb-24 relative z-10">
        {/* Kanji of the day + JLPT */}
        <section className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
          <Link
            href={kanjiPath(today.char)}
            className="group rounded-3xl border border-white/10 bg-white/5 p-6 flex gap-5 items-center hover:border-[var(--accent)] transition-colors"
          >
            <span className="text-7xl font-japanese font-bold shrink-0">{today.char}</span>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-white/50 mb-1">Kanji of the day</p>
              <p className="text-xl font-bold truncate">{today.meanings.slice(0, 3).join(", ")}</p>
              <p className="text-sm text-white/60 font-japanese mt-1 truncate">
                {[...today.onyomi.slice(0, 2), ...today.kunyomi.slice(0, 2)].map(formatReading).join("・")}
              </p>
              <p className="text-xs text-white/40 mt-0.5 truncate">
                {[...today.onyomi.slice(0, 2), ...today.kunyomi.slice(0, 2)].map(readingToRomaji).join(", ")}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <JlptBadge level={today.jlpt} />
                <span className="text-sm text-[var(--accent)] group-hover:underline">Stroke order & examples →</span>
              </div>
            </div>
          </Link>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold mb-1">Browse by JLPT level</h2>
            <p className="text-sm text-white/50 mb-4">Levels are unofficial; they follow the community lists most learners use.</p>
            <ul className="grid grid-cols-5 gap-2">
              {JLPT_LEVELS.map((level) => (
                <li key={level}>
                  <Link
                    href={browsePath({ jlpt: level })}
                    className="flex flex-col items-center rounded-2xl border border-white/10 py-3 hover:bg-white/10 transition-colors"
                    style={{ borderBottomColor: jlptColor(level), borderBottomWidth: 4 }}
                  >
                    <span className="text-lg font-bold" style={{ color: jlptColor(level) }}>{level}</span>
                    <span className="text-xs text-white/50">{getKanjiByJlpt(level).length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Themes */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold">Ten themes</h2>
              <p className="text-white/50">Radicals grouped by what they depict: nature, the body, tools and more.</p>
            </div>
            <Link href="/categories" className="shrink-0 text-sm text-[var(--accent)] hover:underline">All themes →</Link>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <li key={category.slug}>
                <ThemeCard category={category} />
              </li>
            ))}
          </ul>
        </section>

        {/* Featured radicals */}
        <section>
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-3xl font-bold">Start with the big radicals</h2>
              <p className="text-white/50">A handful of radicals appear in hundreds of kanji.</p>
            </div>
            <Link href="/radicals" className="shrink-0 text-sm text-[var(--accent)] hover:underline">All radicals →</Link>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {featured.map((r) => (
              <li key={r.key}>
                <Link href={radicalPath(r.key)} className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-[var(--accent)] transition-colors">
                  <span className="text-4xl font-japanese font-bold">{r.char}</span>
                  <span className="mt-1 text-sm font-medium">{r.name}</span>
                  <span className="text-xs text-white/50 truncate max-w-full">{r.meaning}</span>
                  <span className="mt-1 text-xs text-white/40">{r.kanjiCount} kanji</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Stroke count */}
        <section>
          <h2 className="text-3xl font-bold mb-1">Browse by stroke count</h2>
          <p className="text-white/50 mb-6">Handy when you can count a kanji&apos;s strokes but can&apos;t read it yet.</p>
          <ul className="flex flex-wrap gap-2">
            {strokeCounts.map((band) => (
              <li key={band.label}>
                <Link
                  href={`/browse?min=${band.min}&max=${band.max}&sort=strokes`}
                  className="inline-flex items-baseline gap-2 rounded-full border border-white/15 px-4 py-2 hover:border-[var(--accent)] transition-colors"
                >
                  <span className="font-bold">{band.label} strokes</span>
                  <span className="text-xs text-white/50">{band.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Three pillars */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How Kanji Kaisen explains kanji</h2>
            <p className="text-gray-400 text-lg">Three ideas behind every page</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-purple-950/40 to-purple-900/10 border border-purple-500/20">
              <div className="w-14 h-14 mb-5 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <BookOpen className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-purple-200">Stories</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Each radical comes with a short <span className="text-white">memory story</span> that links its shape to its
                meaning, plus where it usually sits in a kanji and how it shifts the meaning.
              </p>
            </div>
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-blue-950/40 to-blue-900/10 border border-blue-500/20">
              <div className="w-14 h-14 mb-5 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Droplets className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-200">Elements</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Radicals such as water (氵), fire (火) and earth (土) are the building blocks. Open one to see every kanji
                in the atlas that uses it.
              </p>
            </div>
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-emerald-900/10 border border-emerald-500/20">
              <div className="w-14 h-14 mb-5 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Brain className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-emerald-200">Logic</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Many kanji pair a meaning part with a sound part: in 海, 氵 says &ldquo;water&rdquo; and 每 hints at the
                reading. Spotting the pattern helps you <span className="text-white">guess unfamiliar kanji</span>.
              </p>
            </div>
          </div>
        </section>

        {/* Study + classic practice */}
        <section className="rounded-3xl border border-white/10 bg-zinc-900/40 p-8 text-center">
          <h2 className="text-3xl font-bold mb-3">Keep the ones you want to learn</h2>
          <p className="text-white/60 max-w-2xl mx-auto mb-6">
            Save kanji to My list, mark them as still learning or known, and review them with flashcards or a quick quiz.
            No hearts, no streaks, no lock-outs. Prefer a guided path? The classic step-by-step practice is still here.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/study" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-blue-50 transition-colors">
              Study <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/practice" prefetch={false} className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold border border-white/20 hover:bg-white/10 transition-colors">
              Classic practice
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
