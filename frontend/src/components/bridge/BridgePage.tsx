"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/useToast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

export default function BridgePage() {
  const { address } = useWallet();
  const { bridge, factory } = useContracts();
  const { toast, update } = useToast();

  const [chainCount, setChainCount] = useState(0);
  const [fromChain, setFromChain] = useState("");
  const [toChain, setToChain] = useState("");
  const [loading, setLoading] = useState("");
  const [exported, setExported] = useState<{
    fromChainId: number;
    scoreThreshold: number;
    exportHash: string;
  } | null>(null);

  useEffect(() => {
    factory.getAppChainCount().then((c: bigint) => setChainCount(Number(c))).catch(() => {});
  }, [factory]);

  const exportScore = async () => {
    if (!fromChain) return;
    setLoading("export");
    const tid = toast("Exporting score...", "pending");
    try {
      const tx = await bridge.exportScore(parseInt(fromChain));
      const receipt = await tx.wait();
      // Parse export from events
      const log = receipt.logs[0];
      if (log) {
        setExported({
          fromChainId: parseInt(fromChain),
          scoreThreshold: 0,
          exportHash: log.topics?.[3] || "",
        });
      }
      update(tid, "Score exported!", "success");
    } catch (err: unknown) {
      update(tid, (err as { reason?: string })?.reason || "Export failed", "error");
    }
    setLoading("");
  };

  const importScore = async () => {
    if (!toChain || !exported) return;
    setLoading("import");
    const tid = toast("Importing score...", "pending");
    try {
      const exportData = {
        fromChainId: exported.fromChainId,
        user: address,
        scoreThreshold: exported.scoreThreshold,
        proof: "0x",
        timestamp: Math.floor(Date.now() / 1000),
        exportHash: exported.exportHash,
      };
      const tx = await bridge.importScore(parseInt(toChain), exportData);
      await tx.wait();
      update(tid, "Score imported at 70% weight!", "success");
      setExported(null);
    } catch (err: unknown) {
      update(tid, (err as { reason?: string })?.reason || "Import failed", "error");
    }
    setLoading("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Cross-Chain Bridge</h2>
        <p className="text-sm text-[#555] font-mono">
          Port your credit score between GhostLine appchains at 70% weight
        </p>
      </div>

      {/* Visual */}
      <Card className="p-8">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-2 border-[#333] flex items-center justify-center mb-2 mx-auto">
              <span className="font-mono text-sm text-[#888]">{fromChain || "?"}</span>
            </div>
            <div className="text-[10px] text-[#555] uppercase tracking-wider">Source</div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-12 h-[1px] bg-[#333]" />
            <div className="text-[#00FF88] font-mono text-xs">70%</div>
            <div className="w-12 h-[1px] bg-[#333]" />
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6H10M10 6L7 3M10 6L7 9" stroke="#00FF88" strokeWidth="1.5" />
            </svg>
          </div>

          <div className="text-center">
            <div className="w-20 h-20 rounded-full border-2 border-[#333] flex items-center justify-center mb-2 mx-auto">
              <span className="font-mono text-sm text-[#888]">{toChain || "?"}</span>
            </div>
            <div className="text-[10px] text-[#555] uppercase tracking-wider">Destination</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Export */}
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">Export Score</div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1.5">
                Source AppChain ID
              </label>
              <input
                type="number"
                value={fromChain}
                onChange={(e) => setFromChain(e.target.value)}
                placeholder={`0 - ${chainCount - 1}`}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#333] placeholder:text-[#333]"
              />
            </div>
            <Button onClick={exportScore} loading={loading === "export"} disabled={!fromChain} className="w-full">
              Export Score
            </Button>
            {exported && (
              <div className="text-xs font-mono text-[#00FF88] p-3 bg-[#00FF88]/5 rounded-lg border border-[#00FF88]/20">
                Score exported from chain {exported.fromChainId}. Ready to import.
              </div>
            )}
          </div>
        </Card>

        {/* Import */}
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">Import Score</div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1.5">
                Destination AppChain ID
              </label>
              <input
                type="number"
                value={toChain}
                onChange={(e) => setToChain(e.target.value)}
                placeholder={`0 - ${chainCount - 1}`}
                className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#333] placeholder:text-[#333]"
              />
            </div>
            <Button
              onClick={importScore}
              loading={loading === "import"}
              disabled={!toChain || !exported}
              className="w-full"
            >
              Import Score (70% weight)
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
