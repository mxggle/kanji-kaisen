import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
import { Bookmark, Ellipsis, Printer } from "lucide-react";
import { getKanji, getKanjiByCategory, getKanjiByJlpt, getKanjiByRadical, getKanjiList } from "@/lib/atlas";
import { CATEGORIES, THEME_SHORT, getThemeColor } from "@/lib/atlas/categories";
import { categoryPath, kanjiPath, radicalPath } from "@/lib/atlas/paths";
import { kanjivgFileName } from "@/lib/atlas/kanjivg-svg";
import { extractStrokes } from "@/components/Kanji/strokes";
import { SHADES, SHADE_JP, SHADE_NAMES } from "@/lib/ink";
import { compareByFrequency } from "@/components/Theme/order";
import { PageShell } from "@/components/Atlas/PageShell";
import { InkPaint } from "@/components/Ink/InkPaint";
import { ActionBar } from "@/components/ui/ActionBar";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { InkLegend, InkSwatch } from "@/components/ui/InkLegend";
import { KanjiTile } from "@/components/ui/KanjiTile";
import { MemoryStory } from "@/components/ui/MemoryStory";
import { OriginCard } from "@/components/ui/OriginCard";
import { PaintedBar } from "@/components/ui/PaintedBar";
import { PartChip, PartPlus } from "@/components/ui/PartChip";
import { RadicalSeal } from "@/components/ui/RadicalSeal";
import { ReadingBlock } from "@/components/ui/ReadingBlock";
import { KindLabel, SectionHeader } from "@/components/ui/SectionHeader";
import { Tag } from "@/components/ui/Tag";
import { ThemeGate } from "@/components/ui/ThemeGate";
import { AtlasPath } from "@/components/Layout/AtlasPath";
import { Plate } from "@/components/Layout/Plate";
import { Tool } from "@/components/Layout/Tool";
import { TabsDemo } from "./TabsDemo";
import { MotionLab, type KindDemo } from "./MotionLab";

// Kitchen sink for the One Atlas system (plan 1.5). Not indexed, not in the sitemap.
export const metadata: Metadata = {
    title: "System",
    robots: { index: false, follow: false },
};

const SKINS = [
    { skin: "night", label: "夜 Night · default" },
    { skin: "ink", label: "墨 Ink · daylight and print" },
] as const;

const BODY = getThemeColor("Human Body & People");
const NATURE = getThemeColor("Nature & Elements");
const tc = (color: string) => ({ "--tc": color }) as CSSProperties;

/** Renders its children twice, in a forced 夜 panel and a forced 墨 panel. */
function Both({ children, className, style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
    return (
        <div className="grid gap-4 xl:grid-cols-2">
            {SKINS.map(({ skin, label }) => (
                <div key={skin} data-skin={skin} style={style} className="flex min-w-0 flex-col gap-5 rounded-2xl border border-line bg-bg p-4 text-ink sm:p-6">
                    <p className="type-label">{label}</p>
                    <div className={className}>{children}</div>
                </div>
            ))}
        </div>
    );
}

function Block({ jp, title, aside, children }: { jp: string; title: string; aside?: ReactNode; children: ReactNode }) {
    return (
        <section className="flex flex-col gap-5">
            <SectionHeader jp={jp} title={title} aside={aside} />
            {children}
        </section>
    );
}

function Slot({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={`flex min-h-24 items-center justify-center rounded-xl border border-dashed border-line-2 p-4 text-center text-sm text-ink-3 ${className ?? ""}`}>{children}</div>;
}

/** The stroke-draw specimen: 永, the calligrapher's first character (its strokes hold the eight basic ones). */
const DRAW_CHAR = "永";

function strokesOf(char: string): string[] {
    try {
        const file = path.join(/* turbopackIgnore: true */ process.cwd(), "public", "kanjivg", "kanji", kanjivgFileName(char));
        return extractStrokes(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8")).map((s) => s.d);
    } catch {
        return [];
    }
}

const RULES = [
    ["Colour = theme", "Only the theme colour carries colour. Buttons are ink; JLPT is a plain tag."],
    ["Line = role", "Solid carries meaning, dashed carries sound, grey is form only."],
    ["Fill = your ink", "A kanji's shade shows only as its fill. Groups show one painted bar."],
    ["Story type", "Only memory stories are set in the story style. Sourced origins are roman, with a source."],
    ["Light = live", "Only a stroke being drawn and the current learn step light up, in 夜 only."],
] as const;

export default function SystemPage() {
    const rest = getKanji("休");
    const [tileLg, tileMd, tileSq] = getKanjiList("休池沖");
    const fiveShades = getKanjiList("沖池海水川");
    const live = getKanjiList("休体作海池水川木林森日月");
    const sanzui = [...getKanjiByRadical("sanzui")].sort(compareByFrequency).map((k) => k.char).join("");
    const themeKanji = (name: string) => getKanjiByCategory(name).map((k) => k.char).join("");
    const n5 = getKanjiByJlpt("N5").map((k) => k.char).join("");
    const readings = rest?.wordsByReading.find((g) => g.kind === "on");
    const motionKinds: KindDemo[] = [
        {
            kind: "rise",
            use: "The default: fade up 18px. Cards, rows, the first things on a page.",
            timing: "560ms · --ease-out",
            specimen: tileMd && (
                <div className="w-20">
                    <KanjiTile kanji={tileMd} shade={2} />
                </div>
            ),
        },
        {
            id: "rise-group",
            kind: "rise",
            group: true,
            use: "Each child in turn, --stagger apart, top-left first. Lists and grids.",
            timing: "+55ms each, up to 14",
            specimen: ["一", "二", "三", "四", "五"].map((c) => (
                <span key={c} lang="ja" className="grid size-9 place-items-center rounded-lg border border-line bg-card font-jp text-ink">
                    {c}
                </span>
            )),
        },
        {
            kind: "ink",
            use: "Soaks in from a blur. Titles, glyphs and short story lines only.",
            timing: "760ms · --ease-ink",
            specimen: (
                <span lang="ja" className="font-jp text-[64px] font-extrabold leading-none text-ink">
                    海
                </span>
            ),
        },
        {
            kind: "unroll",
            use: "A hanging scroll unrolling from the top. Theme art and big panels.",
            timing: "900ms · --ease-ink",
            specimen: (
                <span lang="ja" className="flex h-28 w-14 flex-col items-center gap-1.5 rounded-md border border-line-2 bg-card py-3 font-jp text-xl leading-none text-ink">
                    <span>山</span>
                    <span>水</span>
                    <span aria-hidden className="mt-auto size-2 rounded-full bg-c" />
                </span>
            ),
        },
        {
            kind: "stamp",
            use: "A seal pressed onto paper. Seals, and the mark that changed on success.",
            timing: "520ms · --ease-stamp",
            specimen: <RadicalSeal char="木" size="md" shade={3} />,
        },
        {
            kind: "fade",
            use: "Opacity only. Labels, small print, panels that change in place.",
            timing: "480ms · --ease-out",
            specimen: (
                <>
                    <Tag>N5</Tag>
                    <Tag>6 strokes</Tag>
                </>
            ),
        },
        {
            kind: "brush",
            use: "Painted left to right in one stroke. Bars and rules.",
            timing: "700ms · --ease-in-out",
            specimen: <span aria-hidden className="block h-1.5 w-40 rounded-full bg-c" />,
        },
        {
            kind: "drift",
            use: "In from the left 20px. Rails and side panels.",
            timing: "560ms · --ease-out",
            specimen: (
                <ul className="flex flex-col gap-1.5 border-l border-line-2 pl-3 text-sm text-ink-2">
                    <li>JLPT</li>
                    <li>Theme</li>
                    <li>Your ink</li>
                </ul>
            ),
        },
    ];

    return (
        <InkPaint>
            <PageShell className="flex flex-col gap-16 pt-10">
                <header className="flex flex-col gap-4">
                    <KindLabel jp="図鑑">System · round 6</KindLabel>
                    <h1 className="type-title">One atlas, one hand.</h1>
                    <p className="max-w-[68ch] text-base leading-relaxed text-ink-2">
                        Every primitive in <code>components/ui</code> and <code>components/Layout</code>, drawn in both skins whatever the site&apos;s skin is. Pages are checked against this one. Tiles, seals and bars marked “live” fill with your own ink.
                    </p>
                    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {RULES.map(([rule, text], i) => (
                            <li key={rule} className="flex flex-col gap-2 rounded-2xl border border-line bg-card p-4">
                                <span className="type-label">
                                    {i + 1} · {rule}
                                </span>
                                <span className="text-sm text-ink-2">{text}</span>
                            </li>
                        ))}
                    </ol>
                </header>

                <Block jp="文字" title="Type roles" aside="Display type only through type-* utilities">
                    <Both className="flex flex-col gap-4">
                        <p lang="ja" className="font-jp text-[56px] font-extrabold leading-none">
                            休 海 木
                        </p>
                        <p className="type-title">rest, day off</p>
                        <SectionHeader jp="読み方" title="Readings" />
                        <p className="type-label">Memory story · 112 kanji</p>
                        <p className="type-story">“Rest in the shade of a tree.”</p>
                        <p className="text-base leading-relaxed text-ink">Body 16 · Search by meaning, reading or the kanji itself.</p>
                        <p className="text-sm text-ink-2">Small 14 · ink-2 for secondary text.</p>
                        <p className="text-xs text-ink-3">Caption 12 · ink-3 for captions and sources.</p>
                    </Both>
                </Block>

                <Block jp="釦" title="Buttons" aside="Primary is always ink, at most one per screen">
                    <Both className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button variant="primary">Learn it · 4 steps</Button>
                            <Button>Save</Button>
                            <Button variant="quiet">Print</Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button variant="primary" size="sm">
                                Study 12
                            </Button>
                            <Button size="sm">Open radical</Button>
                            <Button variant="quiet" size="sm">
                                <Printer aria-hidden />
                                Print sheet
                            </Button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button variant="primary" size="lg" href="/browse">
                                Continue with 海
                            </Button>
                            <Button size="lg">Study this theme</Button>
                            <Button iconOnly aria-label="Save to My list">
                                <Bookmark aria-hidden />
                            </Button>
                            <Button iconOnly aria-label="More">
                                <Ellipsis aria-hidden />
                            </Button>
                            <Button disabled>Disabled</Button>
                        </div>
                    </Both>
                </Block>

                <Block jp="札" title="Tags and chips" aside="A coloured dot only on a chip that names a theme">
                    <Both className="flex flex-col gap-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <Tag>N5</Tag>
                            <Tag>6 strokes</Tag>
                            <Tag>Grade 1</Tag>
                            <Tag solid>Saved</Tag>
                            <Tag>
                                <InkSwatch shade={1} className="size-3 rounded-[3px]" />
                                {SHADE_JP[1]} {SHADE_NAMES[1]}
                            </Tag>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Chip pressed>All</Chip>
                            <Chip pressed={false} count={80}>
                                N5
                            </Chip>
                            <Chip pressed={false} theme="Nature & Elements">
                                Nature
                            </Chip>
                            <Chip pressed theme="Human Body & People">
                                Body
                            </Chip>
                            <Chip href="/browse?jlpt=N4" count={167}>
                                N4
                            </Chip>
                        </div>
                    </Both>
                </Block>

                <Block jp="見出し" title="Section header and tabs">
                    <Both className="flex flex-col gap-6" style={tc(NATURE)}>
                        <SectionHeader jp="成り立ち" title="Where it comes from" aside="Aside, right" />
                        <TabsDemo />
                    </Both>
                </Block>

                <Block jp="漢字" title="Kanji tile" aside={<InkLegend />}>
                    <Both className="flex flex-col gap-6" style={tc(NATURE)}>
                        <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,.8fr)] items-end gap-3.5">
                            {tileLg && <KanjiTile kanji={tileLg} size="lg" shade={3} />}
                            {tileMd && <KanjiTile kanji={tileMd} shade={2} />}
                            {tileSq && <KanjiTile kanji={tileSq} size="sq" shade={0} />}
                        </div>
                        <div className="grid grid-cols-5 gap-3">
                            {fiveShades.map((k, i) => (
                                <KanjiTile key={k.char} kanji={k} shade={SHADES[i]} />
                            ))}
                        </div>
                        <p className="text-sm text-ink-2">
                            {SHADES.map((s) => `${SHADE_JP[s]} ${SHADE_NAMES[s]}`).join(" · ")}. Shades rise through the four steps or by hand; a wrong answer never lowers one.
                        </p>
                        <div className="flex flex-col gap-2">
                            <p className="type-label">Live · your ink, each in its own theme colour</p>
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(84px,1fr))] gap-2.5">
                                {live.map((k) => (
                                    <KanjiTile key={k.char} kanji={k} />
                                ))}
                            </div>
                        </div>
                    </Both>
                </Block>

                <Block jp="部首" title="Radical seal" aside="A seal's fill is the mean ink of its 8 most common kanji">
                    <Both className="flex flex-wrap items-end gap-5" style={tc(NATURE)}>
                        <RadicalSeal char="木" size="lg" shade={3} name="plate · 96" />
                        <RadicalSeal char="氵" pressed name="selected" shade={2} />
                        <RadicalSeal char="雨" shade={0} name="not met" />
                        <RadicalSeal char="日" size="md" shade={1} name="44" />
                        <RadicalSeal char="山" size="sm" shade={4} name="28" />
                        <RadicalSeal char="氵" chars={sanzui} href={radicalPath("sanzui")} name="water" count="live" />
                        <RadicalSeal char="学" size="md" name="plain" />
                    </Both>
                </Block>

                <Block jp="主題" title="Theme gate" aside="The arch is kept for themes only">
                    <Both className="grid grid-cols-3 gap-3">
                        {(["Nature & Elements", "Human Body & People", "Animals & Wildlife"] as const).map((name) => (
                            <ThemeGate key={name} category={name} chars={themeKanji(name)} source="system" />
                        ))}
                    </Both>
                </Block>

                <Block jp="塗り" title="Painted bar" aside="The only way a group shows progress">
                    <Both className="flex flex-col gap-5" style={tc(NATURE)}>
                        <PaintedBar painted={0.09} known={52} total={619} caption label="Nature & Elements" />
                        <PaintedBar chars={n5} caption label="N5 · live" />
                        <PaintedBar chars={themeKanji("Nature & Elements")} />
                    </Both>
                </Block>

                <Block jp="部分" title="Parts" aside="Line = role; colour from the page's theme">
                    <Both className="flex flex-col gap-4" style={tc(BODY)}>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <PartChip char="亻" role="meaning" label="person" href={radicalPath("ninben")} />
                            <PartPlus />
                            <PartChip char="木" role="form" label="tree" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <PartChip char="氵" role="meaning" label="water" />
                            <PartPlus />
                            <PartChip char="毎" role="sound" label="マイ→カイ" />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <PartChip char="亻" role="meaning" label="person" size="sm" />
                            <PartChip char="青" role="sound" label="セイ" size="sm" />
                            <PartChip char="口" role="form" label="mouth" size="sm" />
                        </div>
                    </Both>
                </Block>

                <Block jp="読み方" title="Reading, origin and memory story">
                    <Both className="flex flex-col gap-4" style={tc(BODY)}>
                        {readings && (
                            <ReadingBlock
                                char="休"
                                stem={readings.reading}
                                label="kyū · on'yomi · in compounds"
                                words={readings.words.slice(0, 4).map((w) => ({ ...w, href: undefined }))}
                                empty="No common words use this reading."
                            />
                        )}
                        <ReadingBlock char="休" stem="やす" okurigana="む" label="yasumu · kun'yomi · on its own" words={[]} empty="No common words use this reading." />
                        <div className="grid gap-3 sm:grid-cols-2">
                            <OriginCard
                                source={
                                    <>
                                        Ideogrammic compound · <a href="https://en.wiktionary.org/wiki/休">Wiktionary</a>, CC BY-SA 4.0
                                    </>
                                }
                            >
                                A man leaning against a tree, resting.
                            </OriginCard>
                            <MemoryStory footer="From the 亻 person story">A person leans on a tree to take a break.</MemoryStory>
                        </div>
                    </Both>
                </Block>

                <Block jp="生" title="Live" aside="A stroke being drawn; nothing in 墨">
                    <Both className="flex items-center gap-4" style={tc(NATURE)}>
                        <svg viewBox="0 0 109 109" aria-hidden className="live size-16 fill-none stroke-c [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:5]">
                            <path d="M19.5,39.86c2.45,0.57,5.23,0.8,8.04,0.57C40.75,39.38,63,36.5,79.78,36.15c2.8-0.06,4.54,0.1,7.34,0.5" />
                            <path d="M51.75,10.5c1.19,1.19,2,3,2,5c0,8.65,0,55.15-0.14,74.75c-0.03,4.19-0.07,7.15-0.11,8.25" />
                            <path d="M50.75,39.5c0,1.12-0.61,2.44-1.42,3.95C41.75,57.5,26.7,73.93,15.75,80.25" className="stroke-line-2" />
                            <path d="M54.5,39c4.62,6,23,25.75,31.76,34.61c2.27,2.29,4.61,4.39,7.49,5.64" className="stroke-line-2" />
                        </svg>
                        <span className="text-xs text-ink-3">stroke 2 of 4, being drawn</span>
                    </Both>
                </Block>

                <Block jp="動き" title="Motion" aside="Ink, not bounce · docs/design/motion.md">
                    <div style={tc(NATURE)}>
                        <MotionLab kinds={motionKinds} strokes={strokesOf(DRAW_CHAR)} strokeChar={DRAW_CHAR} />
                    </div>
                </Block>

                <Block jp="墨色" title="Every shade, every theme" aside="12px meaning text must stay ≥ 4.5:1 on each fill">
                    <Both className="flex flex-col gap-3">
                        {CATEGORIES.map((name) => {
                            const top = [...getKanjiByCategory(name)].sort(compareByFrequency).slice(0, 5);
                            return (
                                <div key={name} className="grid grid-cols-[72px_repeat(5,minmax(0,1fr))] items-center gap-2" style={tc(getThemeColor(name))}>
                                    <span className="flex items-center gap-1.5 text-xs text-ink-2">
                                        <span aria-hidden className="size-2 flex-none rounded-full bg-c" />
                                        {THEME_SHORT[name]}
                                    </span>
                                    {top.map((k, i) => (
                                        <KanjiTile key={k.char} kanji={k} shade={SHADES[i]} />
                                    ))}
                                </div>
                            );
                        })}
                    </Both>
                </Block>

                <Block jp="型" title="Two page templates" aside="Plate for atlas pages, Tool for Browse, My list and Teach">
                    <div className="flex flex-col gap-3 rounded-2xl border border-line p-4 sm:p-6" style={tc(BODY)}>
                        <p className="type-label">Atlas path (on phones it moves into the header)</p>
                        <AtlasPath
                            inHeader={false}
                            className="flex"
                            steps={[
                                { label: "Human Body & People", short: "Body", href: categoryPath("Human Body & People"), mark: { kind: "dot", category: "Human Body & People" } },
                                { label: "person", href: radicalPath("ninben"), mark: { kind: "seal", char: "亻", category: "Human Body & People", chars: getKanjiByRadical("ninben").map((k) => k.char).join("") } },
                                { label: "rest", mark: { kind: "glyph", char: "休" } },
                            ]}
                            prev={{ href: kanjiPath("体"), glyph: "体", label: "Previous in 亻: 体 body" }}
                            next={{ href: kanjiPath("作"), glyph: "作", label: "Next in 亻: 作 make" }}
                        />
                        <p className="type-label pt-4">Plate · specimen 5 : reading 7, stacks below 960px</p>
                        <Plate
                            phoneOrder="after-hero"
                            hero={<Slot>Hero · kind label, glyph and title, tags, parts (first on phones for kanji)</Slot>}
                            specimen={<Slot className="min-h-80">Specimen · one set of tabs, sticky on desktop</Slot>}
                            reading={<Slot className="min-h-60">Reading · readings with words, one primary action</Slot>}
                        />
                    </div>
                    <div className="rounded-2xl border border-line p-4 sm:p-6">
                        <Tool
                            jp="探す"
                            kind="Tool template"
                            title="Browse 2,384 kanji"
                            lede="A title row with one line on what the tool does, then a 288px rail beside the result."
                            actions={
                                <>
                                    <Button variant="quiet">Make a worksheet</Button>
                                    <Button variant="primary">Study these 80</Button>
                                </>
                            }
                            rail={
                                <>
                                    <Slot>Rail · filters or sources, sticky</Slot>
                                    <Slot>JLPT · Theme · Your ink</Slot>
                                </>
                            }
                        >
                            <Slot className="min-h-72">Result · count, sort, ink legend, tile grid</Slot>
                        </Tool>
                    </div>
                </Block>

                <ActionBar>
                    <Button variant="primary">Learn it · 4 steps</Button>
                    <Button iconOnly aria-label="Save to My list">
                        <Bookmark aria-hidden />
                    </Button>
                    <Button iconOnly aria-label="More: card, print, present">
                        <Ellipsis aria-hidden />
                    </Button>
                </ActionBar>
            </PageShell>
        </InkPaint>
    );
}
