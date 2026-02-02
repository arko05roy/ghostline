"use client";

import { useAccount, useChainId } from "wagmi";
import { creditcoinTestnet } from "@/config/wagmi";

export function useWallet() {
  const { address, isConnecting, isConnected } = useAccount();
  const chainId = useChainId();
  const isCorrectChain = chainId === creditcoinTestnet.id;

  return {
    address: address ?? null,
    isConnecting,
    isConnected,
    chainId,
    isCorrectChain,
  };
}
