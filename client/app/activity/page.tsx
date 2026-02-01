"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActionTypeName, formatRelativeTime, formatEther, formatAddress } from "@/lib/utils";
import { CreditEvent, ACTIONS } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Users,
    Zap,
    TrendingUp,
    DollarSign,
    ArrowLeftRight,
    Landmark,
    CheckCircle,
    Lock,
    Send,
    Droplets,
    Globe,
} from "lucide-react";

const iconMap = {
    0: ArrowLeftRight,
    1: Landmark,
    2: CheckCircle,
    3: Lock,
    4: Send,
    5: Droplets,
};

// Mock global events for demo
const generateMockEvents = (count: number): CreditEvent[] => {
    const addresses = [
        "0x1234567890abcdef1234567890abcdef12345678",
        "0xabcdef1234567890abcdef1234567890abcdef12",
        "0x9876543210fedcba9876543210fedcba98765432",
        "0xfedcba9876543210fedcba9876543210fedcba98",
        "0x5555555555555555555555555555555555555555",
    ];

    return Array.from({ length: count }, (_, i) => ({
        user: addresses[i % addresses.length] as `0x${string}`,
        actionType: Math.floor(Math.random() * 6),
        amount: BigInt(Math.floor(Math.random() * 10000) * 1e18),
        timestamp: BigInt(Math.floor(Date.now() / 1000) - i * 300),
        pointsEarned: BigInt(Math.floor(Math.random() * 50) + 5),
    }));
};

const MOCK_EVENTS = generateMockEvents(20);
const MOCK_STATS = {
    totalUsers: 127,
    totalEvents: 3482,
    totalLoans: 89,
    totalVolume: "1250000",
};

export default function ActivityPage() {
    const [events, setEvents] = useState(MOCK_EVENTS);
    const [eventCount, setEventCount] = useState(MOCK_STATS.totalEvents);

    // Simulate new events coming in
    useEffect(() => {
        const interval = setInterval(() => {
            const newEvent: CreditEvent = {
                user: `0x${Math.random().toString(16).slice(2, 42)}` as `0x${string}`,
                actionType: Math.floor(Math.random() * 6),
                amount: BigInt(Math.floor(Math.random() * 5000) * 1e18),
                timestamp: BigInt(Math.floor(Date.now() / 1000)),
                pointsEarned: BigInt(Math.floor(Math.random() * 50) + 5),
            };

            setEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
            setEventCount((prev) => prev + 1);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Network Activity</h1>
                    <p className="text-gray-400 mt-1">
                        Real-time credit events across the network
                    </p>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm font-medium">Live</span>
                </div>
            </div>

            {/* Network stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Users",
                        value: MOCK_STATS.totalUsers.toLocaleString(),
                        icon: Users,
                        color: "#00D4FF",
                    },
                    {
                        label: "Credit Events",
                        value: eventCount.toLocaleString(),
                        icon: Zap,
                        color: "#10B981",
                        animated: true,
                    },
                    {
                        label: "Active Loans",
                        value: MOCK_STATS.totalLoans.toLocaleString(),
                        icon: Landmark,
                        color: "#8B5CF6",
                    },
                    {
                        label: "Total Volume",
                        value: `$${Number(MOCK_STATS.totalVolume).toLocaleString()}`,
                        icon: DollarSign,
                        color: "#F59E0B",
                    },
                ].map((stat) => (
                    <Card key={stat.label} variant="glass">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">{stat.label}</p>
                                    <p className="text-xl font-bold text-white mt-1">
                                        {stat.animated ? (
                                            <motion.span
                                                key={stat.value}
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                            >
                                                {stat.value}
                                            </motion.span>
                                        ) : (
                                            stat.value
                                        )}
                                    </p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live feed */}
                <div className="lg:col-span-2">
                    <Card variant="glass">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-cyan-400" />
                                Live Feed
                            </CardTitle>
                            <CardDescription>
                                Credit events from all users in real-time
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="max-h-[600px] overflow-y-auto">
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {events.map((event, index) => {
                                        const actionInfo = ACTIONS[event.actionType];
                                        const Icon = iconMap[event.actionType as keyof typeof iconMap];

                                        return (
                                            <motion.div
                                                key={`${event.timestamp}-${index}`}
                                                initial={{ opacity: 0, x: -20, height: 0 }}
                                                animate={{ opacity: 1, x: 0, height: "auto" }}
                                                exit={{ opacity: 0, x: 20, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                layout
                                                className="flex items-center gap-4 p-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors"
                                            >
                                                {/* Icon */}
                                                <div
                                                    className="p-2 rounded-lg shrink-0"
                                                    style={{ backgroundColor: `${actionInfo.color}20` }}
                                                >
                                                    <Icon
                                                        className="w-4 h-4"
                                                        style={{ color: actionInfo.color }}
                                                    />
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-white">
                                                            {formatAddress(event.user)}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {getActionTypeName(event.actionType)}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {formatEther(event.amount, 0)} CTC
                                                    </p>
                                                </div>

                                                {/* Points and time */}
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-medium text-cyan-400">
                                                        +{Number(event.pointsEarned)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {formatRelativeTime(Number(event.timestamp))}
                                                    </p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar stats */}
                <div className="space-y-6">
                    {/* Action breakdown */}
                    <Card variant="glass">
                        <CardHeader>
                            <CardTitle>Action Distribution</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {ACTIONS.map((action) => {
                                const count = events.filter((e) => e.actionType === action.type).length;
                                const percentage = (count / events.length) * 100;

                                return (
                                    <div key={action.type} className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">{action.name}</span>
                                            <span style={{ color: action.color }}>{count}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full rounded-full"
                                                style={{ backgroundColor: action.color }}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${percentage}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Top performers (mock) */}
                    <Card variant="glass">
                        <CardHeader>
                            <CardTitle>Top Credit Builders</CardTitle>
                            <CardDescription>This week</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {[
                                { rank: 1, address: "0x1234...5678", score: 847, change: "+52" },
                                { rank: 2, address: "0xabcd...ef12", score: 723, change: "+38" },
                                { rank: 3, address: "0x9876...4321", score: 691, change: "+41" },
                                { rank: 4, address: "0xfedc...ba98", score: 654, change: "+29" },
                                { rank: 5, address: "0x5555...5555", score: 612, change: "+35" },
                            ].map((user) => (
                                <div
                                    key={user.rank}
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/30"
                                >
                                    <div
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${user.rank === 1
                                                ? "bg-yellow-500/20 text-yellow-400"
                                                : user.rank === 2
                                                    ? "bg-gray-400/20 text-gray-300"
                                                    : user.rank === 3
                                                        ? "bg-orange-500/20 text-orange-400"
                                                        : "bg-gray-800 text-gray-500"
                                            }`}
                                    >
                                        {user.rank}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">
                                            {user.address}
                                        </p>
                                        <p className="text-xs text-gray-500">Score: {user.score}</p>
                                    </div>
                                    <span className="text-xs font-medium text-green-400">
                                        {user.change}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Network health */}
                    <Card variant="gradient" className="border-cyan-500/20">
                        <CardContent className="p-4 text-center">
                            <Globe className="w-10 h-10 text-cyan-400 mx-auto mb-3" />
                            <p className="text-lg font-bold text-white">Network Healthy</p>
                            <p className="text-xs text-gray-400 mt-1">
                                99.9% uptime • {eventCount.toLocaleString()} events processed
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
