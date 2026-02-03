"use client";

import { useState, useEffect, useCallback } from "react";
import { Contract, JsonRpcProvider } from "ethers";
import { RPC_URL, ADDRESSES } from "@/config/contracts";

const provider = new JsonRpcProvider(RPC_URL);

const FACTORY_ABI = [
  "function getAppChain(uint256 chainId) view returns (tuple(uint256 id, address admin, string name, address registry, address interceptor, address vault, address verifier, address nft, bool allowCrossChainScores, uint256 minScoreForLoan, uint256 createdAt, bool active))",
  "function getAppChainCount() view returns (uint256)",
];

export interface AppChainInfo {
  id: number;
  name: string;
  admin: string;
  registry: string;
  interceptor: string;
  vault: string;
  verifier: string;
  nft: string;
  active: boolean;
}

const STORAGE_KEY = "ghostline_appchain_id";

export function useAppChain() {
  const [appChains, setAppChains] = useState<AppChainInfo[]>([]);
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Load appchains from factory
  useEffect(() => {
    async function loadAppChains() {
      setLoading(true);
      try {
        const factory = new Contract(ADDRESSES.CreditChainFactory, FACTORY_ABI, provider);
        const count = await factory.getAppChainCount();
        const chains: AppChainInfo[] = [];

        for (let i = 0; i < Number(count); i++) {
          try {
            const chain = await factory.getAppChain(i);
            chains.push({
              id: Number(chain.id),
              name: chain.name,
              admin: chain.admin,
              registry: chain.registry,
              interceptor: chain.interceptor,
              vault: chain.vault,
              verifier: chain.verifier,
              nft: chain.nft,
              active: chain.active,
            });
          } catch (e) {
            console.error(`Failed to load appchain ${i}:`, e);
          }
        }

        setAppChains(chains);

        // Load saved chain ID or use first active chain
        const savedId = localStorage.getItem(STORAGE_KEY);
        if (savedId && chains.find((c) => c.id === parseInt(savedId))) {
          setSelectedChainId(parseInt(savedId));
        } else if (chains.length > 0) {
          const activeChain = chains.find((c) => c.active) || chains[0];
          setSelectedChainId(activeChain.id);
        }
      } catch (e) {
        console.error("Failed to load appchains:", e);
      }
      setLoading(false);
    }

    loadAppChains();
  }, []);

  // Save selected chain to localStorage
  const selectChain = useCallback((chainId: number) => {
    const chain = appChains.find((c) => c.id === chainId);
    if (!chain) return;

    setSelectedChainId(chainId);
    localStorage.setItem(STORAGE_KEY, chainId.toString());

    // Save the addresses for this chain
    localStorage.setItem("ghostline_appchain_addresses", JSON.stringify({
      registry: chain.registry,
      interceptor: chain.interceptor,
      vault: chain.vault,
      verifier: chain.verifier,
      nft: chain.nft,
    }));

    // Reload the page to apply new contract addresses
    window.location.reload();
  }, [appChains]);

  const selectedChain = appChains.find((c) => c.id === selectedChainId) || null;

  return {
    appChains,
    selectedChain,
    selectedChainId,
    selectChain,
    loading,
  };
}

// Get current appchain addresses (for use in contracts config)
export function getAppChainAddresses(): {
  registry: string;
  interceptor: string;
  vault: string;
  verifier: string;
  nft: string;
} | null {
  if (typeof window === "undefined") return null;

  const savedData = localStorage.getItem("ghostline_appchain_addresses");
  if (savedData) {
    try {
      return JSON.parse(savedData);
    } catch {
      return null;
    }
  }
  return null;
}
