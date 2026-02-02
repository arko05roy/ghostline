"use client";

import { motion } from "framer-motion";
import { getTierInfo } from "@/lib/utils";

interface GhostScoreGaugeProps {
  score: number;
  maxScore?: number;
  size?: number;
  animated?: boolean;
}

export default function GhostScoreGauge({
  score,
  maxScore = 1000,
  size = 240,
  animated = true,
}: GhostScoreGaugeProps) {
  const tier = getTierInfo(score);
  const pct = Math.min(score / maxScore, 1);
  const strokeWidth = 8;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - pct);
  const center = size / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-20"
        style={{ background: `radial-gradient(circle, ${tier.color}, transparent)` }}
      />

      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#1a1a1a"
          strokeWidth={strokeWidth}
        />
        {/* Score arc */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={tier.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={animated ? { strokeDashoffset: circumference } : undefined}
          animate={{ strokeDashoffset }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${tier.color}40)` }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="font-mono text-5xl font-bold tracking-tight"
          style={{ color: tier.color }}
          initial={animated ? { opacity: 0, scale: 0.8 } : undefined}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {animated ? (
            <Counter value={score} />
          ) : (
            score
          )}
        </motion.span>
        <motion.span
          className="text-xs tracking-[0.3em] uppercase mt-1"
          style={{ color: tier.color, opacity: 0.7 }}
          initial={animated ? { opacity: 0 } : undefined}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.2 }}
        >
          {tier.name}
        </motion.span>
        <span className="text-[10px] text-[#555] mt-0.5 font-mono">/ {maxScore}</span>
      </div>
    </div>
  );
}

function Counter({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <CounterInner value={value} />
    </motion.span>
  );
}

function CounterInner({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(value / 60));
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, 20);
    return () => clearInterval(interval);
  }, [value]);

  return <>{display}</>;
}

import { useState, useEffect } from "react";
