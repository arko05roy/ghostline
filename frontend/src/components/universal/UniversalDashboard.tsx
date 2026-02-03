"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Contract, BrowserProvider } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { useConnectorClient } from "wagmi";
import { useAppChain } from "@/hooks/useAppChain";
import GhostScoreGauge from "@/components/ui/GhostScoreGauge";
import Card from "@/components/ui/Card";
import { ScoreSkeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { ADDRESSES } from "@/config/contracts";

const ACTION_NAMES = ["Swap", "Lend", "Stake", "Transfer", "Repay", "Liquidity"];

interface CreditEvent {
  actionType: number;
  amount: bigint;
  timestamp: bigint;
  pointsEarned: bigint;
}

export default function UniversalDashboard() {
  const { address } = useWallet();
  const { data: client } = useConnectorClient();
  const { selectedChain, appChains } = useAppChain();

  const [score, setScore] = useState(0);
  const [events, setEvents] = useState<CreditEvent[]>([]);
  const [eventCount, setEventCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Use refs to prevent race conditions
  const loadingRef = useRef(false);
  const lastLoadedRef = useRef<string | null>(null);

  const registryAddress = selectedChain?.registry || ADDRESSES.CreditRegistry;

  useEffect(() => {
    if (!address || !client) {
      setLoading(false);
      return;
    }

    // Create a unique key for this load
    const loadKey = `${registryAddress}-${address}`;

    // Skip if already loaded this exact combination
    if (lastLoadedRef.current === loadKey) {
      return;
    }

    // Skip if already loading
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { account, chain, transport } = client;
        const provider = new BrowserProvider(transport, { chainId: chain.id, name: chain.name });
        const signer = await provider.getSigner(account.address);

        const signerRegistry = new Contract(registryAddress, [
          "function getMyScore() view returns (uint256)",
          "function getMyCreditHistory() view returns (tuple(address user, uint8 actionType, uint256 amount, uint256 timestamp, uint256 pointsEarned)[])",
          "function getCreditEventCount(address user) view returns (uint256)",
        ], signer);

        const [s, h, count] = await Promise.all([
          signerRegistry.getMyScore().catch(() => 0n),
          signerRegistry.getMyCreditHistory().catch(() => []),
          signerRegistry.getCreditEventCount(address).catch(() => 0n),
        ]);

        if (cancelled) return;

        setScore(Number(s));
        setEvents(
          (h as CreditEvent[]).map((e) => ({
            actionType: Number(e.actionType),
            amount: e.amount,
            timestamp: e.timestamp,
            pointsEarned: e.pointsEarned,
          }))
        );
        setEventCount(Number(count));
        lastLoadedRef.current = loadKey;
      } catch (err) {
        console.error("Universal dashboard error:", err);
      }
      if (!cancelled) {
        setLoading(false);
        loadingRef.current = false;
      }
    }

    load();

    return () => {
      cancelled = true;
      loadingRef.current = false;
    };
  }, [address, client, registryAddress]);

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

  const getTier = (s: number) => {
    if (s >= 600) return "Elite";
    if (s >= 300) return "Trusted";
    if (s >= 100) return "Builder";
    return "Newcomer";
  };

  const getTierColor = (s: number) => {
    if (s >= 600) return "#FFD700";
    if (s >= 300) return "#C0C0C0";
    if (s >= 100) return "#CD7F32";
    return "#6B7280";
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Universal Credit Score</h2>
        <p className="text-sm text-[#555] font-mono">
          Aggregated from {appChains.length} appchains · {eventCount} total events
        </p>
      </div>

      {/* Score Gauge */}
      <div className="flex justify-center">
        <GhostScoreGauge score={score} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-1">Total Score</div>
          <div className="text-2xl font-bold text-white font-mono">{score}</div>
        </Card>
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-1">Events</div>
          <div className="text-2xl font-bold text-white font-mono">{eventCount}</div>
        </Card>
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-1">AppChain</div>
          <div className="text-2xl font-bold text-white font-mono">#{selectedChain?.id || 0}</div>
        </Card>
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-1">Tier</div>
          <div className="text-2xl font-bold font-mono" style={{ color: getTierColor(score) }}>
            {getTier(score)}
          </div>
        </Card>
      </div>

      {/* Current AppChain */}
      <Card glow="#00FF88">
        <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">
          Current AppChain
        </div>
        {selectedChain ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">{selectedChain.name}</span>
              <span className="text-[#00FF88] text-sm font-mono">#{selectedChain.id}</span>
            </div>
            <div className="text-[10px] text-[#555] font-mono">
              Registry: {selectedChain.registry.slice(0, 10)}...{selectedChain.registry.slice(-6)}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${selectedChain.active ? "bg-[#00FF88]" : "bg-red-500"}`} />
              <span className="text-[10px] text-[#555] font-mono">
                {selectedChain.active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-[#555] text-sm font-mono">No appchain selected</div>
        )}
      </Card>

      {/* Event History */}
      <Card>
        <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">
          Credit History
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
                  <span className="text-white text-sm font-medium">
                    {ACTION_NAMES[event.actionType] || `Action ${event.actionType}`}
                  </span>
                  <span className="text-[#00FF88] text-sm font-mono">+{Number(event.pointsEarned)}</span>
                </div>
                <div className="text-[10px] text-[#555] font-mono">
                  {new Date(Number(event.timestamp) * 1000).toLocaleString()}
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
            No credit events yet. Start performing DeFi actions to build your score.
          </div>
        )}
      </Card>

      {/* Available AppChains */}
      <Card>
        <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">
          Available AppChains ({appChains.length})
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {appChains.map((chain, i) => (
            <motion.div
              key={chain.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`border rounded-lg p-3 ${
                selectedChain?.id === chain.id
                  ? "border-[#00FF88]/50 bg-[#00FF88]/5"
                  : "border-[#222]"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-white text-sm font-medium">{chain.name}</div>
                  <div className="text-[10px] text-[#555] font-mono">#{chain.id}</div>
                </div>
                {selectedChain?.id === chain.id && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FF88]/10 text-[#00FF88] font-mono">
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${chain.active ? "bg-[#00FF88]" : "bg-red-500"}`} />
                <span className="text-[10px] text-[#555] font-mono">
                  {chain.active ? "Active" : "Inactive"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}
