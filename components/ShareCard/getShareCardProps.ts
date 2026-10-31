// Server-side props for ShareCardButton: <ShareCardButton {...getShareCardProps(kanji)} />.

import "server-only";

import { getKanji, getRadicalSummary } from "@/lib/atlas";
import type { AtlasKanji } from "@/lib/atlas/types";
import { shareCardInput, type ShareCardInput } from "@/lib/share-card";

export function getShareCardProps(kanji: AtlasKanji): ShareCardInput {
    return shareCardInput(kanji, { radical: getRadicalSummary, kanji: getKanji });
}
