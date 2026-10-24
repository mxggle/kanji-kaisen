"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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
export function FloatingKanji() {
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
