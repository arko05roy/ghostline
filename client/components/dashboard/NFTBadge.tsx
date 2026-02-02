"use client";

import { useAccount, useReadContract } from "wagmi";
import { CreditNFTABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Award } from "lucide-react";

interface NFTBadgeProps {
  chainId: string;
}

export function NFTBadge({ chainId }: NFTBadgeProps) {
  const { address, isConnected } = useAccount();
  const nftAddress = CONTRACT_ADDRESSES.demoAppChain.nft;

  const { data: balance } = useReadContract({
    address: nftAddress,
    abi: CreditNFTABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: highestBadge } = useReadContract({
    address: nftAddress,
    abi: CreditNFTABI,
    functionName: "getHighestBadge",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  if (!isConnected || !address) {
    return null;
  }

  if (!balance || Number(balance) === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">No badges yet</p>
          <p className="text-slate-500 text-xs mt-1">Earn badges by reaching tier milestones</p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="gradient">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Award className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Credit Badge</h3>
          <p className="text-sm text-slate-400">Soulbound Achievement NFT</p>
        </div>
      </div>
      {highestBadge && (
        <div className="space-y-2">
          <Badge variant="warning" className="text-base px-4 py-1.5">
            {highestBadge[0]} Tier
          </Badge>
          <p className="text-sm text-slate-400">
            Score at mint: {Number(highestBadge[1])}
          </p>
        </div>
      )}
    </Card>
  );
}
