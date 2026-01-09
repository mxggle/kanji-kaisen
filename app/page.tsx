"use client";

import { Dashboard } from "@/components/Dashboard";
import { KANJI_DATA } from "@/lib/data";

export default function Home() {
  return <Dashboard initialData={KANJI_DATA} />;
}
