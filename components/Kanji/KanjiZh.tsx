import type { ReactNode } from "react";
import { kanjiPath } from "@/lib/atlas/paths";
import Link from "next/link";
import type { ZhFacts } from "./zh";
import { ZhNote } from "./ZhNote";

const Hans = ({ children }: { children: ReactNode }) => (
    <span lang="zh-Hans" className="font-bold text-ink">
        {children}
    </span>
);
const Hant = ({ children }: { children: ReactNode }) => (
    <span lang="zh-Hant" className="font-bold text-ink">
        {children}
    </span>
);
const Ja = ({ children }: { children: ReactNode }) => (
    <span lang="ja" className="font-jp font-bold text-ink">
        {children}
    </span>
);

function relationSentence(char: string, f: ZhFacts): ReactNode {
    const s = f.simplified;
    const t = f.traditional;
    switch (f.relation) {
        case "same":
            return (
                <>
                    Same form: <Ja>{char}</Ja> is written the same way in mainland China (simplified) and in Taiwan and Hong Kong
                    (traditional).
                </>
            );
        case "ja-trad":
            return (
                <>
                    Japan keeps the traditional form <Hant>{t}</Hant>; mainland China simplifies it to <Hans>{s}</Hans>.
                </>
            );
        case "ja-simp":
            return (
                <>
                    Japan uses the same simplified form as mainland China, <Hans>{s}</Hans>. Taiwan and Hong Kong write <Hant>{t}</Hant>.
                </>
            );
        case "ja-only":
            return (
                <>
                    <Ja>{char}</Ja> is a Japanese simplification. Chinese writes <Hans>{s}</Hans> in both simplified and traditional
                    script.
                </>
            );
        case "all-differ":
            return (
                <>
                    Three different forms: Japanese <Ja>{char}</Ja>, simplified <Hans>{s}</Hans>, traditional <Hant>{t}</Hant>.
                </>
            );
        case "kokuji":
            return (
                <>
                    <Ja>{char}</Ja> is a kokuji, a kanji created in Japan. Chinese has no standard counterpart.
                </>
            );
        default:
            return <>Unihan gives no clear Chinese counterpart for this character.</>;
    }
}

function FalseFriendNote({ char, f }: { char: string; f: ZhFacts }) {
    const ff = f.falseFriend;
    if (!ff) return null;
    if (ff.kind === "different-char") {
        return (
            <p className="rounded-lg border border-dashed border-line-2 px-3 py-2">
                <span className="font-bold text-ink">False friend.</span> Chinese also has a character{" "}
                <Hans>{char}</Hans>
                {ff.pinyin.length > 0 && <> ({ff.pinyin.join(", ")})</>}, but it is a different word. The Chinese for this kanji is{" "}
                {f.simplified === f.traditional ? (
                    <Hans>{f.simplified}</Hans>
                ) : (
                    <>
                        <Hans>{f.simplified}</Hans> (simplified) or <Hant>{f.traditional}</Hant> (traditional)
                    </>
                )}
                .
            </p>
        );
    }
    return (
        <p className="rounded-lg border border-dashed border-line-2 px-3 py-2">
            <span className="font-bold text-ink">False friend.</span> In simplified Chinese, <Hans>{char}</Hans> also stands for{" "}
            {ff.chars.map((o, i) => (
                <span key={o.char}>
                    {i > 0 && (i === ff.chars.length - 1 ? " and " : ", ")}
                    <Link href={kanjiPath(o.char)} prefetch={false} lang="zh-Hant" className="font-bold text-ink hover:text-[var(--c)]">
                        {o.char}
                    </Link>
                    {o.meaning && <> ({o.meaning})</>}
                </span>
            ))}
            , which Japanese writes as {ff.chars.length === 1 ? "a separate kanji" : "separate kanji"}.
        </p>
    );
}

/** The collapsed "In Chinese" probe: forms, pinyin, false friends, credit and the fake door. */
export function KanjiZh({ char, facts }: { char: string; facts: ZhFacts }) {
    const showForms = facts.relation !== "kokuji" && facts.relation !== "unknown" && (facts.simplified || facts.traditional);
    return (
        <ZhNote char={char} relation={facts.relation}>
            <p>{relationSentence(char, facts)}</p>

            {showForms && (
                <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1.5">
                    <dt className="text-ink-3">Simplified</dt>
                    <dd>
                        <span lang="zh-Hans" className="text-2xl text-ink">
                            {facts.simplified ?? "–"}
                        </span>{" "}
                        <span className="text-xs text-ink-3">mainland China, Singapore</span>
                    </dd>
                    <dt className="text-ink-3">Traditional</dt>
                    <dd>
                        <span lang="zh-Hant" className="text-2xl text-ink">
                            {facts.traditional ?? "–"}
                        </span>{" "}
                        <span className="text-xs text-ink-3">Taiwan, Hong Kong</span>
                    </dd>
                </dl>
            )}

            {facts.pinyin.length > 0 && facts.kokuji && (
                <p>
                    Unihan lists the reading <span className="text-ink">{facts.pinyin.join(", ")}</span> for it.
                </p>
            )}

            {facts.pinyin.length > 0 && !facts.kokuji && (
                <p>
                    <span className="text-ink-3">Pinyin </span>
                    <span className="text-lg text-ink">{facts.pinyin.join(", ")}</span>{" "}
                    <span className="text-xs text-ink-3">
                        {facts.pinyinTruncated ? "most common only" : facts.pinyin.length > 1 ? "most common readings" : "most common reading"}
                    </span>
                </p>
            )}

            {facts.alsoTraditional.length > 0 && (
                <p>
                    <Ja>{char}</Ja> also replaced{" "}
                    {facts.alsoTraditional.map((c, i) => (
                        <span key={c}>
                            {i > 0 && (i === facts.alsoTraditional.length - 1 ? " and " : ", ")}
                            <Hant>{c}</Hant>
                        </span>
                    ))}
                    , which Chinese keeps apart.
                </p>
            )}

            <FalseFriendNote char={char} f={facts} />

            <p className="text-xs text-ink-3">
                Forms and pinyin:{" "}
                <a href="https://www.unicode.org/charts/unihan.html" className="underline underline-offset-2 hover:text-ink" rel="noopener">
                    Unicode Unihan database
                </a>{" "}
                (Unicode License v3). Pinyin lists the most common reading, not every reading.
            </p>
        </ZhNote>
    );
}
