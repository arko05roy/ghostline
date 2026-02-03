"use client";

import { useMemo, useState, useEffect } from "react";
import { Contract, BrowserProvider, JsonRpcProvider } from "ethers";
import { useConnectorClient } from "wagmi";
import { ADDRESSES, RPC_URL } from "@/config/contracts";
import {
  CreditRegistryABI,
  CreditInterceptorABI,
  CreditVaultABI,
  CreditNFTABI,
  GhostScoreVerifierABI,
  CreditChainFactoryABI,
  CrossChainBridgeABI,
  MockERC20ABI,
  UniversalCreditRegistryABI,
  CreditOracleABI,
} from "@/config/abis";

const readProvider = new JsonRpcProvider(RPC_URL);

// Get saved appchain addresses from localStorage
function getSelectedAppChainAddresses() {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("ghostline_appchain_addresses");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

function clientToSigner(client: ReturnType<typeof useConnectorClient>["data"]) {
  if (!client) return null;
  const { account, chain, transport } = client;
  if (!account || !chain || !transport) return null;
  const provider = new BrowserProvider(transport, {
    chainId: chain.id,
    name: chain.name,
  });
  return provider.getSigner(account.address);
}

export function useContracts() {
  const { data: client } = useConnectorClient();
  const [appChainAddresses, setAppChainAddresses] = useState<{
    registry: string;
    interceptor: string;
    vault: string;
    verifier: string;
    nft: string;
  } | null>(null);

  // Load saved appchain addresses
  useEffect(() => {
    const saved = getSelectedAppChainAddresses();
    setAppChainAddresses(saved);

    // Listen for storage changes
    const handleStorage = () => {
      setAppChainAddresses(getSelectedAppChainAddresses());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return useMemo(() => {
    const signerPromise = clientToSigner(client);

    // Use selected appchain addresses or fall back to defaults
    const addresses = {
      registry: appChainAddresses?.registry || ADDRESSES.CreditRegistry,
      interceptor: appChainAddresses?.interceptor || ADDRESSES.CreditInterceptor,
      vault: appChainAddresses?.vault || ADDRESSES.CreditVault,
      verifier: appChainAddresses?.verifier || ADDRESSES.GhostScoreVerifier,
      nft: appChainAddresses?.nft || ADDRESSES.CreditNFT,
    };

    // For read calls we use the static provider, for write calls we resolve the signer
    function getContract(address: string, abi: readonly string[]) {
      const readContract = new Contract(address, abi, readProvider);

      if (!signerPromise) return readContract;

      // Return a proxy that uses signer for write calls
      return new Proxy(readContract, {
        get(target, prop, receiver) {
          const value = Reflect.get(target, prop, receiver);
          if (typeof value === "function") {
            return async (...args: unknown[]) => {
              try {
                // Try read-only first
                return await value.call(target, ...args);
              } catch {
                // If it fails, try with signer (write tx)
                const signer = await signerPromise;
                const writeContract = new Contract(address, abi, signer);
                const writeFn = writeContract[prop as string];
                if (typeof writeFn === "function") {
                  return writeFn(...args);
                }
                throw new Error(`Function ${String(prop)} not found`);
              }
            };
          }
          return value;
        },
      });
    }

    return {
      registry: getContract(addresses.registry, CreditRegistryABI as unknown as string[]),
      interceptor: getContract(addresses.interceptor, CreditInterceptorABI as unknown as string[]),
      vault: getContract(addresses.vault, CreditVaultABI as unknown as string[]),
      nft: getContract(addresses.nft, CreditNFTABI as unknown as string[]),
      verifier: getContract(addresses.verifier, GhostScoreVerifierABI as unknown as string[]),
      factory: getContract(ADDRESSES.CreditChainFactory, CreditChainFactoryABI as unknown as string[]),
      bridge: getContract(ADDRESSES.CrossChainBridge, CrossChainBridgeABI as unknown as string[]),
      mockCTC: getContract(ADDRESSES.MockCTC, MockERC20ABI as unknown as string[]),
      universalRegistry: getContract(ADDRESSES.UniversalCreditRegistry, UniversalCreditRegistryABI as unknown as string[]),
      creditOracle: getContract(ADDRESSES.CreditOracle, CreditOracleABI as unknown as string[]),
    };
  }, [client, appChainAddresses]);
}
