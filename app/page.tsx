"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Flame, BookOpen, Brain, Sparkles, Droplets, Laptop, Sword, Mountain } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

interface FloatingParticle {
  char: string;
  startX: number;
  startY: number;
  endY: number;
  duration: number;
  delay: number;
  size: number;
  opacity: number;
  rotateStart: number;
  rotateEnd: number;
}

const KANJI_CHARS = [
  "水", "火", "木", "土", "山", "川", "日", "月", "風", "雨",
  "人", "心", "力", "手", "目", "口", "大", "小", "中", "氵"
];

function seededUnit(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

function createFloatingParticles(count: number): FloatingParticle[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = index + 1;

    return {
      char: KANJI_CHARS[Math.floor(seededUnit(seed) * KANJI_CHARS.length)],
      startX: seededUnit(seed + 1) * 100,
      startY: 100 + seededUnit(seed + 2) * 20,
      endY: -20 - seededUnit(seed + 3) * 20,
      duration: 20 + seededUnit(seed + 4) * 15,
      delay: seededUnit(seed + 5) * 10,
      size: 1.5 + seededUnit(seed + 6) * 2,
      opacity: 0.2 + seededUnit(seed + 7) * 0.3,
      rotateStart: seededUnit(seed + 8) * 360,
      rotateEnd: seededUnit(seed + 9) * 360 + 180,
    };
  });
}

const FLOATING_PARTICLES = createFloatingParticles(30);

// Floating Kanji Background Animation - Disabled on mobile for performance
function FloatingKanji() {
  const [isMobile, setIsMobile] = useState(true); // Default to true to prevent flash on mobile

  useEffect(() => {
    // Check if we're on mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't render floating kanji on mobile devices for performance
  if (isMobile) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {FLOATING_PARTICLES.map((particle, i) => {
        const char = particle.char;
        const startX = particle.startX;
        const startY = particle.startY; // Start below viewport
        const endY = particle.endY; // End above viewport
        const duration = particle.duration;
        const delay = particle.delay;
        const size = particle.size;
        const opacity = particle.opacity; // Fixed opacity between 0.2 and 0.5

        return (
          <motion.div
            key={i}
            className="absolute font-japanese select-none"
            style={{
              left: `${startX}%`,
              fontSize: `${size}rem`,
              color: `rgba(255, 255, 255, ${opacity})`,
              textShadow: '0 0 10px rgba(255,255,255,0.3)',
            }}
            initial={{
              y: `${startY}vh`,
              rotate: particle.rotateStart,
            }}
            animate={{
              y: `${endY}vh`,
              rotate: particle.rotateEnd,
            }}
            transition={{
              duration,
              delay,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {char}
          </motion.div>
        );
      })}
    </div>
  );
}

export default function LandingPage() {
  const [activeRadical, setActiveRadical] = useState(0);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

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
      result: { char: "海", name: "Sea", desc: "Water everywhere", color: "text-blue-300", glow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]" }
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
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30 relative">

      {/* Hero Section - Combined with Radical Demo */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-12 md:py-0">
        {/* Floating Kanji Background Animation */}
        <FloatingKanji />

        {/* Deep Gradient Backgrounds */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-950/20 via-black to-slate-950/20" />
          <motion.div style={{ y }} className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
          <motion.div style={{ y: useTransform(scrollYProgress, [0, 1], [0, 50]) }} className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="z-10 w-full max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">

            {/* Left Side - Title & CTA */}
            <div className="text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="mb-6"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm mb-6 font-medium text-blue-200 backdrop-blur-sm">
                  <Sparkles size={14} className="text-yellow-400" />
                  <span>Reimagine Kanji Learning</span>
                </div>

                <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-4 tracking-tighter">
                  <span className="block bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-gray-500">
                    漢字
                  </span>
                  <span className="block text-3xl md:text-4xl lg:text-5xl text-gray-500 font-japanese mt-2 tracking-widest">
                    KANJI KAISEN
                  </span>
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mb-8"
              >
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 leading-tight">
                  Logic, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Not Magic.</span>
                </h2>
                <p className="text-base md:text-lg text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Kanji are built like LEGO blocks. Once you learn the basic <span className="text-white font-medium">radicals</span>, complex characters become simple usage stories.
                </p>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="flex justify-center lg:justify-start gap-6 mb-8"
              >
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-bold text-blue-500">214</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest">Radicals</span>
                </div>
                <div className="w-px bg-white/10 h-12"></div>
                <div className="flex flex-col">
                  <span className="text-2xl md:text-3xl font-bold text-pink-500">2000+</span>
                  <span className="text-xs text-gray-500 uppercase tracking-widest">Characters</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Link
                  href="/learn"
                  className="group relative inline-flex items-center gap-4 px-8 py-4 bg-white text-black rounded-full font-bold text-base md:text-lg hover:pr-6 transition-all duration-300"
                >
                  <span className="relative z-10">Start Your Journey</span>
                  <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </motion.div>
            </div>

            {/* Right Side - Radical Demo */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="relative flex items-center justify-center mt-8 lg:mt-0"
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

          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section className="py-24 px-4 relative z-10 border-y border-white/5 bg-gradient-to-b from-zinc-900/50 to-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Master Every Character Through
            </h2>
            <p className="text-gray-400 text-lg">Three pillars that make kanji unforgettable</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stories */}
            <div className="group p-6 md:p-8 rounded-3xl bg-gradient-to-br from-purple-950/40 to-purple-900/10 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300">
              <div className="w-14 h-14 mb-5 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <BookOpen className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-purple-200">Stories</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Every kanji has an origin tale. Learn <span className="text-white">mnemonic stories</span> that connect the character&apos;s shape to its meaning, making memorization effortless.
              </p>
            </div>

            {/* Elements */}
            <div className="group p-6 md:p-8 rounded-3xl bg-gradient-to-br from-blue-950/40 to-blue-900/10 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300">
              <div className="w-14 h-14 mb-5 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Droplets className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-blue-200">Elements</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Kanji are built from <span className="text-white">214 radicals</span> — elemental building blocks like Water (氵), Fire (火), and Earth (土) that reveal meaning at a glance.
              </p>
            </div>

            {/* Logic */}
            <div className="group p-6 md:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 to-emerald-900/10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300">
              <div className="w-14 h-14 mb-5 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Brain className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-emerald-200">Logic</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                Every character follows patterns. <span className="text-white">Position clues</span> (left = category, right = sound) let you decode unfamiliar kanji with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-4 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
            The Infinite Path
          </h2>
          <p className="text-gray-400">Everything you need to master the written language.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Brain className="w-8 h-8 text-pink-400" />}
            title="Real-time AI Sensei"
            desc="Draw directly on the screen. Our AI analyzes your stroke order, balance, and form in real-time with detailed feedback."
            color="hover:border-pink-500/50 hover:bg-pink-500/5"
          />
          <FeatureCard
            icon={<Sword className="w-8 h-8 text-cyan-400" />}
            title="Interactive Quizzes"
            desc="Test your semantic knowledge with context-aware quizzes featuring smart distractor generation."
            color="hover:border-cyan-500/50 hover:bg-cyan-500/5"
          />
          <FeatureCard
            icon={<Laptop className="w-8 h-8 text-blue-400" />}
            title="Progress Dashboard"
            desc="Visualize your mastery with interactive grids and heatmaps. Track every character you've conquered."
            color="hover:border-blue-500/50 hover:bg-blue-500/5"
          />
          <FeatureCard
            icon={<Flame className="w-8 h-8 text-orange-400" />}
            title="Elemental Mastery"
            desc="Learn kanji grouped by their nature—Fire, Water, Wood. Understand the core meaning instantly."
            color="hover:border-orange-500/50 hover:bg-orange-500/5"
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8 text-emerald-400" />}
            title="Mnemonic Stories"
            desc="Learn the origin stories that make each character unforgettable. Connect shapes to meaning."
            color="hover:border-emerald-500/50 hover:bg-emerald-500/5"
          />
          <FeatureCard
            icon={<Mountain className="w-8 h-8 text-purple-400" />}
            title="Spaced Repetition"
            desc="Review at the perfect moment. Our SRS algorithm optimizes your learning intervals for long-term retention."
            color="hover:border-purple-500/50 hover:bg-purple-500/5"
          />
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 text-center border-t border-white/5 relative bg-zinc-900/30 backdrop-blur-md">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-900/10 pointer-events-none" />
        <h3 className="text-4xl md:text-5xl font-bold mb-8">Ready to master the elements?</h3>

        <div className="flex justify-center gap-6">
          <Link
            href="/learn"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-blue-50 transition-colors"
          >
            Begin Your Journey
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

      </section>
    </div>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  desc: string;
  color: string;
}

function FeatureCard({ icon, title, desc, color }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className={`p-8 rounded-3xl bg-zinc-900/40 border border-white/5 transition-all duration-300 ${color}`}
    >
      <div className="mb-6 p-4 bg-black/50 rounded-2xl inline-block border border-white/5 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-400 leading-relaxed text-sm">{desc}</p>
    </motion.div>
  );
}
