"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, getTierFromScore, calculateTierProgress } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Calendar, Zap, Award } from "lucide-react";

interface StatsCardsProps {
    score: number;
    totalEvents: number;
    lastEventTime?: number;
    monthlyGrowth?: number;
}

export function StatsCards({
    score,
    totalEvents,
    lastEventTime,
    monthlyGrowth = 0,
}: StatsCardsProps) {
    const tier = getTierFromScore(score);
    const tierProgress = calculateTierProgress(score);

    const stats = [
        {
            title: "Credit Events",
            value: totalEvents.toLocaleString(),
            description: "Total actions recorded",
            icon: Zap,
            color: "#00D4FF",
        },
        {
            title: "Current Tier",
            value: tier.name,
            description: `${Math.round(tierProgress)}% to next tier`,
            icon: Award,
            color: tier.color,
            progress: tierProgress,
        },
        {
            title: "Monthly Growth",
            value: `+${monthlyGrowth}`,
            description: "Points this month",
            icon: TrendingUp,
            color: "#10B981",
        },
        {
            title: "Last Activity",
            value: lastEventTime
                ? new Date(lastEventTime * 1000).toLocaleDateString()
                : "No activity",
            description: lastEventTime
                ? new Date(lastEventTime * 1000).toLocaleTimeString()
                : "Start building credit",
            icon: Calendar,
            color: "#8B5CF6",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat) => (
                <Card key={stat.title} variant="glass" hover>
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="text-sm text-gray-400">{stat.title}</p>
                                <p
                                    className="text-2xl font-bold mt-1"
                                    style={{ color: stat.color }}
                                >
                                    {stat.value}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                                {stat.progress !== undefined && (
                                    <Progress
                                        value={stat.progress}
                                        color={stat.color}
                                        className="mt-2"
                                        size="sm"
                                    />
                                )}
                            </div>
                            <div
                                className="p-2 rounded-lg"
                                style={{ backgroundColor: `${stat.color}20` }}
                            >
                                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
