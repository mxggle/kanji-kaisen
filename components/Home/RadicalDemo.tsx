"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Rotating "radical + component = kanji" demo for the home page hero.
export function RadicalDemo() {
  const [activeRadical, setActiveRadical] = useState(0);

  // Rotates through radical examples
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveRadical((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Tones are skin tokens, so the demo stays readable on 墨 paper too.
  const radicalExamples = [
    {
      left: { char: "氵", name: "Water", tone: "var(--n3)" },
      right: { char: "每", name: "Every", tone: null },
      result: { char: "海", name: "Sea", desc: "Water + a sound part (每)", tone: "var(--n3)" }
    },
    {
      left: { char: "木", name: "Tree", tone: "var(--n5)" },
      right: { char: "木", name: "Tree", tone: "var(--n5)" },
      result: { char: "林", name: "Forest", desc: "Two trees growing", tone: "var(--n5)" }
    },
    {
      left: { char: "日", name: "Sun", tone: "var(--tip)" },
      right: { char: "月", name: "Moon", tone: "var(--tip)" },
      result: { char: "明", name: "Bright", desc: "Sun and moon shine", tone: "var(--tip)" }
    }
  ];

  const toneStyle = (tone: string | null): React.CSSProperties =>
    tone
      ? { color: tone, backgroundColor: `color-mix(in oklab, ${tone} 10%, transparent)`, borderColor: `color-mix(in oklab, ${tone} 30%, transparent)` }
      : {};

  const currentExample = radicalExamples[activeRadical];

  return (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative flex items-center justify-center mt-8 lg:mt-0"
              aria-label="How radicals combine into kanji"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--n3)]/10 to-[var(--accent)]/10 rounded-full blur-[100px]" />

              <div className="relative flex flex-col items-center gap-3 z-10">
                {/* Left Radical */}
                <motion.div
                  key={`l-${activeRadical}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className="p-5 md:p-6 rounded-2xl border border-line bg-card backdrop-blur-md w-28 md:w-36 text-center"
                  style={toneStyle(currentExample.left.tone)}
                >
                  <div className="text-4xl md:text-5xl font-japanese font-bold mb-1">{currentExample.left.char}</div>
                  <div className="text-xs font-medium text-ink-2 uppercase tracking-wider">{currentExample.left.name}</div>
                </motion.div>

                <div className="text-lg md:text-xl text-ink-3 font-bold">+</div>

                {/* Right Component */}
                <motion.div
                  key={`r-${activeRadical}`}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="p-5 md:p-6 rounded-2xl border border-line bg-card backdrop-blur-md w-28 md:w-36 text-center text-ink-2"
                  style={toneStyle(currentExample.right.tone)}
                >
                  <div className="text-4xl md:text-5xl font-japanese font-bold mb-1">{currentExample.right.char}</div>
                  <div className="text-xs font-medium text-ink-2 uppercase tracking-wider">{currentExample.right.name}</div>
                </motion.div>

                <div className="text-lg md:text-xl text-ink-3 font-bold">=</div>

                {/* Result */}
                <motion.div
                  key={`res-${activeRadical}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="halo p-5 md:p-6 rounded-2xl border backdrop-blur-md bg-bg/80 border-line-2 w-32 md:w-40 text-center"
                  style={{ "--tc": currentExample.result.tone } as React.CSSProperties}
                >
                  <div className="text-4xl md:text-5xl font-japanese font-bold mb-1 text-c">{currentExample.result.char}</div>
                  <div className="text-sm md:text-base font-bold text-ink mb-0.5">{currentExample.result.name}</div>
                  <div className="text-xs text-ink-2">{currentExample.result.desc}</div>
                </motion.div>
              </div>
            </motion.div>
  );
}
