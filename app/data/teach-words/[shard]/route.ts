// Example words for worksheets ("Read these words"), built once at build time
// from the atlas and served as static JSON shards: /data/teach-words/0 … /15.
// Each shard is { [char]: {word, reading, meaning}[] } with at most two words.

import { getAllKanji } from "@/lib/atlas";
import { pickTeachWords, TEACH_WORDS_SHARDS, wordsShardOf, type TeachWords } from "@/lib/teach-set";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
    return Array.from({ length: TEACH_WORDS_SHARDS }, (_, shard) => ({ shard: String(shard) }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ shard: string }> }) {
    const shard = Number((await params).shard);
    const words: TeachWords = {};
    for (const kanji of getAllKanji()) {
        if (wordsShardOf(kanji.char) !== shard) continue;
        const picked = pickTeachWords(kanji.char, kanji.examples);
        if (picked.length > 0) words[kanji.char] = picked;
    }
    return Response.json(words);
}
