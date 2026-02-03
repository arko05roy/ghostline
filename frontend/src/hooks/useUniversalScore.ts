"use client";

import { useState, useEffect } from "react";
import { Contract } from "ethers";
import { useWallet } from "@/hooks/useWallet";
import { ADDRESSES, RPC_URL } from "@/config/contracts";
import { UniversalCreditRegistryABI } from "@/config/abis";
import { JsonRpcProvider } from "ethers";

const readProvider = new JsonRpcProvider(RPC_URL);

export interface UniversalScore {
  totalScore: number;
  lastUpdated: number;
  eventCount: number;
}

export interface ScoreBreakdown {
  sourceIds: number[];
  scores: number[];
  sourceNames: string[];
}

export interface UniversalEvent {
  user: string;
  sourceId: number;
  actionType: number;
  amount: bigint;
  timestamp: number;
  pointsEarned: number;
}

export interface CreditSource {
  name: string;
  sourceType: number;
  weight: number;
  active: boolean;
  createdAt: number;
}

const ACTION_NAMES = ["Swap", "Lend", "Repay", "Stake", "Transfer", "Provide Liquidity"];

export function useUniversalScore(enabled = true) {
  const { address } = useWallet();
  const [score, setScore] = useState<UniversalScore | null>(null);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [events, setEvents] = useState<UniversalEvent[]>([]);
  const [sources, setSources] = useState<Map<number, CreditSource>>(new Map());
  const [loading, setLoading] = useState(true);
  const [totalEvents, setTotalEvents] = useState(0);

  const contract = new Contract(
    ADDRESSES.UniversalCreditRegistry,
    UniversalCreditRegistryABI as unknown as string[],
    readProvider
  );

  useEffect(() => {
    if (!enabled || !address) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load sources first
        const sourceCount = await contract.getSourceCount();
        const sourcesMap = new Map<number, CreditSource>();

        for (let i = 0; i < Number(sourceCount); i++) {
          const source = await contract.getSource(i);
          sourcesMap.set(i, {
            name: source[0],
            sourceType: Number(source[1]),
            weight: Number(source[2]),
            active: source[3],
            createdAt: Number(source[4]),
          });
        }

        if (mounted) setSources(sourcesMap);

        // Load universal score
        try {
          const scoreData = await contract.getMyUniversalScore({ from: address });
          if (mounted) {
            setScore({
              totalScore: Number(scoreData[0]),
              lastUpdated: Number(scoreData[1]),
              eventCount: Number(scoreData[2]),
            });
          }
        } catch (err) {
          console.log("Score not found, user has no credit yet");
          if (mounted) {
            setScore({ totalScore: 0, lastUpdated: 0, eventCount: 0 });
          }
        }

        // Load score breakdown
        try {
          const breakdownData = await contract.getMyScoreBreakdown({ from: address });
          const sourceIds = breakdownData[0].map((id: bigint) => Number(id));
          const scores = breakdownData[1].map((s: bigint) => Number(s));
          const sourceNames = sourceIds.map((id: number) => sourcesMap.get(id)?.name || `Source ${id}`);

          if (mounted) {
            setBreakdown({ sourceIds, scores, sourceNames });
          }
        } catch (err) {
          console.log("No breakdown available");
          if (mounted) {
            setBreakdown({ sourceIds: [], scores: [], sourceNames: [] });
          }
        }

        // Load event history
        try {
          const eventsData = await contract.getMyEventHistory({ from: address });
          if (mounted) {
            setEvents(
              eventsData.map((e: any) => ({
                user: e[0],
                sourceId: Number(e[1]),
                actionType: Number(e[2]),
                amount: e[3],
                timestamp: Number(e[4]),
                pointsEarned: Number(e[5]),
              }))
            );
          }
        } catch (err) {
          console.log("No events yet");
          if (mounted) {
            setEvents([]);
          }
        }

        // Load total events
        try {
          const total = await contract.getTotalUniversalEvents();
          if (mounted) {
            setTotalEvents(Number(total));
          }
        } catch (err) {
          console.log("Could not load total events");
        }

      } catch (err) {
        console.error("Error loading universal score:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [address, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const getSourceName = (sourceId: number): string => {
    return sources.get(sourceId)?.name || `Source ${sourceId}`;
  };

  const getActionName = (actionType: number): string => {
    return ACTION_NAMES[actionType] || `Action ${actionType}`;
  };

  const refresh = async () => {
    if (!address) return;
    // Trigger a re-render by changing the enabled state momentarily
    setLoading(true);
    setTimeout(() => setLoading(false), 100);
  };

  return {
    score,
    breakdown,
    events,
    sources: Array.from(sources.values()),
    loading,
    totalEvents,
    getSourceName,
    getActionName,
    refresh,
  };
}
