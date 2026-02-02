"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getTierForScore, getTierColor } from "@/lib/utils";

interface CreditGaugeProps {
  score: number;
  maxScore?: number;
}

export function CreditGauge({ score, maxScore = 1000 }: CreditGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const percentage = Math.min((score / maxScore) * 100, 100);
  const animatedPercentage = Math.min((animatedScore / maxScore) * 100, 100);

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getColor = () => {
    if (score >= 800) return "#F59E0B"; // gold
    if (score >= 600) return "#10B981"; // green
    if (score >= 400) return "#FBBF24"; // yellow
    if (score >= 200) return "#F97316"; // orange
    return "#EF4444"; // red
  };

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <Card variant="gradient" className="text-center">
      <div className="relative inline-block">
        <svg width="240" height="240" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="120"
            cy="120"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-700"
          />
          {/* Animated score circle */}
          <circle
            cx="120"
            cy="120"
            r="90"
            fill="none"
            stroke={getColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold" style={{ color: getColor() }}>
            {animatedScore}
          </div>
          <div className="text-sm text-slate-400 mt-1">of {maxScore}</div>
        </div>
      </div>
      <div className="mt-6">
        <Badge variant="warning" className="text-base px-4 py-1.5">
          {getTierForScore(score)}
        </Badge>
      </div>
      <div className="mt-4 text-sm text-slate-400">
        Credit Score
      </div>
    </Card>
  );
}
