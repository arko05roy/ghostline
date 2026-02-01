"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn, getTierFromScore } from "@/lib/utils";

interface ScoreGaugeProps {
    score: number;
    maxScore?: number;
    size?: "sm" | "md" | "lg";
    showTier?: boolean;
    animated?: boolean;
}

export function ScoreGauge({
    score,
    maxScore = 1000,
    size = "md",
    showTier = true,
    animated = true,
}: ScoreGaugeProps) {
    const [displayScore, setDisplayScore] = useState(0);
    const tier = getTierFromScore(score);

    const sizes = {
        sm: { container: "w-32 h-32", stroke: 6, fontSize: "text-2xl" },
        md: { container: "w-48 h-48", stroke: 8, fontSize: "text-4xl" },
        lg: { container: "w-64 h-64", stroke: 10, fontSize: "text-5xl" },
    };

    const { container, stroke, fontSize } = sizes[size];
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(100, (score / maxScore) * 100);
    const offset = circumference - (percentage / 100) * circumference;

    // Animate the score count
    useEffect(() => {
        if (!animated) {
            setDisplayScore(score);
            return;
        }

        const duration = 1500;
        const steps = 60;
        const stepTime = duration / steps;
        const increment = score / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= score) {
                setDisplayScore(score);
                clearInterval(timer);
            } else {
                setDisplayScore(Math.floor(current));
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [score, animated]);

    return (
        <div className={cn("relative flex items-center justify-center", container)}>
            {/* Background glow */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-30"
                style={{ backgroundColor: tier.color }}
            />

            {/* SVG Gauge */}
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 160 160">
                {/* Background circle */}
                <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={stroke}
                />

                {/* Progress circle */}
                <motion.circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="none"
                    stroke={tier.color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    style={{
                        filter: `drop-shadow(0 0 6px ${tier.color})`,
                    }}
                />
            </svg>

            {/* Center content */}
            <div className="relative z-10 flex flex-col items-center">
                <motion.span
                    className={cn("font-bold tabular-nums", fontSize)}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    style={{ color: tier.color }}
                >
                    {displayScore}
                </motion.span>

                {showTier && (
                    <motion.span
                        className="text-sm text-gray-400 mt-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                    >
                        {tier.name}
                    </motion.span>
                )}
            </div>

            {/* Tier indicator dots */}
            <div className="absolute -bottom-6 flex gap-2">
                {["Newcomer", "Builder", "Trusted", "Elite"].map((t) => (
                    <div
                        key={t}
                        className={cn(
                            "w-2 h-2 rounded-full transition-all",
                            tier.name === t ? "scale-125" : "opacity-30"
                        )}
                        style={{
                            backgroundColor:
                                t === "Newcomer"
                                    ? "#6B7280"
                                    : t === "Builder"
                                        ? "#CD7F32"
                                        : t === "Trusted"
                                            ? "#C0C0C0"
                                            : "#FFD700",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
