"use client";

import { motion } from "framer-motion";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import LandingNavbar from "@/components/landing/LandingNavbar";

const makeDots = (rows: number, cols: number, offset = 0) =>
  Array.from({ length: rows }, (_, r) => {
    const pad = (r + offset) % 2 === 0 ? "" : " ";
    return `${pad}${". ".repeat(cols).trimEnd()}`;
  }).join("\n");

const dotField = makeDots(20, 40, 0);

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
    <div className="relative min-h-screen overflow-hidden bg-black font-sans text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        {/* X Shape Glow */}
        <div
          className="absolute inset-0 opacity-80 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at center, rgba(0,255,136,0.2) 0%, transparent 65%)",
          }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] h-[140vh] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,rgba(0,255,136,0.12)_45deg,transparent_90deg,transparent_180deg,rgba(0,255,136,0.12)_225deg,transparent_270deg)] opacity-60 blur-[50px]"
        />

        {/* Grid/Dot Field */}
        <div className="absolute inset-0 opacity-[0.15] bg-[radial-gradient(#00FF88_1.5px,transparent_1.5px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />

        {/* Animated Dots */}
        <motion.pre
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.02, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="pointer-events-none absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] leading-4 text-white/20"
        >
          {dotField}
        </motion.pre>
        <motion.pre
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.05, 0.15, 0.05], scale: [1, 1.02, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear", delay: 1 }}
          className="pointer-events-none absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 font-mono text-[10px] leading-4 text-white/20"
        >
          {dotField}
        </motion.pre>
      </div>

      <LandingNavbar onEnterApp={onEnter} />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-20 text-center">
        {/* Hero Content Container with Float */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center"
        >
          {/* What's New Pill */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#333] bg-black/40 py-1 pl-1 pr-4 backdrop-blur-md transition-colors hover:border-[#00FF88]/30"
          >
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
              What's New
            </span>
            <span className="text-xs font-medium text-gray-300">
              Introducing GhostLine V2: Enhanced Analytics
            </span>
            <svg
              className="h-3 w-3 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </motion.div>

          {/* Hero Headline */}
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.8 }}
            className="max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-7xl md:leading-[1.1]"
          >
            Your All-In-One <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60">
              On-Chain Credit Platform
            </span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-6 max-w-2xl text-lg text-[#888] sm:text-xl"
          >
            Manage Payments, Billing, Compliance, And Analytics Effortlessly.
            <br className="hidden sm:block" />
            Build reputation privately with zero-knowledge proofs.
          </motion.p>
        </motion.div>

        {/* CTA Buttons - Separate from float for stability interaction, or keep together? Keeping float separate for text typically looks better, but buttons floating with text is more cohesive. Let's animate buttons into the float container or keep them static? 
           Actually, let's keep buttons static or animate them separately so they are easier to click. Moving targets are annoying. 
           Wait, if I put them OUTSIDE the motion.div above, they won't float. 
           Decision: Keep buttons OUTSIDE the floating container so they are stable targets.
        */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:gap-6"
        >
          <button
            onClick={isConnected ? onEnter : openConnectModal}
            className="group flex h-12 items-center gap-2 rounded-lg bg-white px-8 text-sm font-semibold text-black transition-all hover:bg-gray-200"
          >
            {isConnected ? "Enter App" : "Try Now"}
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>

          <button className="flex h-12 items-center gap-2 rounded-lg border border-[#333] bg-[#111] px-8 text-sm font-semibold text-white transition-all hover:bg-[#1a1a1a] hover:border-[#444]">
            Demo
          </button>
        </motion.div>
      </main>

      {/* Footer Social Proof/Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="absolute bottom-10 left-0 right-0 z-10 flex flex-wrap justify-center gap-8 px-6 text-center md:gap-16"
      >
        <div className="flex items-center gap-3 opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
          <div className="h-8 w-8 rounded bg-[#00FF88]/20 p-1.5 text-[#00FF88]">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-mono text-xs font-bold text-white">
              {stats.events || "4,000+"}
            </div>
            <div className="text-[10px] uppercase text-gray-500">
              Credit Events
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
          <div className="h-8 w-8 rounded bg-[#00FF88]/20 p-1.5 text-[#00FF88]">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-mono text-xs font-bold text-white">
              {stats.chains || "15+"}
            </div>
            <div className="text-[10px] uppercase text-gray-500">AppChains</div>
          </div>
        </div>

        <div className="flex items-center gap-3 opacity-60 grayscale transition-all hover:opacity-100 hover:grayscale-0">
          <div className="h-8 w-8 rounded bg-[#00FF88]/20 p-1.5 text-[#00FF88]">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-left">
            <div className="font-mono text-xs font-bold text-white">
              {stats.loans || "$24M+"}
            </div>
            <div className="text-[10px] uppercase text-gray-500">
              Value Locked
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
