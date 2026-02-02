"use client";

import { useAccount, useReadContract } from "wagmi";
import { CreditChainFactoryABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Network, Plus } from "lucide-react";
import Link from "next/link";

export default function AppChainSelectorPage() {
  const { address, isConnected } = useAccount();

  const { data: chainCount } = useReadContract({
    address: CONTRACT_ADDRESSES.creditChainFactory,
    abi: CreditChainFactoryABI,
    functionName: "getAppChainCount",
  });

  // For demo, use the demo appchain
  const demoChainId = 0; // Update this after deploying via factory

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Select Appchain</h1>
        <p className="text-slate-400">Choose an appchain to interact with or deploy a new one</p>
      </div>

      {!isConnected ? (
        <Card className="text-center py-12">
          <Network className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500 mb-6">Please connect your wallet to view appchains</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Demo Appchain Card */}
          <Card variant="gradient" className="cursor-pointer hover:scale-105 transition-transform">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-slate-100 mb-1">Ghostline Demo</h3>
                <p className="text-sm text-slate-400">Demo appchain</p>
              </div>
              <Network className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Chain ID:</span>
                <span className="text-slate-200 font-mono">{demoChainId}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status:</span>
                <span className="text-green-400">Active</span>
              </div>
            </div>
            <Link href={`/app/${demoChainId}`}>
              <Button className="w-full">Select Appchain</Button>
            </Link>
          </Card>

          {/* Deploy New Appchain Card */}
          <Card className="cursor-pointer hover:scale-105 transition-transform border-dashed border-2 border-slate-600">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-300 mb-2">Deploy New Appchain</h3>
              <p className="text-sm text-slate-500 mb-6">
                Create your own isolated credit environment
              </p>
              <Link href="/app/deploy">
                <Button variant="secondary" className="w-full">
                  Deploy Appchain
                </Button>
              </Link>
            </div>
          </Card>

          {/* Stats Card */}
          {chainCount !== undefined && (
            <Card>
              <h3 className="text-lg font-semibold text-slate-300 mb-4">Network Stats</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Total Appchains</div>
                  <div className="text-2xl font-bold text-amber-400">{Number(chainCount)}</div>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
