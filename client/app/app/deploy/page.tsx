"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CreditChainFactoryABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { Network, CheckCircle } from "lucide-react";

export default function DeployPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [appchainName, setAppchainName] = useState("");

  const { writeContract: deploy, data: deployHash } = useWriteContract();
  const { isLoading: isDeploying, isSuccess } = useWaitForTransactionReceipt({
    hash: deployHash,
  });

  const handleDeploy = () => {
    if (!appchainName.trim()) return;
    deploy({
      address: CONTRACT_ADDRESSES.creditChainFactory,
      abi: CreditChainFactoryABI,
      functionName: "deployAppChainSimple",
      args: [appchainName.trim()],
    });
  };

  if (!isConnected) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500">Please connect your wallet to deploy an appchain</p>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card variant="gradient" className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-slate-100 mb-2">Appchain Deployed!</h2>
          <p className="text-slate-400 mb-6">
            Your appchain has been successfully deployed. You can now interact with it.
          </p>
          <Button onClick={() => router.push("/app")}>View Appchains</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Deploy Appchain</h1>
        <p className="text-slate-400">
          Create your own isolated credit environment with a single transaction
        </p>
      </div>

      <Card variant="gradient">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Network className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-100">New Appchain</h2>
            <p className="text-sm text-slate-400">Deploy with default configuration</p>
          </div>
        </div>

        <div className="space-y-6">
          <Input
            label="Appchain Name"
            placeholder="e.g., Acme Bank"
            value={appchainName}
            onChange={(e) => setAppchainName(e.target.value)}
          />

          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">What you'll get:</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>• Credit Registry (isolated credit scoring)</li>
              <li>• Credit Interceptor (DeFi action tracking)</li>
              <li>• Credit Vault (lending & borrowing)</li>
              <li>• GhostScore Verifier (ZK proof verification)</li>
              <li>• Credit NFT (achievement badges)</li>
            </ul>
          </div>

          <Button
            onClick={handleDeploy}
            disabled={!appchainName.trim() || isDeploying}
            className="w-full"
          >
            {isDeploying ? "Deploying..." : "Deploy Appchain"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
