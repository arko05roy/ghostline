"use client";

import { motion } from "framer-motion";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import GhostScoreGauge from "@/components/ui/GhostScoreGauge";

const makeDots = (rows: number, cols: number, offset = 0) =>
  Array.from({ length: rows }, (_, r) => {
    const pad = (r + offset) % 2 === 0 ? "" : " ";
    return `${pad}${". ".repeat(cols).trimEnd()}`;
  }).join("\n");

const dotField = makeDots(14, 18, 0);
const dotFieldAlt = makeDots(10, 14, 1);
const dotFieldMicro = makeDots(6, 10, 0);

const signalArt = [
  "signal: [#####-----] 52%",
  "proof:  [#######---] 71%",
  "vault:  [########--] 83%",
  "score:  [#########-] 92%",
].join("\n");

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
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,136,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.16) 1px, transparent 1px)",
            backgroundSize: "88px 88px",
          }}
        />
        <div className="absolute -top-36 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#00FF88]/12 blur-[140px]" />
        <div className="absolute -right-16 -top-24 h-[760px] w-[760px] opacity-70">
          <img
            src="/diffusion-ghostline.svg"
            alt="Diffusion art"
            className="h-full w-full object-cover opacity-70 diffusion-drift mix-blend-screen"
          />
        </div>

        <motion.pre
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.12, 0.28, 0.16], x: [0, 22, 0], y: [0, -14, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute left-8 top-28 font-mono text-[10px] leading-4 text-white/40"
        >
          {dotField}
        </motion.pre>
        <motion.pre
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.08, 0.2, 0.12], x: [0, -18, 0], y: [0, 20, 0] }}
          transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute bottom-16 right-10 font-mono text-[9px] leading-4 text-white/35"
        >
          {dotFieldAlt}
        </motion.pre>
      </div>

      <main className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-16 pt-28 md:grid-cols-[1.05fr_0.95fr]">
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-[#00FF88]/20 bg-[#00FF88]/10 px-4 py-1.5"
          >
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#00FF88]/70">
              Creditcoin Testnet
            </span>
            <span className="font-mono text-[11px] text-[#00FF88]/40">Chain 102031</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-5xl font-semibold tracking-tight text-white md:text-7xl"
          >
            ghost<span className="text-[#00FF88]">line</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mt-5 max-w-xl text-lg text-[#9aa0a6]"
          >
            Your invisible credit becomes a visible signal. Build reputation through
            DeFi actions, borrow with lower collateral, and keep your score private
            with zero-knowledge proofs.
          </motion.p>

          <motion.pre
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-6 w-fit rounded-2xl border border-[#1a1a1a] bg-black/60 px-5 py-4 font-mono text-[11px] leading-5 text-[#00FF88]/80 shadow-[0_0_40px_rgba(0,255,136,0.08)]"
          >
            {signalArt}
          </motion.pre>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-8 flex flex-wrap gap-4"
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-10 grid grid-cols-3 gap-6"
          >
            {[
              { label: "Credit Events", value: stats.events },
              { label: "AppChains", value: stats.chains },
              { label: "Loans Issued", value: stats.loans },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]/80 px-4 py-3">
                <div className="font-mono text-xl text-white">{s.value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-[#555]">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="scanlines relative overflow-hidden rounded-3xl border border-[#202020] bg-black/70 p-6 shadow-[0_0_70px_rgba(0,255,136,0.18)]"
        >
          <div className="absolute inset-0">
            <img
              src="/diffusion-ghostline.svg"
              alt="Diffusion art"
              className="h-full w-full object-cover opacity-90 diffusion-drift"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/30 to-black/70" />
          </div>

          <div className="relative z-10">
            <motion.pre
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.35, 0.7, 0.4], x: [0, 10, 0], y: [0, -8, 0] }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="ascii-flicker font-mono text-[10px] leading-4 text-white/60"
            >
              {dotFieldMicro}
            </motion.pre>
            <div className="mt-4 font-mono text-xs uppercase tracking-[0.4em] text-[#c7f7dd]/70">
              signal mesh
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-6">
              <div className="rounded-2xl border border-[#00FF88]/20 bg-black/60 p-4">
                <GhostScoreGauge score={742} size={160} />
              </div>
              <div className="space-y-4">
                {[
                  { label: "ZK Proof", value: "Active" },
                  { label: "Collateral", value: "30%" },
                  { label: "Reputation", value: "Rising" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-[#1a1a1a] bg-black/60 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.3em] text-[#3c3c3c]">
                      {item.label}
                    </div>
                    <div className="mt-1 font-mono text-lg text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Diffuse Credit Trails",
              body: "Aggregate your DeFi actions into a private, portable reputation signal.",
            },
            {
              title: "Undercollateralized Loans",
              body: "Borrow more efficiently with dynamic risk scores that lenders can trust.",
            },
            {
              title: "ZK Shielded Identity",
              body: "Zero-knowledge proofs keep your score private while still verifiable.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="rounded-2xl border border-[#1a1a1a] bg-[#0a0a0a]/90 p-6"
            >
              <div className="font-mono text-xs text-[#00FF88]/60">0{index + 1}</div>
              <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm text-[#7b8087]">{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
