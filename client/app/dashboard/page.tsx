"use client";

import { useAccount } from "wagmi";
import { ScoreGauge } from "@/components/dashboard/score-gauge";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { EventFeed } from "@/components/dashboard/event-feed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreditScore, useCreditHistory, useCreditStats } from "@/lib/hooks/use-credit-score";
import { ArrowRight, Wallet, Shield, TrendingUp } from "lucide-react";
import Link from "next/link";

// Mock data for demo - will be replaced with real contract data
const MOCK_EVENTS = [
    { user: "0x123" as `0x${string}`, actionType: 5, amount: BigInt(1000e18), timestamp: BigInt(Date.now() / 1000 - 3600), pointsEarned: BigInt(30) },
    { user: "0x123" as `0x${string}`, actionType: 1, amount: BigInt(500e18), timestamp: BigInt(Date.now() / 1000 - 7200), pointsEarned: BigInt(25) },
    { user: "0x123" as `0x${string}`, actionType: 2, amount: BigInt(200e18), timestamp: BigInt(Date.now() / 1000 - 14400), pointsEarned: BigInt(50) },
    { user: "0x123" as `0x${string}`, actionType: 0, amount: BigInt(100e18), timestamp: BigInt(Date.now() / 1000 - 86400), pointsEarned: BigInt(10) },
];

export default function DashboardPage() {
    const { isConnected, address } = useAccount();

    // Use mock data for demo
    const score = 450; // Will come from useCreditScore
    const events = MOCK_EVENTS;
    const totalEvents = 4;
    const lastEventTime = Number(MOCK_EVENTS[0]?.timestamp ?? 0);

    // Not connected state
    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="p-4 rounded-full bg-cyan-500/10 mb-6">
                    <Wallet className="w-12 h-12 text-cyan-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    Connect Your Wallet
                </h1>
                <p className="text-gray-400 max-w-md mb-6">
                    Connect your wallet to view your credit score, history, and start
                    building your on-chain reputation.
                </p>
                <Badge variant="info" className="text-sm">
                    Supports MetaMask, WalletConnect & more
                </Badge>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Credit Dashboard</h1>
                    <p className="text-gray-400 mt-1">
                        Track your on-chain creditworthiness
                    </p>
                </div>
                <Link href="/actions">
                    <Button variant="gradient">
                        Build Credit
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column - Score gauge */}
                <div className="lg:col-span-1">
                    <Card variant="gradient" className="p-8 flex flex-col items-center">
                        <h2 className="text-sm font-medium text-gray-400 mb-6">
                            Your Credit Score
                        </h2>
                        <ScoreGauge score={score} size="lg" />

                        <div className="mt-8 w-full space-y-3">
                            <Link href="/ghostscore" className="block">
                                <Button variant="outline" className="w-full justify-between">
                                    <span className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Generate GhostScore
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                            <Link href="/vault" className="block">
                                <Button variant="outline" className="w-full justify-between">
                                    <span className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4" />
                                        Get Loan
                                    </span>
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>

                {/* Right column - Stats and activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats cards */}
                    <StatsCards
                        score={score}
                        totalEvents={totalEvents}
                        lastEventTime={lastEventTime}
                        monthlyGrowth={115}
                    />

                    {/* Recent activity */}
                    <EventFeed events={events} maxEvents={5} />
                </div>
            </div>

            {/* Info banner */}
            <Card variant="glass" className="border-cyan-500/20">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Shield className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-white font-medium">
                            Your credit score is private
                        </p>
                        <p className="text-xs text-gray-400">
                            Only you can see your actual score. Use GhostScore to prove your
                            creditworthiness without revealing the exact number.
                        </p>
                    </div>
                    <Link href="/ghostscore">
                        <Button variant="ghost" size="sm">
                            Learn More
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
