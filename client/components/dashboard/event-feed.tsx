"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActionTypeName, formatRelativeTime, formatEther } from "@/lib/utils";
import { CreditEvent, ACTIONS } from "@/lib/types";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeftRight,
    Landmark,
    CheckCircle,
    Lock,
    Send,
    Droplets,
} from "lucide-react";

const iconMap = {
    0: ArrowLeftRight,
    1: Landmark,
    2: CheckCircle,
    3: Lock,
    4: Send,
    5: Droplets,
};

interface EventFeedProps {
    events: CreditEvent[];
    maxEvents?: number;
}

export function EventFeed({ events, maxEvents = 5 }: EventFeedProps) {
    const displayEvents = events.slice(0, maxEvents);

    return (
        <Card variant="glass">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Recent Activity</span>
                    <Badge variant="info">{events.length} events</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {displayEvents.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <p>No credit events yet</p>
                        <p className="text-sm mt-1">Start building your credit history</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                            {displayEvents.map((event, index) => {
                                const actionInfo = ACTIONS[event.actionType];
                                const Icon = iconMap[event.actionType as keyof typeof iconMap];

                                return (
                                    <motion.div
                                        key={`${event.timestamp}-${index}`}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ delay: index * 0.05 }}
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
                                            <p className="text-sm font-medium text-white truncate">
                                                {getActionTypeName(event.actionType)}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatEther(event.amount, 2)} CTC
                                            </p>
                                        </div>

                                        {/* Points earned */}
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
                )}
            </CardContent>
        </Card>
    );
}
