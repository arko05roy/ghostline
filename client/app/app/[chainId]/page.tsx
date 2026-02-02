"use client";

import { useAccount, useReadContract } from "wagmi";
import { CreditRegistryABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { CreditGauge } from "@/components/dashboard/CreditGauge";
import { ScoreHistory } from "@/components/dashboard/ScoreHistory";
import { EventFeed } from "@/components/dashboard/EventFeed";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { Card } from "@/components/ui/Card";
import { useMemo } from "react";
import { useCreditHistory } from "@/lib/hooks/useCreditScore";
import { NFTBadge } from "@/components/dashboard/NFTBadge";

export default function DashboardPage({ params }: { params: { chainId: string } }) {
  const { address, isConnected } = useAccount();
  const chainId = params.chainId;

  // Get registry address - for demo, use demo appchain registry
  const registryAddress = CONTRACT_ADDRESSES.demoAppChain.registry;

  const { data: score } = useReadContract({
    address: registryAddress,
    abi: CreditRegistryABI,
    functionName: "getMyScore",
    query: {
      enabled: isConnected && !!address,
    },
  });

  const { history } = useCreditHistory(registryAddress);

  const { data: totalEvents } = useReadContract({
    address: registryAddress,
    abi: CreditRegistryABI,
    functionName: "getTotalCreditEvents",
  });

  const currentScore = score ? Number(score) : 0;
  const eventCount = history.length || 0;

  // Transform history for chart
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return [];
    return history.map((event, index) => ({
      timestamp: Number(event.timestamp),
      score: history.slice(0, index + 1).reduce((sum, e) => sum + Number(e.pointsEarned), 0),
    }));
  }, [history]);

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500">Please connect your wallet to view your dashboard</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Dashboard</h1>
        <p className="text-slate-400">Appchain ID: {chainId}</p>
      </div>

      {/* Stats Cards */}
      <StatsCards score={currentScore} totalEvents={eventCount} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Score Gauge */}
        <div className="lg:col-span-1">
          <CreditGauge score={currentScore} />
        </div>

        {/* Score History Chart */}
        <div className="lg:col-span-2">
          <ScoreHistory data={chartData} />
        </div>
      </div>

      {/* Event Feed and NFT Badge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EventFeed events={history} />
        </div>
        <div>
          <NFTBadge chainId={chainId} />
        </div>
      </div>
    </div>
  );
}
