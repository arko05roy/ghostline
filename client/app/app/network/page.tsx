"use client";

import { useReadContract } from "wagmi";
import { CreditRegistryABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Activity, Users, TrendingUp, Award } from "lucide-react";

export default function NetworkPage() {
  const registryAddress = CONTRACT_ADDRESSES.demoAppChain.registry;

  const { data: totalEvents } = useReadContract({
    address: registryAddress,
    abi: CreditRegistryABI,
    functionName: "getTotalCreditEvents",
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Network Stats</h1>
        <p className="text-slate-400">Global CreditNet Protocol statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Events</p>
              <p className="text-3xl font-bold text-slate-100">
                {totalEvents ? totalEvents.toString() : "0"}
              </p>
            </div>
            <Activity className="w-10 h-10 text-blue-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Active Users</p>
              <p className="text-3xl font-bold text-slate-100">-</p>
            </div>
            <Users className="w-10 h-10 text-green-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Loans</p>
              <p className="text-3xl font-bold text-slate-100">-</p>
            </div>
            <TrendingUp className="w-10 h-10 text-amber-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Appchains</p>
              <p className="text-3xl font-bold text-slate-100">1</p>
            </div>
            <Award className="w-10 h-10 text-purple-400" />
          </div>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-300 mb-6">Global Activity</h3>
        <div className="text-center py-12 text-slate-500">
          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Activity feed coming soon</p>
        </div>
      </Card>

      {/* Leaderboard */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-300 mb-6">Top Credit Scores</h3>
        <div className="text-center py-12 text-slate-500">
          <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Leaderboard coming soon</p>
        </div>
      </Card>
    </div>
  );
}
