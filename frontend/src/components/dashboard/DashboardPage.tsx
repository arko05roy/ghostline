"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
import GhostScoreGauge from "@/components/ui/GhostScoreGauge";
import Card from "@/components/ui/Card";
import { ScoreSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { getActionName, formatCTC, shortenAddress, getTierInfo } from "@/lib/utils";

interface CreditEvent {
  actionType: number;
  amount: bigint;
  timestamp: bigint;
  pointsEarned: bigint;
}

export default function DashboardPage() {
  const { address } = useWallet();
  const { registry, nft } = useContracts();

  const [score, setScore] = useState<number | null>(null);
  const [history, setHistory] = useState<CreditEvent[]>([]);
  const [commitment, setCommitment] = useState<string>("");
  const [eventCount, setEventCount] = useState(0);
  const [badges, setBadges] = useState<{ tier: string; score: number }>({ tier: "", score: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) return;
    async function load() {
      setLoading(true);
      try {
        const [s, h, c, count, badge] = await Promise.all([
          registry.getMyScore().catch(() => 0n),
          registry.getMyCreditHistory().catch(() => []),
          registry.getScoreCommitment(address).catch(() => "0x0"),
          registry.getCreditEventCount(address).catch(() => 0n),
          nft.getHighestBadge(address).catch(() => ({ tier: "None", score: 0n })),
        ]);
        setScore(Number(s));
        setHistory(
          (h as CreditEvent[]).map((e) => ({
            actionType: Number(e.actionType),
            amount: e.amount,
            timestamp: e.timestamp,
            pointsEarned: e.pointsEarned,
          }))
        );
        setCommitment(String(c));
        setEventCount(Number(count));
        setBadges({ tier: badge.tier || badge[0] || "None", score: Number(badge.score || badge[1] || 0n) });
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, [address, registry, nft]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-center">
          <ScoreSkeleton />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  const tier = score !== null ? getTierInfo(score) : getTierInfo(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Score + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8">
        {/* Score Gauge */}
        <Card className="flex flex-col items-center justify-center py-10">
          <div className="text-[10px] text-[#555] tracking-[0.3em] uppercase mb-6">
            GHOST SCORE
          </div>
          <GhostScoreGauge score={score ?? 0} />
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-2">
              Current Tier
            </div>
            <div
              className="text-2xl font-bold font-mono"
              style={{ color: tier.color }}
            >
              {tier.name}
            </div>
          </Card>
          <Card>
            <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-2">
              Credit Events
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {eventCount}
            </div>
          </Card>
          <Card>
            <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-2">
              Highest Badge
            </div>
            <div className="text-2xl font-bold font-mono text-white">
              {badges.tier || "None"}
            </div>
            {badges.score > 0 && (
              <div className="text-xs text-[#555] font-mono mt-1">
                Score: {badges.score}
              </div>
            )}
          </Card>
          <Card>
            <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-2">
              Score Commitment
            </div>
            <div className="text-xs font-mono text-[#888] break-all">
              {commitment !== "0x0000000000000000000000000000000000000000000000000000000000000000"
                ? shortenAddress(commitment, 8)
                : "No commitment yet"}
            </div>
          </Card>
        </div>
      </div>

      {/* Credit History */}
      <Card>
        <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-4">
          Credit History
        </div>
        {history.length === 0 ? (
          <div className="text-center py-12 text-[#444] font-mono text-sm">
            No credit events yet. Start performing DeFi actions to build your score.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#555] text-[10px] tracking-wider uppercase">
                  <th className="text-left pb-3">Action</th>
                  <th className="text-right pb-3">Amount</th>
                  <th className="text-right pb-3">Points</th>
                  <th className="text-right pb-3">Time</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[...history].reverse().map((evt, i) => (
                  <motion.tr
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-t border-[#111] text-[#aaa]"
                  >
                    <td className="py-3">
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: "#00FF88" }}
                        />
                        {getActionName(evt.actionType)}
                      </span>
                    </td>
                    <td className="text-right py-3">
                      {formatCTC(evt.amount)} CTC
                    </td>
                    <td className="text-right py-3 text-[#00FF88]">
                      +{Number(evt.pointsEarned)}
                    </td>
                    <td className="text-right py-3 text-[#555] text-xs">
                      {new Date(Number(evt.timestamp) * 1000).toLocaleDateString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
