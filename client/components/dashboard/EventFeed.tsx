"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ActionType } from "@/lib/contracts";
import { formatNumber } from "@/lib/utils";
import { ArrowRight, TrendingUp } from "lucide-react";

interface CreditEvent {
  user: string;
  actionType: ActionType;
  amount: bigint;
  timestamp: bigint;
  pointsEarned: bigint;
}

interface EventFeedProps {
  events: CreditEvent[];
}

const actionLabels: Record<ActionType, string> = {
  [ActionType.SWAP]: "Swap",
  [ActionType.LEND]: "Lend",
  [ActionType.REPAY]: "Repay",
  [ActionType.STAKE]: "Stake",
  [ActionType.TRANSFER]: "Transfer",
  [ActionType.PROVIDE_LIQUIDITY]: "Liquidity",
};

const actionColors: Record<ActionType, string> = {
  [ActionType.SWAP]: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  [ActionType.LEND]: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  [ActionType.REPAY]: "bg-green-500/20 text-green-400 border-green-500/30",
  [ActionType.STAKE]: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  [ActionType.TRANSFER]: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  [ActionType.PROVIDE_LIQUIDITY]: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

export function EventFeed({ events }: EventFeedProps) {
  if (events.length === 0) {
    return (
      <Card>
        <h3 className="text-lg font-semibold text-slate-300 mb-4">Recent Events</h3>
        <div className="text-center py-8 text-slate-500">
          <p>No credit events yet</p>
          <p className="text-sm mt-2">Start building credit by performing DeFi actions</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-slate-300 mb-6">Recent Events</h3>
      <div className="space-y-4">
        {events.slice(0, 10).map((event, index) => {
          const date = new Date(Number(event.timestamp) * 1000);
          return (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all"
            >
              <div className="flex-shrink-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${actionColors[event.actionType]}`}
                >
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    className={actionColors[event.actionType]}
                  >
                    {actionLabels[event.actionType]}
                  </Badge>
                  <span className="text-sm text-slate-400">
                    {date.toLocaleDateString()} {date.toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-sm text-slate-300">
                  Amount: {formatNumber(event.amount)} tokens
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <TrendingUp className="w-4 h-4" />
                +{formatNumber(event.pointsEarned, 0)} pts
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
