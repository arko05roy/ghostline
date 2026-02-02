"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CrossChainBridgeABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight, ArrowLeft, Shield } from "lucide-react";

export default function BridgePage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [fromChainId, setFromChainId] = useState("0");
  const [toChainId, setToChainId] = useState("0");

  const bridgeAddress = CONTRACT_ADDRESSES.crossChainBridge;

  const { data: exports } = useReadContract({
    address: bridgeAddress,
    abi: CrossChainBridgeABI,
    functionName: "getUserExports",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { writeContract: exportScore, data: exportHash } = useWriteContract();
  const { writeContract: importScore, data: importHash } = useWriteContract();

  const { isLoading: isExporting } = useWaitForTransactionReceipt({
    hash: exportHash,
  });

  const { isLoading: isImporting } = useWaitForTransactionReceipt({
    hash: importHash,
  });

  const handleExport = () => {
    if (!fromChainId) return;
    exportScore({
      address: bridgeAddress,
      abi: CrossChainBridgeABI,
      functionName: "exportScore",
      args: [BigInt(fromChainId)],
    });
  };

  const handleImport = (exportData: any) => {
    if (!toChainId) return;
    importScore({
      address: bridgeAddress,
      abi: CrossChainBridgeABI,
      functionName: "importScore",
      args: [BigInt(toChainId), exportData],
    });
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500">Please connect your wallet to bridge scores</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Cross-Chain Bridge</h1>
        <p className="text-slate-400">Port your credit score between appchains</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {(["export", "import"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab
                ? "text-amber-400 border-b-2 border-amber-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Export Tab */}
      {activeTab === "export" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="gradient">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-100">Export Score</h2>
                <p className="text-sm text-slate-400">Export your score from an appchain</p>
              </div>
            </div>

            <div className="space-y-4">
              <Input
                label="From Appchain ID"
                type="number"
                placeholder="0"
                value={fromChainId}
                onChange={(e) => setFromChainId(e.target.value)}
              />
              <Button
                onClick={handleExport}
                disabled={!fromChainId || isExporting}
                className="w-full"
              >
                {isExporting ? "Exporting..." : "Export Score"}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-slate-300 mb-4">Your Exports</h3>
            {exports && exports.length > 0 ? (
              <div className="space-y-3">
                {exports.map((exportData, i) => (
                  <div
                    key={i}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="info">Chain {exportData.fromChainId.toString()}</Badge>
                      <span className="text-xs text-slate-500">
                        {new Date(Number(exportData.timestamp) * 1000).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-slate-300">
                      Score ≥ {exportData.scoreThreshold.toString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No exports yet</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Import Tab */}
      {activeTab === "import" && (
        <Card variant="gradient">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <ArrowLeft className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Import Score</h2>
              <p className="text-sm text-slate-400">Import a score to another appchain</p>
            </div>
          </div>

          <div className="space-y-4 max-w-md">
            <Input
              label="To Appchain ID"
              type="number"
              placeholder="0"
              value={toChainId}
              onChange={(e) => setToChainId(e.target.value)}
            />
            {exports && exports.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Select Export to Import
                </label>
                {exports.map((exportData, i) => (
                  <div
                    key={i}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
                    onClick={() => handleImport(exportData)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <Badge variant="info">Chain {exportData.fromChainId.toString()}</Badge>
                        <span className="text-sm text-slate-300 ml-2">
                          Score ≥ {exportData.scoreThreshold.toString()}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImport(exportData);
                        }}
                        disabled={!toChainId || isImporting}
                      >
                        Import
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
