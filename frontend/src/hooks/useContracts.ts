"use client";

import { useMemo } from "react";
import { Contract, BrowserProvider, JsonRpcProvider } from "ethers";
import { useConnectorClient } from "wagmi";
import { ADDRESSES } from "@/config/contracts";
import {
  CreditRegistryABI,
  CreditInterceptorABI,
  CreditVaultABI,
  CreditNFTABI,
  GhostScoreVerifierABI,
  CreditChainFactoryABI,
  CrossChainBridgeABI,
  MockERC20ABI,
} from "@/config/abis";
import { RPC_URL } from "@/config/contracts";

const readProvider = new JsonRpcProvider(RPC_URL);

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

  return useMemo(() => {
    const signerPromise = clientToSigner(client);

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
      registry: getContract(ADDRESSES.CreditRegistry, CreditRegistryABI as unknown as string[]),
      interceptor: getContract(ADDRESSES.CreditInterceptor, CreditInterceptorABI as unknown as string[]),
      vault: getContract(ADDRESSES.CreditVault, CreditVaultABI as unknown as string[]),
      nft: getContract(ADDRESSES.CreditNFT, CreditNFTABI as unknown as string[]),
      verifier: getContract(ADDRESSES.GhostScoreVerifier, GhostScoreVerifierABI as unknown as string[]),
      factory: getContract(ADDRESSES.CreditChainFactory, CreditChainFactoryABI as unknown as string[]),
      bridge: getContract(ADDRESSES.CrossChainBridge, CrossChainBridgeABI as unknown as string[]),
      mockCTC: getContract(ADDRESSES.MockCTC, MockERC20ABI as unknown as string[]),
    };
  }, [client]);
}
