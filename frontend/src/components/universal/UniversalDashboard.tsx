"use client";

import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { useUniversalScore } from "@/hooks/useUniversalScore";
import GhostScoreGauge from "@/components/ui/GhostScoreGauge";
import Card from "@/components/ui/Card";
import { ScoreSkeleton, CardSkeleton } from "@/components/ui/Skeleton";

const SOURCE_TYPE_NAMES = ["Appchain", "Mainnet Protocol", "RWA Oracle"];

export default function UniversalDashboard() {
  const { address } = useWallet();
  const { score, breakdown, events, sources, loading, totalEvents, getSourceName, getActionName } =
    useUniversalScore(!!address);

  if (!address) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
        <div className="text-[#555] text-sm font-mono mb-4">Connect wallet to view universal score</div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <ScoreSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Universal Credit Score</h2>
        <p className="text-sm text-[#555] font-mono">
          Aggregated from {sources.length} sources · {totalEvents.toLocaleString()} total events
        </p>
      </div>

      {/* Score Gauge */}
      <div className="flex justify-center">
        <GhostScoreGauge score={score?.totalScore || 0} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-1">Total Score</div>
          <div className="text-2xl font-bold text-white font-mono">{score?.totalScore || 0}</div>
        </Card>
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-1">Events</div>
          <div className="text-2xl font-bold text-white font-mono">{score?.eventCount || 0}</div>
        </Card>
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-1">Sources</div>
          <div className="text-2xl font-bold text-white font-mono">
            {breakdown?.sourceIds.length || 0}
          </div>
        </Card>
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-1">Tier</div>
          <div className="text-2xl font-bold font-mono" style={{ color: getTierColor(score?.totalScore || 0) }}>
            {getTier(score?.totalScore || 0)}
          </div>
        </Card>
      </div>

      {/* Score Breakdown */}
      <Card glow="#00FF88">
        <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">
          Score Breakdown by Source
        </div>

        {breakdown && breakdown.sourceIds.length > 0 ? (
          <div className="space-y-3">
            {breakdown.sourceIds.map((sourceId, i) => {
              const source = sources.find((s) => sources.indexOf(s) === sourceId);
              const percentage = ((breakdown.scores[i] / (score?.totalScore || 1)) * 100).toFixed(1);

              return (
                <div key={sourceId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{breakdown.sourceNames[i]}</span>
                      <span className="text-[10px] text-[#555] font-mono">
                        ({SOURCE_TYPE_NAMES[source?.sourceType || 0]})
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FF88]/10 text-[#00FF88] font-mono">
                        {source?.weight ? `${source.weight / 100}x` : "1x"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono">{breakdown.scores[i]}</span>
                      <span className="text-[#555] text-xs font-mono">({percentage}%)</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-[#111] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                      className="h-full bg-gradient-to-r from-[#00FF88] to-[#00CC66]"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-[#555] text-sm font-mono">
            No credit sources yet. Start building credit!
          </div>
        )}
      </Card>

      {/* Registered Sources */}
      <Card>
        <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">
          Registered Credit Sources
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sources.map((source, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-[#222] rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-white text-sm font-medium">{source.name}</div>
                  <div className="text-[10px] text-[#555] font-mono">
                    {SOURCE_TYPE_NAMES[source.sourceType]}
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FF88]/10 text-[#00FF88] font-mono">
                  {source.weight / 100}x
                </span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${source.active ? "bg-[#00FF88]" : "bg-red-500"}`} />
                <span className="text-[10px] text-[#555] font-mono">
                  {source.active ? "Active" : "Inactive"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Event History */}
      <Card>
        <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">
          Universal Credit History
        </div>

        {events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 10).map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-l-2 border-[#00FF88] pl-4 py-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm font-medium">{getActionName(event.actionType)}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#222] text-[#888] font-mono">
                      {getSourceName(event.sourceId)}
                    </span>
                  </div>
                  <span className="text-[#00FF88] text-sm font-mono">+{event.pointsEarned}</span>
                </div>
                <div className="text-[10px] text-[#555] font-mono">
                  {new Date(event.timestamp * 1000).toLocaleString()}
                </div>
              </motion.div>
            ))}
            {events.length > 10 && (
              <div className="text-center text-[#555] text-xs font-mono pt-2">
                + {events.length - 10} more events
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-[#555] text-sm font-mono">
            No credit events yet. Start building credit by:
            <ul className="mt-2 space-y-1 text-left max-w-xs mx-auto">
              <li>• Swapping tokens on DEXs</li>
              <li>• Lending or staking assets</li>
              <li>• Repaying loans</li>
            </ul>
          </div>
        )}
      </Card>
    </motion.div>
  );
}

function getTier(score: number): string {
  if (score >= 600) return "Elite";
  if (score >= 300) return "Trusted";
  if (score >= 100) return "Builder";
  return "Newcomer";
}

function getTierColor(score: number): string {
  if (score >= 600) return "#FFD700"; // Gold
  if (score >= 300) return "#C0C0C0"; // Silver
  if (score >= 100) return "#CD7F32"; // Bronze
  return "#6B7280"; // Gray
}
