# Data, licensing and content-overlap feasibility: Chinese edition / shared "character core" for Kanji Kaisen

Scope note: Kanji Kaisen's atlas (`lib/atlas/kanji-atlas.json`) was inspected read-only. It holds 2,223 kanji entries and 230 radical entries. Each kanji has the fields char, meanings, onyomi, kunyomi, jlpt, grade, strokeCount, frequency, radical, category and examples. Only 1,975 of the 2,223 entries are jōyō kanji. The other 248 are non-jōyō, mostly name kanji such as 亘 伊 凜 柊 翔 and 々. The atlas is also missing 161 of the 2,136 jōyō kanji, for example 丈 串 丼 俺 喉 嫉 柿 枕 鍋 鍵 鬱 麓 麺. All counts below marked "computed" were produced by this researcher with read-only scripts in the scratchpad (`/private/tmp/claude-501/-Users-harry-code-kanji-kaisen/1934c902-cff6-4c38-ac83-d0ee2c5ee0fc/scratchpad/scripts/`). The inputs were Unihan 18.0, the Wikipedia jōyō table, Make Me a Hanzi `graphics.txt`, an HSK 3.0 character CSV, the Wikimedia Commons API, and the repo's own KanjiVG files in `public/kanjivg/kanji` (11,661 SVGs).

## 1. Chinese stroke-order and character datasets: licenses, quality, commercial limits

### Takeaway
Every core Chinese dataset needed is available and allows commercial use. The catch is that they carry three different copyleft regimes: the Arphic Public License (APL) for Make Me a Hanzi, Hanzi Writer data and Animated CJK stroke graphics; LGPL for their dictionary files; and CC BY-SA 4.0 for CC-CEDICT. On top of KanjiVG's CC BY-SA 3.0, this means the stroke datasets should stay as separate per-language files and not be merged. Unihan (Unicode License v3) is permissive. The HSK 3.0 lists are a PRC government publication with unclear but low-risk status. The Taiwan TOCFL "8000 words" list was withdrawn in 2021, and its successor (NAER's TBCL) has no published reuse license that I could find.

### Cited Findings
**Make Me a Hanzi (skishore/makemeahanzi)**
- It covers "over 9000 of the most common simplified and traditional Chinese characters". `dictionary.txt` is derived from Unihan and CJKlib. `graphics.txt` and the SVGs are derived from the Arphic PL KaitiM GB and Arphic PL UKai fonts. Stroke order follows the **PRC standard**, and the README says Japan, Taiwan and other orderings are not covered. It refers users to animCJK and KanjiVG for Japanese — [makemeahanzi README](https://github.com/skishore/makemeahanzi)
- COPYING: "You can redistribute and/or modify dictionary.txt under the terms of the GNU Lesser General Public License" and "graphics.txt under the terms of the Arphic Public License". The README says `svgs.tar.gz` is "licensed the same way as graphics.txt" — [makemeahanzi COPYING](https://github.com/skishore/makemeahanzi/blob/master/COPYING); [README](https://github.com/skishore/makemeahanzi)
- Computed: `graphics.txt` has 9,574 characters. It covers all 3,500 level-1 characters of the PRC 通用规范汉字表 (2013), all 3,000 HSK 3.0 characters, 6,866 of the 8,105 通用规范汉字表 characters, and 5,108 of the 5,413 CNS 11643 plane-1 (Big5 level-1) traditional characters. Of the 9,574, 2,708 are not in the PRC table (mostly traditional forms) — computed from [Unihan kTGH / kIRG_TSource](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip) and [graphics.txt](https://github.com/skishore/makemeahanzi)
- GitHub's license metadata reports makemeahanzi as "NOASSERTION" because it has mixed licenses. The repo was last pushed on 2026-03-08 and has about 2.7k stars — [GitHub API](https://api.github.com/repos/skishore/makemeahanzi)

**Arphic Public License (APL) terms**
- Verbatim copies may be distributed "in any medium, without restriction" as long as ARPHICPL.TXT is kept unaltered. "Freely Available" is about freedom, not price, and "If you wish, you can charge for this service." Modifications must be made "Freely Available as a whole to all third parties under the terms of this License" (copyleft). "Mere aggregation of another work not based on the Font with the Font" does not extend the license to that other work. Modified files need a prominent change notice — [Arphic Public License text](http://ftp.gnu.org/non-gnu/chinese-fonts-truetype/LICENSE)

**Hanzi Writer**
- hanzi-writer-data: "You can redistribute and/or modify this data under the terms of the Arphic Public License". The data comes from Make Me a Hanzi and "is licensed separately from the Hanzi Writer source code" — [chanind/hanzi-writer-data](https://github.com/chanind/hanzi-writer-data)
- The Hanzi Writer JS library is MIT-licensed according to GitHub metadata. It has about 5.0k stars and was last pushed 2025-12-31 — [GitHub API: chanind/hanzi-writer](https://api.github.com/repos/chanind/hanzi-writer)

**Animated CJK (parsimonhi/animCJK)**
- License: "Arphic Public License (files prefixed by "graphics" and SVG files), GNU Lesser General Public License (all other files)". Kana, bopomofo and stroke SVGs may also be used under LGPL — [animCJK README](https://github.com/parsimonhi/animCJK)
- Coverage: svgsJa has 7,343 characters plus 177 kana, svgsZhHans has 8,360, svgsZhHant only 1,839, and svgsKo 535. The project derives from Makemeahanzi and its Arphic fonts. Japanese stroke order was checked against Kakijun, Jitenon, Moji kakudai and KanjiVG. Traditional forms were checked against Taiwan's Ministry of Education stroke-order site and the Hong Kong Education Bureau. One documented difference: "the stroke order of the radical 馬 in ZhHans and ZhHant is not the same: the first two strokes are swapped" — [animCJK README](https://github.com/parsimonhi/animCJK)
- The repo is actively maintained, with a push on 2026-10-31 — [GitHub API](https://api.github.com/repos/parsimonhi/animCJK)

**CC-CEDICT**
- "This work is licensed under a Creative Commons Attribution-ShareAlike 4.0 International License". It currently has 125,325 entries. Its use is allowed "for both non-commercial and commercial purposes" with attribution and share-alike for changes — [MDBG CC-CEDICT page](https://www.mdbg.net/chinese/dictionary?page=cc-cedict)

**Unihan**
- Current version: Unicode 18.0.0, UAX #38 revision 41, dated 2026-09-01. The data files in the zip are dated 2026-07-31 — [UAX #38](https://www.unicode.org/reports/tr38/); header of [Unihan.zip](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip)
- Useful fields:
  - kSimplifiedVariant / kTraditionalVariant are used for character-by-character S↔T conversion, for example 書→书 and 学→學.
  - kSemanticVariant / kSpecializedSemanticVariant / kZVariant mark variant relations.
  - kJoyoKanji gives the jōyō table year (2,136 characters in 2010). kJinmeiyoKanji covers name kanji (864).
  - kIRG_TSource / JSource / GSource give national-standard source mappings.
  - kJapanese is in kana: hiragana is roughly kun, katakana roughly on.
  - kDefinition is an English gloss.
  - kRSUnicode is the radical-stroke value. "A single apostrophe indicates the Chinese simplified form of the radical", and two apostrophes mark a non-Chinese simplified form.
  
  — [UAX #38](https://www.unicode.org/reports/tr38/)
- License: Unicode Data Files, "including the Unicode Character Database and Unihan", are "subject to the terms and conditions of the free and open-source Unicode License v3" — [Unicode Terms of Use](https://www.unicode.org/terms_of_use.html). That license grants permission "to any person obtaining a copy of data files" to use, copy, modify, publish, distribute and sell them. The conditions are a copyright/permission notice with copies or in the documentation, no use of the holder's name in advertising, and no warranty — [Unicode License v3](https://www.unicode.org/license.txt)
- Computed sanity check: Unihan 18.0 has exactly 2,136 characters with kJoyoKanji=2010. Four further entries map variant code points to jōyō characters: 剥→U+525D, 叱→U+20B9F, 填→U+5861, 頬→U+9830 — [Unihan.zip](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip)

**HSK 3.0 (GF0025-2021, 国际中文教育中文水平等级标准)**
- Issued by the Ministry of Education and the State Language Commission as a national language standard, in force from 1 July 2021 — [Institut Confucius, La Rochelle](https://institut-confucius.univ-larochelle.fr/2021/03/31/publication-du-standard-for-chinese-proficiency-in-international-chinese-language-education-%e3%80%8a%e5%9b%bd%e9%99%85%e4%b8%ad%e6%96%87%e6%95%99%e8%82%b2%e4%b8%ad%e6%96%87%e6%b0%b4%e5%b9%b3/)
- The primary source is a scanned MOE PDF with no text layer. A cleaned list on GitHub has 11,092 terms (`hsk30.csv`) and 3,000 characters (`hsk30-chars.csv`). Its code is MIT. Its data is "largely derived from" two other repos that claim MIT, which the maintainer calls questionable because the original is a PRC government work ("版权所有：中华人民共和国教育部") that "depending on PRC law specifics might be public domain" — [ivankra/hsk30 README](https://github.com/ivankra/hsk30); [MOE notice](http://www.moe.gov.cn/jyb_xwfb/gzdt_gzdt/s5987/202103/t20210329_523304.html)
- PRC Copyright Law Art. 5 excludes from protection "法律、法规，国家机关的决议、决定、命令和其他具有立法、行政、司法性质的文件" and their official translations. Whether a language standard such as a GF document counts as such a document was not confirmed — [OSM wiki: Copyright in the PRC](https://wiki.openstreetmap.org/wiki/Copyright_in_the_PRC)
- A third-party package reports that the 2021 standard and a later 2025 HSK examination syllabus are different documents that disagree on 41.5% of shared vocabulary. This is self-reported and unverified — [hsk30 on PyPI](https://pypi.org/project/hsk30/)

**TOCFL / Taiwan**
- TOCFL stopped providing the CEFR-based 〈華語八千詞表〉 from 30 June 2021. TOCFL levels now follow the National Academy for Educational Research (NAER) benchmarks — [TOCFL notice (8000zhuyin_recall.pdf)](https://tocfl.edu.tw/assets/files/8000zhuyin_recall.pdf)
- The old list had these cumulative level sizes: 準備級 300, 入門級 500, 基礎級 1,000, 進階級 2,500, 高階級 5,000, 流利級 8,000 — [TOCFL 8000 description](https://tocfl.edu.tw/assets/files/vocabulary/8000_description.pdf)
- The successor is NAER's 臺灣華語文能力基準 (TBCL), completed in 2020. It includes graded character, word and grammar-point lists — [TBCL site](https://bcoct.naer.edu.tw/TBCL/); [NAER FAQ](https://coct2.naer.edu.tw/download/tech_report/華語文能力基準應用參考指引問答集FAQ_1111114.pdf)

**Japanese side (for compatibility analysis)**
- KanjiVG: "copyright Ulrich Apel and released under the Creative Commons Attribution-Share Alike 3.0 licence" — [KanjiVG GitHub](https://github.com/KanjiVG/kanjivg). The file header in the repo's own copies asks users to attribute "by stating your use of KanjiVG in your own copyright header and linking to KanjiVG's website" — [KanjiVG](https://github.com/KanjiVG/kanjivg) (header of `public/kanjivg/kanji/*.svg`)
- Kanji alive: "licensed under a Creative Commons Attribution 4.0 International License". It covers 1,235 kanji and 247 Japanese radicals, with audio and stroke animations. Mnemonic hints are excluded for copyright reasons — [kanjialive/kanji-data-media](https://github.com/kanjialive/kanji-data-media)

### Inferences
- **Commercial use is possible for every core Chinese dataset.** No dataset found has a non-commercial clause. The obligations are copyleft: changes to the APL stroke data must be published under the APL, changes to CC-CEDICT must be published under CC BY-SA 4.0, and the license and attribution must be kept. Under the APL's "mere aggregation" wording, the app's own code is not pulled in (not legal advice).
- **Do not merge stroke datasets into one file.** APL, CC BY-SA 3.0 (KanjiVG) and LGPL are separate copyleft licenses with no obvious mutual compatibility. Keep `ja` strokes (KanjiVG) and `zh` strokes (Make Me a Hanzi / animCJK) as separately licensed assets, each with its own notice. A shared core should store only IDs or mappings, not mixed stroke geometry. CC BY-SA 3.0 adaptations can generally be relicensed under later BY-SA versions, so KanjiVG and CC-CEDICT can coexist in a BY-SA 4.0 bundle. This is my reading of CC's version-upgrade clause and was not verified this session.
- **Make Me a Hanzi is the quality baseline for Simplified Chinese:** it covers all HSK 3.0 and 通用规范 level-1 characters. Its traditional glyphs use PRC stroke order. A Taiwan-accurate (MOE) stroke-order dataset at scale did not turn up: animCJK's ZhHant set is only 1,839 characters. A Traditional/Taiwan edition would therefore either accept PRC order on traditional glyphs or need custom work.
- **HSK lists:** the risk is low. The list is a government standard, and word and character lists are largely factual. It is still worth deriving your own list from the MOE PDF, or citing the GitHub OCR source, rather than copying a third-party app's enriched data.

### Gaps
- I did not find TBCL's or NAER COCT's reuse license, whether open-government-data or otherwise. TBCL character and word totals were not confirmed this session.
- I did not verify whether PRC Art. 5 covers GF-series language standards. There is no court or official guidance on this.
- The exact count of the Hanzi Writer data's characters was not stated on its page. It is assumed to equal Make Me a Hanzi's, since it is derived from it.
- I could not quantify the quality and error rate of Make Me a Hanzi's PRC stroke order. A search snippet mentioned 19 errors found in the official GB13000.1 stroke-order standard itself, but I did not open that source.

## 2. Ancient forms (oracle bone, bronze, seal): sources, coverage, licenses, scholarly caveats

### Takeaway
The Wikimedia Commons "Ancient Chinese characters project" (ACC) is the only large source that is clearly reusable. Its files are tagged {{PD-ancient-script}}, and those traced from Academia Sinica's 小學堂 also carry CC0. It covers about 60% of jōyō kanji in at least one ancient script, about 33% in oracle bone or bronze, and about 95% of the atlas's radical characters. Files that came via Richard Sears rest on a murky 2007 email "agreement" and should be filtered out or avoided. Every other rich source (hanziyuan, CUHK, zdic, Outlier) is all-rights-reserved or silent on reuse. Etymology text has to be written fresh and sourced to modern paleography, not to Shuowen-era folk etymology.

### Cited Findings
**Commons ACC: what it is and its licensing**
- Goal: "a large set of high quality images of Ancient Chinese characters". The 214 radicals are complete, and current work is on non-compound and frequently used characters. Glyph sources are 續甲骨文編 (oracle), 金文編 (bronze, 24,223), 說文解字 (seal, 11,109) and 六書通 (seal, 38,596). Online references are hanziyuan.net (preferred), the Sinica database and ctext.org. File naming: `-oracle.svg`, `-bronze.svg` (with -shang/-spring/-warring variants), `-seal.svg`, `-bigseal.svg`, `-silk.svg`, `-slip.svg`. The page states "All this work is in the public domain" and asks for credit to authors Erin Silversmith and Micheletb. It was last edited 28 Aug 2026 — [Commons: ACC project](https://commons.wikimedia.org/wiki/Commons:Ancient_Chinese_characters_project)
- The license template {{ACClicense}} expands to {{PD-ancient-script}}. Its permission text has three variants:
  - default: "This is a public domain picture of an ancient script. Attribution is not required but appreciated."
  - when the glyph came from Sinica (fontcode parameter): "Picture from Sinica Database is under CC0 1.0 Universal Public Domain Dedication" + {{Cc-zero}}
  - when the 4th parameter is set: "Courtesy, permission and copyright from Richard Sears website © 2003 (see Richard Sears Agreement)"
  
  — [Template:ACClicense](https://commons.wikimedia.org/wiki/Template:ACClicense)
- Example: File:人-oracle.svg uses ACClicense with a Sinica fontcode (42.F47D) and source refs 甲2940 合18901. That makes it CC0 plus PD — [Commons API, File:人-oracle.svg](https://commons.wikimedia.org/wiki/File:%E4%BA%BA-oracle.svg)
- Academia Sinica 小學堂 waives rights to its glyph images and glyph attribute data via the query interface under CC0 1.0: "權利人特於此明示主張以CC0 1.0通用方式…拋棄該字形圖片及字形屬性資訊依著作權法可得享有之權利". The waiver covers only the glyph images and attributes, not other content — [小學堂 License](https://xiaoxue.iis.sinica.edu.tw/License/License)
- Richard Sears agreement:
  - Commons asked Sears (around 2006–2007) to confirm GPL for scans in four categories: seal, great seal, bronze, oracle. The page says he answered positively but does not quote him.
  - A later editor wrote that the images are public domain and the GPL covers only his database schema and organizing methods.
  - Sears required acknowledgement of the GIF source for SVG redraws.
  
  — [Commons: Richard Sears Agreement](https://commons.wikimedia.org/wiki/Commons:Ancient_Chinese_characters/Richard_Sears_Agreement)

**Commons ACC: scale and coverage**
- Computed via the Commons search API (regex on file titles):
  - 18,506 files use {{ACClicense}}.
  - Files per suffix: `-oracle.svg` 876 (868 distinct characters), `-bronze.svg` 1,166 (1,140), `-seal.svg` 3,775 (3,605 distinct among the 3,750 retrieved), `-bigseal.svg` 1,697 (1,659), `-slip.svg` 262, `-silk.svg` 626.
  
  — [Commons API](https://commons.wikimedia.org/w/api.php)
- Computed coverage of the 2,136 jōyō kanji. A kanji counts as covered if a file exists for the kanji or for a traditional or variant form linked in Unihan, for example 學 for 学.

  | Script | Jōyō covered | Same code point only |
  |---|---|---|
  | Oracle bone | 492 (23%) | 427 |
  | Bronze | 625 (29%) | 551 |
  | Shuowen seal | 1,205 (56%) | 1,053 |
  | Big seal | 833 | — |
  | Any of the four | 1,278 (60%) | — |
  | Oracle or bronze | 700 (33%) | — |
  | Oracle, bronze and seal all present | 393 (18%) | — |

  For the atlas's 194 distinct radical characters: 184 (95%) have at least one form and 144 (74%) have an oracle form. For the full 2,223 atlas entries, 1,315 have at least one form — computed from the [Commons API](https://commons.wikimedia.org/w/api.php) and [Unihan](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip)

**Other sources: reuse status**
- hanziyuan.net (Richard Sears, Chinese Etymology): the footer reads "Copyright © 1994 - 2017 Richard Sears hanziyuan.net | ChineseEtymology.org All rights received" [sic]. No reuse terms were found. It advertises 31,000+ oracle, 24,000+ bronze and 49,000+ seal forms — [hanziyuan.net](https://hanziyuan.net/)
- CUHK 漢語多功能字庫: "©版權所有". It credits oracle and bronze glyphs to a center director. No reuse terms were found on the page — [CUHK Multi-function Chinese Character Database](https://humanum.arts.cuhk.edu.hk/Lexis/lexi-mf/)
- 汉典 zdic: the footer reads "© 2004-2026 汉典 ZDIC.NET". No reuse license appears on the home page — [zdic.net](https://www.zdic.net/)
- Outlier Dictionary of Chinese Characters: a paid add-on for Pleco with 4,100+ characters. The Expert edition adds ancient forms for semantic components. It is a proprietary product ("All Rights Reserved"), and no data license was found — [Outlier product page](https://outlier-linguistics.com/products/outlier-dictionary-of-chinese-characters)

**Scholarly caveats on folk etymology**
- A 2022 essay (translated from Russian) argues:
  - Many popular books and even dictionaries carry outdated or fanciful etymologies.
  - Mnemonic stories are fine as memory aids but must not be presented as origins.
  - "The origin of every character must be supported by evidence based on academic methodology."
  - Shuowen's 六書 categories are not a proven classification.
  - Since over 90% of characters are phono-semantic compounds, "Only if you couldn't find the phonetic should you start trying to divide the character into semantic elements." Example: 鯨's 京 is phonetic, not "big", as shown by 諒, 晾, 景.
  
  — [LangCat: How to Expose False Etymologies](https://langcat.substack.com/p/how-to-expose-false-etymologies-of)
- An Academia Sinica museum exhibition says oracle-bone finds "challenge the framework provided by Xu Shen" and call for reform in Chinese etymology. This comes from a search snippet; the page was not opened — [Sinica Museum: Oracle Bone Inscriptions](https://museum.sinica.edu.tw/en/exhibitions/13/)
- Oracle-bone forms are often simplified relative to formal forms, so looking more pictographic does not prove a form is earlier — [LangCat](https://langcat.substack.com/p/how-to-expose-false-etymologies-of)

### Inferences
- **A practical sourcing rule:** use only ACC files whose page carries the Sinica fontcode (CC0 + PD), or the default PD text without the Sears parameter. Credit "Wikimedia Commons ACC / Academia Sinica 小學堂" anyway. This needs a per-file wikitext check, which can be scripted through the API.
- **Coverage is uneven.** Ancient forms fit well as a feature for radicals and basic characters (about 95% of radicals have one), but about two-thirds of jōyō kanji have no oracle or bronze file. The feature should degrade gracefully, for example by showing the seal form only or showing the forms of the character's components.
- **The ancient-form layer is language-neutral by nature.** The same 學 bronze form serves 学 (ja/zh-Hans) and 學 (zh-Hant). It belongs in the shared core, keyed to the traditional or "etymon" code point.
- **Folk etymology risk.** The existing Kanji Kaisen "stories" are mnemonic devices and should be labelled as such. Any "etymology" claim shown next to an ancient form should cite a paleographic source. Writing these is editorial work, not data import.

### Gaps
- I could not count how many ACC files carry the Sears parameter versus the Sinica CC0 parameter. That needs a full wikitext crawl, which was rate-limited (HTTP 429).
- Regex title search may miss files with other naming patterns, for example `-oracle-2.svg` or non-ACC uploads. The seal list was 25 titles short because of rate limiting. The counts above are lower bounds for the ACC naming scheme only.
- Variant-linked matches via Unihan may include a few false positives where a linked variant is not the true historical antecedent.
- No terms-of-use pages were opened for hanziyuan, CUHK or zdic. The "about/terms" sub-pages were not fetched, so "no reuse permission found" is all that can be said.
- Japanese etymology controversies, such as 白川静 versus 藤堂明保 schools, were not researched this session.

## 3. Overlap: jōyō kanji vs simplified vs traditional, and radicals that change form

### Takeaway
By Unicode code point, about 60% of the 2,136 jōyō kanji are identical in Japanese, PRC simplified and Taiwan traditional standards. About 84% match the traditional code point and about 65% match the simplified one. Roughly 230 (about 11%) differ from both, as Japan-specific shinjitai such as 広/广/廣 or 歩/步. For radicals, 25 of the 214 Kangxi radicals have a separately encoded Chinese-simplified form (讠纟钅饣门马…). 15 distinct radical characters in Kanji Kaisen's 230-entry radical list are among them. Code-point identity overstates visual identity, because Han unification hides regional glyph differences.

### Cited Findings
**Three-way classification of the 2,136 jōyō kanji**

Computed, with these definitions:
- J = the jōyō form.
- T = the kyūjitai from the Wikipedia jōyō table (364 kanji have one) or J itself, normalised to the Taiwan CNS plane-1/2 code point.
- S = Unihan kSimplifiedVariant of T, or T/J if it is in the PRC 通用规范汉字表 (kTGH).

Sources: [Unihan 18.0](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip); [Wikipedia: List of jōyō kanji](https://en.wikipedia.org/wiki/List_of_j%C5%8Dy%C5%8D_kanji)

| Category | Count | Share | Examples (J/S/T) |
|---|---|---|---|
| J = S = T (same code point in all three) | 1,281 | 60.0% | 一 上 中 日 人 山 |
| J = T, simplified differs | 496 | 23.2% | 語/语/語, 東/东/東, 個/个/個, 備/备/備 |
| J = S, traditional differs | 104 | 4.9% | 学/学/學, 国/国/國, 会/会/會, 万/万/萬, 体/体/體, 声/声/聲 |
| J differs; S = T (Japan-only change) | 61 | 2.9% | 歩/步, 毎/每, 黒/黑, 徳/德, 増/增, 仏/佛, 欠/缺, 予/豫, 弁/辨辯瓣 |
| J, S and T all differ | 160 | 7.5% | 広/广/廣, 売/卖/賣, 読/读/讀, 駅/驿/驛, 図/图/圖, 気/气/氣, 発/发/發, 芸/艺/藝, 糸/丝/絲, 証/证/證, 豊/丰/豐 |
| Unresolved by automatic mapping (manual check) | 34 | 1.6% | see below |

- The 34 unresolved cases split as follows:
  - True kokuji with no Chinese standard counterpart: 8 (働 匂 塀 峠 枠 栃 畑 込).
  - Japanese variant shapes on their own code points: 児 喩 姫 舎 舗 駄.
  - Mostly "J = T, S differs" cases whose S form Unihan points to an extension-block character: 鎌/镰, 鑑/鉴, 闇/暗, 遊/游, 癒/愈, 託/托, 諮/咨, 搾/榨, 塚/冢, 録/录/錄, 錬/炼/鍊, 勲/勋/勳, 浄/净/淨, 岳/岳/嶽.
  
  After manual reassignment the totals are roughly: J = T ≈ 1,790 (84%); J = S ≈ 1,385 (65%); J differs from both ≈ 230 (11%); kokuji ≈ 8 — computed, same sources
- Cross-check by raw membership: 1,394 jōyō code points are in the PRC 8,105-character table (1,391 in GB2312), and 1,813 are in CNS 11643 planes 1–2 / Big5 — computed from [Unihan](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip)
- The Wikipedia jōyō table lists kyūjitai for exactly 364 kanji. This matches the often-cited "364 pairs" — computed from [Wikipedia: List of jōyō kanji](https://en.wikipedia.org/wiki/List_of_j%C5%8Dy%C5%8D_kanji)
- "False friends" sit inside the counts: same code point, different word. In Japanese, 芸 = 藝 (art), but Chinese 芸 is a separate character. Japanese 欠 = 缺, 予 = 豫, 弁 = 辨/辯/瓣 and 缶 = 罐. Japanese 机 means "desk", while S 机 also stands for 機 "machine" — computed and classified from [Unihan](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip). See also [Wikipedia: Differences between Shinjitai and Simplified characters](https://en.wikipedia.org/wiki/Differences_between_Shinjitai_and_Simplified_characters)

**Published estimates**
- Wikipedia: "About 30% of the simplified Chinese characters match the Japanese shinjitai". No method is given, and the base is simplified characters, not jōyō — [Wikipedia: Differences between Shinjitai and Simplified](https://en.wikipedia.org/wiki/Differences_between_Shinjitai_and_Simplified_characters)
- Bökset (2021, Long Story of Short Forms): "About 80 characters were simplified differently in China and Japan". Also, 90–91% of the official Chinese short forms, and nearly 100% of the Japanese ones, were in use before the reforms. This is from the book abstract; the full text was not checked — [Vitterhetsakademien](https://vitterhetsakademien.bokorder.se/doi/4450). Bökset's ~80 is lower than my 160 "all three differ". His base is probably characters simplified in both countries, while my count also includes cases where the T form is used in Japan only via a different variant code point.
- An informal forum estimate gives "66% same as simplified, 85% same as traditional". This is close to my 65% and 84% — [HanziHero community](https://community.hanzihero.com/t/qodis-study-log/3216)

**HSK 3.0 overlap**
- Computed: 1,909 of the 3,000 HSK 3.0 characters are the PRC form of some jōyō kanji. By band:
  - Levels 1–3: 785 of 900 (87%)
  - Levels 4–6: 670 of 900 (74%)
  - Levels 7–9: 454 of 1,200 (38%)
  
  In the other direction, 1,937 jōyō kanji have their PRC form in HSK 3.0, 809 of them in levels 1–3.
  
  HSK levels 1–3 characters with no jōyō counterpart are mostly colloquial Mandarin words: pronouns and particles (你 您 她 它 们 这 哪 什 么 吗 吧 呢 啊 咱), kinship terms (爸 妈 哥 姐 爷 奶) and common verbs and adverbs (很 也 跟 帮 拿 找 站 坐 做 跑 哭 懂). These counts are slight undercounts because of mapping gaps such as 净/浄, 录/録 and 游/遊 — computed from [ivankra/hsk30](https://github.com/ivankra/hsk30) and [Unihan](https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip)

**Radicals**
- Unicode's CJKRadicals.txt lists 25 Kangxi radicals with a Chinese-simplified form (single apostrophe):

  | Kangxi radical | Simplified form |
  |---|---|
  | 90 爿 | 丬 |
  | 120 糸 | 纟 |
  | 147 見 | 见 |
  | 149 言 | 讠 |
  | 154 貝 | 贝 |
  | 159 車 | 车 |
  | 167 金 | 钅 |
  | 168 長 | 长 |
  | 169 門 | 门 |
  | 178 韋 | 韦 |
  | 181 頁 | 页 |
  | 182 風 | 风 |
  | 183 飛 | 飞 |
  | 184 食 | 饣 |
  | 187 馬 | 马 |
  | 195 魚 | 鱼 |
  | 196 鳥 | 鸟 |
  | 197 鹵 | 卤 |
  | 199 麥 | 麦 |
  | 201 黃 | 黄 |
  | 205 黽 | 黾 |
  | 210 齊 | 齐 |
  | 211 齒 | 齿 |
  | 212 龍 | 龙 |
  | 213 龜 | 龟 |

  Japanese-simplified forms (double apostrophe) are 齊→斉, 齒→歯, 龍→竜, 龜→亀, plus 鼡 for radical 208. Japan shares 麦 and 黄 with the PRC — [CJKRadicals.txt](https://www.unicode.org/Public/UCD/latest/ucd/CJKRadicals.txt); [UAX #38 kRSUnicode](https://www.unicode.org/reports/tr38/)
- In Kanji Kaisen's 230 radical entries, 20 entries (15 distinct characters: 言 糸 貝 金 風 車 見 門 長 頁 食 飛 鳥 馬 魚) use a radical that takes a different PRC simplified form. Three entries use Japanese forms (歯 黄 麦). The atlas has 194 distinct radical characters, because positional variants such as 雨/雨冠 and 言/言偏 are separate entries — computed from `lib/atlas/kanji-atlas.json` + [CJKRadicals.txt](https://www.unicode.org/Public/UCD/latest/ucd/CJKRadicals.txt)

**Glyph-level differences behind identical code points**
- Under Han unification, one code point can have visibly different regional glyphs:
  - 草: "Traditional Chinese and Korean use a four-stroke version" of the grass radical, while Simplified Chinese and Japanese use three strokes.
  - 骨 variants can look like mirror images to readers of another CJK language.
  - 者, 令, 直 and 雇 also differ.
  
  Plain text cannot pick the regional glyph. Language tags (`zh-Hans`, `zh-Hant`, `ja`) together with installed fonts determine rendering — [Wikipedia: Han unification](https://en.wikipedia.org/wiki/Han_unification)

### Inferences
- **A Traditional-Chinese (Taiwan/HK) edition reuses the most:** about 84% of jōyō code points carry over unchanged. A Simplified edition reuses about 65%. In both cases about 11% of the current entries (Japan-specific shinjitai) need a different "modern form" per language.
- **Character inventory for an HSK edition:** about 64% of the HSK 3.0 characters (1,909 of 3,000) map to a jōyō kanji. An HSK-complete edition would still need about 1,090 new character entries, about 115 of them in HSK levels 1–3 and heavily weighted to function words. A shared core keyed by "character identity" (the T or etymon form plus a J/S/T mapping) would serve both editions.
- **Because of 草-type and 骨-type differences, each edition must render with locale-tagged fonts** (`lang="zh-Hans"` / `"zh-Hant"` / `"ja"`). Stroke counts can differ even when the code point matches, for example 艹 in Taiwan.
- **The radical layer needs a per-language display form.** 15 of the atlas's 194 distinct radical characters need a simplified display form such as 讠 or 纟. Radical "stories" and meanings mostly carry over.

### Gaps
- No peer-reviewed study gives a definitive jōyō-vs-simplified-vs-traditional count. The figures above are my own computation, and the definitions matter: code point versus glyph, and Taiwan versus Hong Kong traditional.
- I did not compute the Hong Kong standard (常用字字形表) separately.
- I did not verify the PRC 2009 《汉字部首表》 radical inventory (the commonly cited 201 radicals). That would matter if the Chinese edition uses PRC dictionary radicals rather than Kangxi radicals.
- A search snippet said Taiwan's 1996 component rules specify 160 components, 68 of which differ from mainland standards. The source was not opened, so this is unverified.

## 4. Stroke-order differences: Japan vs PRC vs Taiwan

### Takeaway
The official standards agree on most characters, but differences come in systematic component families: 田, 王/玉, 生/隹, 糸, 𠂇 (右 有 布 希), 必, 成, 出, 馬, 皮, 耳, 飛 and others. A computed comparison of KanjiVG (Japanese) against Make Me a Hanzi (PRC) finds that about 18% of shared characters with equal stroke counts differ in order. About 9% more differ in stroke count because of component conventions such as 阝 (3 vs 2 strokes) and 廴. Japanese stroke data therefore cannot be reused for Chinese; each language layer needs its own.

### Cited Findings
**Official standards and documented differences**
- Wikipedia's article on stroke order says the official standards of the PRC (1997), Taiwan (MOE manual), Hong Kong (Education Bureau) and Japan (MEXT) "agree on the vast majority of characters, but each has its differences", and that the list is "not exhaustive". Documented differences:
  - 艹: the PRC and Japan merge it into 3 strokes; Hong Kong writes vertical–horizontal–vertical–horizontal.
  - 𠂇 in 左/右: the PRC and Taiwan always write the horizontal first.
  - 成: the PRC, Taiwan and HK start with the horizontal.
  - 乃: the PRC ends with 丿.
  - Taiwan: 戈's dot is second-to-last, and 忄's vertical is written second.
  - Japan: in 隹 and 生, the vertical may precede the lower horizontals. 必 starts with the top dot.
  
  — [Wikipedia: Stroke order](https://en.wikipedia.org/wiki/Stroke_order)
- Taiwan versus PRC: for 馬, "the first two strokes are swapped" between ZhHans and ZhHant — [animCJK README](https://github.com/parsimonhi/animCJK)
- 右 and 有 start with ノ in Japanese and with the horizontal in Chinese. Forum and Wikipedia-talk sources conflict over Taiwan's practice for 右 — [WaniKani / chinese-forums threads via search](https://www.chinese-forums.com/forums/topic/61200-stroke-order-of-右-in-taiwan-and-other-tc-chinese-areas/)
- Make Me a Hanzi follows the PRC standard and explicitly does not cover Japan or Taiwan orders — [makemeahanzi README](https://github.com/skishore/makemeahanzi)

**Computed comparison: KanjiVG vs Make Me a Hanzi for Kanji Kaisen's 2,223 characters**

Method: stroke start, mid and end points were normalised to each glyph's bounding box. Strokes were then matched across the two datasets by optimal (Hungarian) assignment. The order is "different" if the best match is not the identity permutation. Sources: KanjiVG files from [KanjiVG](https://github.com/KanjiVG/kanjivg); [makemeahanzi graphics.txt](https://github.com/skishore/makemeahanzi).

- 251 characters are not in Make Me a Hanzi. These are the Japan-specific forms.
- 171 have different stroke counts. Examples (Japanese/PRC): 院 10/9, 部 11/10, 際 14/13, 陽 12/11 (阝 is 3 strokes in Japan and 2 in the PRC); 建 9/8 and 延 8/6 (廴); 臣 7/6; 以 5/4; 骨 10/9; 海 9/10.
- Of the 1,801 with equal counts, 1,472 (81.7%) have the same order and 329 (18.3%) differ. The 329 group into these component families: 糸 48, 田 46, 王 38, 隹 34, 由 14, 耳 9, 生 8, 青 8, 皮 8, 馬 7, 舟 7, 出 5, 成 5, 必 4, and others (𠂇 in 右 有 布 希, 戈-type in 議 義 感, 冓, 虍, 曲, 乃, 凸 凹).
- Grade 1–2 kanji that differ: 国 長 出 生 北 書 男 聞 母 右 理 田 思 画 町 紙 青 曜 魚 組 番 馬 王 船 晴 耳 線 細 玉 角 星 黄 麦.
- Spot checks match the known rules:
  - 田 and 町: Japan writes the centre vertical before the inner horizontal.
  - 王: Japan writes 一 丨 一 一; the PRC writes 一 一 丨 一.
  - 生: the vertical comes before the last two horizontals in Japan.
  - 右, 成 and 皮: the first two strokes are swapped.
  - 必: the order is completely different.
  - 馬: the first two strokes are swapped, and the third through fifth strokes are reordered.

### Inferences
- **Scale for Simplified Chinese:** a Japanese-trained learner would see different stroke order in roughly one of five shared characters, and in about one in four once stroke-count and form differences are included. These differences cluster in a few dozen components. A "Japanese vs Chinese stroke order" toggle or callout is a plausible differentiating feature. Stroke assets must come from Make Me a Hanzi / Hanzi Writer (zh-Hans) and cannot come from KanjiVG.
- **Taiwan is a third standard.** It differs from the PRC (艹 4 strokes, 忄, 戈, 馬), so traditional characters drawn with Make Me a Hanzi's PRC order would not match what Taiwanese teachers expect. animCJK ZhHant (1,839) is the only open Taiwan-checked set found.

### Gaps
- My comparison method is heuristic. Its false-positive rate was not measured beyond about 17 spot checks. The 糸-family swaps (stroke 4 vs 5) in particular may partly be an artefact of nearly coincident stroke positions and need manual verification.
- No authoritative count of Japan-vs-PRC or PRC-vs-Taiwan stroke-order differences was found. 黃靜吟 (2005), which compares PRC and Taiwan standards, was referenced in search results but not accessed.
- KanjiVG's own deviations from the 1958 筆順指導の手びき were not assessed. For example, KanjiVG starts 北 with ㇐, which is worth checking.

## 5. Shared language-neutral "character core" vs language-specific layer

### Takeaway
A shared core is feasible and is where most reuse lives. It would hold character identity and variant mapping, radical and component structure, theme categories, ancient forms (Commons PD/CC0) and sourced etymology notes. Everything learners actually drill is language-specific: modern display form, stroke data, readings, glosses, example words, level lists and frequency. Of the atlas's current per-kanji fields, only `category` and (mostly) `radical` carry over unchanged. `meanings` needs review, and readings, JLPT/grade, examples, strokeCount and frequency must be rebuilt from Chinese sources.

### Cited Findings
- **Atlas schema:** kanji fields are char, meanings, onyomi, kunyomi, jlpt, grade, strokeCount, frequency, radical {key, char}, category and examples. Radical fields are key, char, name, meaning, category, hasStory and kanjiCount. Theme categories:

  | Category | Entries |
  |---|---|
  | Human Body & People | 608 |
  | Nature & Elements | 584 |
  | Action & Movement | 258 |
  | Textiles, Plants & Food | 199 |
  | Tools & Weapons | 156 |
  | Animals & Wildlife | 127 |
  | Structures & Home | 125 |
  | Time & Sequence | 70 |
  | States & Attributes | 57 |
  | Communication & Thought | 11 |
  | None | 28 |

  — computed from `/Users/harry/code/kanji-kaisen/lib/atlas/kanji-atlas.json`
- **Data for the variant-mapping core:** Unihan kSimplifiedVariant, kTraditionalVariant, kSemanticVariant, kZVariant, kJoyoKanji, kTGH and the kIRG_*Source fields, under the permissive Unicode License v3 — [UAX #38](https://www.unicode.org/reports/tr38/); [Unicode Terms](https://www.unicode.org/terms_of_use.html)
- **Readings and glosses:** Unihan has kMandarin and kDefinition. CC-CEDICT has 125,325 entries with pinyin and English (CC BY-SA 4.0) — [UAX #38](https://www.unicode.org/reports/tr38/); [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict)
- **Ancient forms:** Commons ACC (PD-ancient-script; Sinica-derived files CC0) — [Template:ACClicense](https://commons.wikimedia.org/wiki/Template:ACClicense)
- **Stroke data per language:**
  - ja: KanjiVG (CC BY-SA 3.0)
  - zh-Hans: Make Me a Hanzi / hanzi-writer-data (APL)
  - zh-Hant: animCJK ZhHant (APL, 1,839 characters)
  
  — [KanjiVG](https://github.com/KanjiVG/kanjivg); [makemeahanzi](https://github.com/skishore/makemeahanzi); [animCJK](https://github.com/parsimonhi/animCJK)
- **Level lists:** ja uses JLPT/grade (existing). zh-Hans uses HSK 3.0, 3,000 characters and 11,092 words — [ivankra/hsk30](https://github.com/ivankra/hsk30). zh-Hant uses TBCL (the TOCFL 8000 list was withdrawn in 2021) — [TOCFL notice](https://tocfl.edu.tw/assets/files/8000zhuyin_recall.pdf); [TBCL](https://bcoct.naer.edu.tw/TBCL/)

### Inferences
**Proposed core (language-neutral, one record per "character identity")**
- **Identity and variants:** ID = the traditional or etymon code point, plus `forms: {ja, zh-Hans, zh-Hant}` derived from the Unihan + kyūjitai mapping above. Three of every five records have one shared form, and about 11% need three distinct forms.
- **Structure:** Kangxi radical number, component decomposition and phonetic component. A component/IDS dataset is still needed; see Gaps.
- **Themes:** the existing `category` taxonomy, reusable as-is.
- **Ancient forms:** Commons SVG references with per-file license metadata and source refs (甲骨文合集 numbers and so on). About 60% of jōyō-range characters and about 95% of radicals are covered.
- **Etymology notes:** short, sourced, and clearly separated from mnemonics. This is new editorial work.
- **Radical stories:** reusable when the story depends on meaning rather than shape. The 15 simplified radicals need a shape note (言→讠).

**Language layer (per edition)**
- Modern form plus locale font tag.
- Stroke data from a separately licensed dataset.
- Stroke count, which differs for about 9% of identical code points.
- Readings: on/kun for ja; pinyin (plus zhuyin for TW) for zh.
- Glosses: senses diverge, as with 机, 汽 and 手紙-type words, so English meanings need per-language review.
- Example words: from JMdict-type sources for ja and CC-CEDICT for zh (BY-SA).
- Level tags: JLPT / HSK / TBCL.
- Frequency, audio, and false-friend warnings.

**Reuse estimate for a Simplified edition built on the HSK 3000 inventory**
- Reused from the core: about 1,900 character identities, their themes, radicals, ancient forms and etymology.
- New: about 1,090 identities.
- Rebuilt per character: readings, examples, levels, stroke data (imported, not hand-made) and gloss review.
- Existing Japanese example words, readings and JLPT tags: zero reuse.

**Licensing architecture**
- The core would be Unihan (permissive) plus Commons PD/CC0 plus the project's own writing, so it could carry the project's own license.
- Stroke and dictionary assets would stay in separate copyleft bundles: APL, CC BY-SA 3.0/4.0 and LGPL. Each needs its notice and an attribution screen, including KanjiVG's requested copyright-header attribution.

### Gaps
- An open component-decomposition dataset (IDS such as CHISE or cjkvi-ids) and its license were not researched this session, but the core's "structure" field depends on one.
- JMdict/EDRDG licensing for Japanese example words was out of scope and not checked.
- No sources were found on how competitors structure a shared kanji/hanzi core. The design above is inference.
- I did not estimate editorial effort in person-hours for etymology and gloss review; there is no basis for a figure without a pilot.
