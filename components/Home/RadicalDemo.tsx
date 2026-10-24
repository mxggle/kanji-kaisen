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

  const radicalExamples = [
    {
      left: { char: "氵", name: "Water", color: "text-blue-400", bg: "bg-blue-950/30", border: "border-blue-500/30" },
      right: { char: "每", name: "Every", color: "text-gray-400", bg: "bg-zinc-800/30", border: "border-zinc-700/30" },
      result: { char: "海", name: "Sea", desc: "Water + a sound part (每)", color: "text-blue-300", glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]" }
    },
    {
      left: { char: "木", name: "Tree", color: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-500/30" },
      right: { char: "木", name: "Tree", color: "text-emerald-400", bg: "bg-emerald-950/30", border: "border-emerald-500/30" },
      result: { char: "林", name: "Forest", desc: "Two trees growing", color: "text-emerald-300", glow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]" }
    },
    {
      left: { char: "日", name: "Sun", color: "text-orange-400", bg: "bg-orange-950/30", border: "border-orange-500/30" },
      right: { char: "月", name: "Moon", color: "text-yellow-400", bg: "bg-yellow-950/30", border: "border-yellow-500/30" },
      result: { char: "明", name: "Bright", desc: "Sun and moon shine", color: "text-amber-300", glow: "shadow-[0_0_30px_rgba(245,158,11,0.3)]" }
    }
  ];

  const currentExample = radicalExamples[activeRadical];

  return (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative flex items-center justify-center mt-8 lg:mt-0"
              aria-label="How radicals combine into kanji"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-[100px]" />

              <div className="relative flex flex-col items-center gap-3 z-10">
                {/* Left Radical */}
                <motion.div
                  key={`l-${activeRadical}`}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 20, opacity: 0 }}
                  className={`p-5 md:p-6 rounded-2xl border backdrop-blur-md ${currentExample.left.bg} ${currentExample.left.border} w-28 md:w-36 text-center`}
                >
                  <div className={`text-4xl md:text-5xl font-japanese font-bold mb-1 ${currentExample.left.color}`}>{currentExample.left.char}</div>
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{currentExample.left.name}</div>
                </motion.div>

                <div className="text-lg md:text-xl text-gray-600 font-bold">+</div>

                {/* Right Component */}
                <motion.div
                  key={`r-${activeRadical}`}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={`p-5 md:p-6 rounded-2xl border backdrop-blur-md ${currentExample.right.bg} ${currentExample.right.border} w-28 md:w-36 text-center`}
                >
                  <div className={`text-4xl md:text-5xl font-japanese font-bold mb-1 ${currentExample.right.color}`}>{currentExample.right.char}</div>
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{currentExample.right.name}</div>
                </motion.div>

                <div className="text-lg md:text-xl text-gray-600 font-bold">=</div>

                {/* Result */}
                <motion.div
                  key={`res-${activeRadical}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={`p-5 md:p-6 rounded-2xl border backdrop-blur-md bg-black/80 border-white/20 w-32 md:w-40 text-center ${currentExample.result.glow}`}
                >
                  <div className={`text-4xl md:text-5xl font-japanese font-bold mb-1 ${currentExample.result.color}`}>{currentExample.result.char}</div>
                  <div className="text-sm md:text-base font-bold text-white mb-0.5">{currentExample.result.name}</div>
                  <div className="text-xs text-gray-400">{currentExample.result.desc}</div>
                </motion.div>
              </div>
            </motion.div>
  );
}
