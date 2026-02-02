"use client";

import { Card } from "@/components/ui/Card";
import { getTierForScore } from "@/lib/utils";
import { Activity, Award, TrendingUp, Target } from "lucide-react";

interface StatsCardsProps {
  score: number;
  totalEvents: number;
}

export function StatsCards({ score, totalEvents }: StatsCardsProps) {
  const tier = getTierForScore(score);
  const nextTierThreshold = score < 100 ? 100 : score < 300 ? 300 : score < 600 ? 600 : 1000;
  const progressToNextTier = score < 100
    ? (score / 100) * 100
    : score < 300
    ? ((score - 100) / 200) * 100
    : score < 600
    ? ((score - 300) / 300) * 100
    : ((score - 600) / 400) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">Total Events</p>
            <p className="text-2xl font-bold text-slate-100">{totalEvents}</p>
          </div>
          <Activity className="w-8 h-8 text-blue-400" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">Current Tier</p>
            <p className="text-2xl font-bold text-amber-400">{tier}</p>
          </div>
          <Award className="w-8 h-8 text-amber-400" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-400 mb-1">Progress to Next Tier</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{score}</span>
                <span>{nextTierThreshold}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progressToNextTier, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <Target className="w-8 h-8 text-green-400 ml-4" />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400 mb-1">Credit Score</p>
            <p className="text-2xl font-bold text-slate-100">{score}</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-400" />
        </div>
      </Card>
    </div>
  );
}
