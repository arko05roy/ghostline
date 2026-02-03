"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/useToast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { shortenAddress } from "@/lib/utils";

interface AppChain {
  id: number;
  admin: string;
  name: string;
  registry: string;
  interceptor: string;
  vault: string;
  verifier: string;
  nft: string;
  active: boolean;
  createdAt: number;
}

export default function FactoryPage() {
  const { address } = useWallet();
  const { factory } = useContracts();
  const { toast, update } = useToast();

  const [chainName, setChainName] = useState("");
  const [loading, setLoading] = useState(false);
  const [chains, setChains] = useState<AppChain[]>([]);
  const [totalChains, setTotalChains] = useState(0);

  const loadChains = async () => {
    try {
      const count = await factory.getAppChainCount();
      const totalCount = Number(count);
      setTotalChains(totalCount);

      // Load ALL appchains, not just user's
      const allChains: AppChain[] = [];
      for (let i = 0; i < totalCount; i++) {
        try {
          const c = await factory.getAppChain(i);
          allChains.push({
            id: Number(c.id),
            admin: c.admin,
            name: c.name,
            registry: c.registry,
            interceptor: c.interceptor,
            vault: c.vault,
            verifier: c.verifier,
            nft: c.nft,
            active: c.active,
            createdAt: Number(c.createdAt),
          });
        } catch (err) {
          console.error(`Failed to load appchain ${i}:`, err);
        }
      }
      setChains(allChains);
    } catch (err) {
      console.error("Failed to load appchains:", err);
    }
  };

  useEffect(() => {
    loadChains();
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  const deploy = async () => {
    if (!chainName) return;
    setLoading(true);
    const tid = toast("Deploying AppChain...", "pending");
    try {
      const tx = await factory.deployAppChainSimple(chainName);
      update(tid, "Confirming deployment...", "pending");
      await tx.wait();
      update(tid, `AppChain "${chainName}" deployed!`, "success");
      setChainName("");
      loadChains();
    } catch (err: unknown) {
      update(tid, (err as { reason?: string })?.reason || "Deploy failed", "error");
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">AppChain Factory</h2>
        <p className="text-sm text-[#555] font-mono">
          Deploy your own credit system in one click. {totalChains} chains deployed.
        </p>
      </div>

      {/* Deploy */}
      <Card glow="#00FF88">
        <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">
          Deploy New AppChain
        </div>
        <p className="text-xs text-[#666] mb-4 font-mono">
          Deploys CreditRegistry, Interceptor, Vault, Verifier, and NFT contracts in a single transaction.
        </p>
        <div className="flex gap-3">
          <input
            value={chainName}
            onChange={(e) => setChainName(e.target.value)}
            placeholder="AppChain Name"
            className="flex-1 bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#333] placeholder:text-[#333]"
          />
          <Button onClick={deploy} loading={loading} disabled={!chainName}>
            Deploy
          </Button>
        </div>
      </Card>

      {/* All Chains */}
      {chains.length > 0 && (
        <div className="space-y-4">
          <div className="text-[10px] text-[#555] tracking-wider uppercase">
            All AppChains ({chains.length})
          </div>
          {chains.map((chain, i) => {
            const isOwner = address && chain.admin.toLowerCase() === address.toLowerCase();
            return (
            <motion.div
              key={chain.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card glow={isOwner ? "#00FF88" : undefined}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-white font-medium">{chain.name}</div>
                      {isOwner && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00FF88]/20 text-[#00FF88] font-mono">
                          YOURS
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#555] font-mono">
                      ID: {chain.id} • Admin: {shortenAddress(chain.admin)}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      chain.active
                        ? "bg-[#00FF88]/10 text-[#00FF88]"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {chain.active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                  {[
                    { label: "Registry", addr: chain.registry },
                    { label: "Interceptor", addr: chain.interceptor },
                    { label: "Vault", addr: chain.vault },
                    { label: "Verifier", addr: chain.verifier },
                    { label: "NFT", addr: chain.nft },
                  ].map((c) => (
                    <div key={c.label}>
                      <div className="text-[#555] text-[10px] uppercase tracking-wider mb-0.5">
                        {c.label}
                      </div>
                      <div className="text-[#888]">{shortenAddress(c.addr)}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
