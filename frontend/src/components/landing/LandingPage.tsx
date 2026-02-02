"use client";

import { motion } from "framer-motion";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import GhostScoreGauge from "@/components/ui/GhostScoreGauge";

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const { isConnected } = useWallet();
  const { openConnectModal } = useConnectModal();
  const { registry, factory, vault } = useContracts();
  const [stats, setStats] = useState({ events: 0, chains: 0, loans: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [events, chains, loans] = await Promise.all([
          registry.getTotalCreditEvents().catch(() => 0n),
          factory.getAppChainCount().catch(() => 0n),
          vault.totalLoans().catch(() => 0n),
        ]);
        setStats({
          events: Number(events),
          chains: Number(chains),
          loans: Number(loans),
        });
      } catch {
        /* ignore */
      }
    }
    load();
  }, [registry, factory, vault]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,255,136,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,255,136,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00FF88]/[0.02] blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center text-center max-w-3xl"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 px-4 py-1.5 rounded-full border border-[#00FF88]/20 bg-[#00FF88]/5"
        >
          <span className="font-mono text-xs text-[#00FF88]/70 tracking-wider">
            CREDITCOIN TESTNET &#183; CHAIN 102031
          </span>
        </motion.div>

        {/* Score animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-10"
        >
          <GhostScoreGauge score={742} size={200} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-5xl md:text-7xl font-bold tracking-tight mb-4"
        >
          <span className="text-white">ghost</span>
          <span className="text-[#00FF88]">line</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-[#666] text-lg md:text-xl mb-3 font-light"
        >
          Your invisible credit, made visible on-chain
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-[#444] text-sm max-w-lg mb-10 font-mono"
        >
          Build your on-chain credit score through DeFi actions. Borrow with as
          low as 30% collateral. Zero-knowledge proofs keep your score private.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="flex gap-4"
        >
          {isConnected ? (
            <Button size="lg" onClick={onEnter}>
              Enter App
            </Button>
          ) : (
            <Button size="lg" onClick={() => openConnectModal?.()}>
              Connect Wallet
            </Button>
          )}
          <Button variant="secondary" size="lg">
            Docs
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-16 grid grid-cols-3 gap-12 md:gap-20"
        >
          {[
            { label: "Credit Events", value: stats.events },
            { label: "AppChains", value: stats.chains },
            { label: "Loans Issued", value: stats.loans },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-mono text-2xl text-white">{s.value}</div>
              <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
