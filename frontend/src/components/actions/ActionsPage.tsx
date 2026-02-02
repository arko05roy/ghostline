"use client";

import { useState } from "react";
import { parseEther } from "ethers";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/useToast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ADDRESSES } from "@/config/contracts";

const ACTIONS = [
  {
    id: "swap",
    title: "Swap",
    desc: "Swap tokens through the interceptor",
    points: "+10 pts / action",
    color: "#00FF88",
  },
  {
    id: "lend",
    title: "Lend",
    desc: "Deposit tokens to lending pool",
    points: "+25 pts / action",
    color: "#00BFFF",
  },
  {
    id: "stake",
    title: "Stake",
    desc: "Stake CTC to earn credit",
    points: "+20 pts / action",
    color: "#A855F7",
  },
  {
    id: "repay",
    title: "Repay Loan",
    desc: "Repay active loan - highest credit signal",
    points: "+50 pts / action",
    color: "#FFD700",
  },
  {
    id: "transfer",
    title: "Transfer",
    desc: "Transfer tokens to another address",
    points: "+5 pts / action",
    color: "#888",
  },
  {
    id: "liquidity",
    title: "Provide Liquidity",
    desc: "Add to liquidity pools",
    points: "+30 pts / action",
    color: "#FF6B6B",
  },
];

export default function ActionsPage() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">DeFi Actions</h2>
        <p className="text-sm text-[#555] font-mono">
          Every action builds your GhostScore. Higher-weight actions earn more credit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ACTIONS.map((action, i) => (
          <motion.div
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card
              hover
              glow={action.color}
              className={`cursor-pointer transition-all ${
                selected === action.id ? "border-opacity-60" : ""
              }`}
            >
              <button
                onClick={() => setSelected(selected === action.id ? null : action.id)}
                className="w-full text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ background: `${action.color}15`, color: action.color }}
                  >
                    {action.title[0]}
                  </div>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                    style={{ background: `${action.color}10`, color: action.color }}
                  >
                    {action.points}
                  </span>
                </div>
                <h3 className="text-white font-medium mb-1">{action.title}</h3>
                <p className="text-[#555] text-xs font-mono">{action.desc}</p>
              </button>

              {selected === action.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-4 pt-4 border-t border-[#1a1a1a]"
                >
                  <ActionForm actionId={action.id} color={action.color} />
                </motion.div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ActionForm({ actionId, color }: { actionId: string; color: string }) {
  const { address } = useWallet();
  const { interceptor, mockCTC } = useContracts();
  const { toast, update } = useToast();
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [loanId, setLoanId] = useState("");
  const [loading, setLoading] = useState(false);

  const execute = async () => {
    if (!address || !amount) return;
    setLoading(true);
    const tid = toast("Submitting transaction...", "pending");

    try {
      const amountWei = parseEther(amount);
      let tx;

      switch (actionId) {
        case "swap":
          tx = await interceptor.interceptSwap(
            ADDRESSES.MockCTC,
            ADDRESSES.MockCTC,
            amountWei,
            0,
            { value: amountWei }
          );
          break;
        case "lend":
          await mockCTC.approve(ADDRESSES.CreditInterceptor, amountWei);
          tx = await interceptor.interceptLend(ADDRESSES.MockCTC, amountWei);
          break;
        case "stake":
          tx = await interceptor.interceptStake(amountWei, { value: amountWei });
          break;
        case "repay":
          await mockCTC.approve(ADDRESSES.CreditInterceptor, amountWei);
          tx = await interceptor.interceptRepay(parseInt(loanId) || 0, amountWei);
          break;
        case "transfer":
          await mockCTC.approve(ADDRESSES.CreditInterceptor, amountWei);
          tx = await interceptor.interceptTransfer(
            recipient || address,
            ADDRESSES.MockCTC,
            amountWei
          );
          break;
        case "liquidity":
          await mockCTC.approve(ADDRESSES.CreditInterceptor, amountWei);
          tx = await interceptor.interceptProvideLiquidity(
            ADDRESSES.MockCTC,
            ADDRESSES.MockCTC,
            amountWei,
            amountWei
          );
          break;
      }

      if (tx) {
        update(tid, "Confirming...", "pending");
        await tx.wait();
        update(tid, "Action completed! Score updated.", "success");
      }
    } catch (err: unknown) {
      const msg = (err as { reason?: string })?.reason || "Transaction failed";
      update(tid, msg, "error");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1.5">
          Amount (CTC)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
          className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#333] placeholder:text-[#333]"
        />
      </div>

      {actionId === "transfer" && (
        <div>
          <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1.5">
            Recipient
          </label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
            className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#333] placeholder:text-[#333]"
          />
        </div>
      )}

      {actionId === "repay" && (
        <div>
          <label className="text-[10px] text-[#555] uppercase tracking-wider block mb-1.5">
            Loan ID
          </label>
          <input
            value={loanId}
            onChange={(e) => setLoanId(e.target.value)}
            placeholder="0"
            className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#333] placeholder:text-[#333]"
          />
        </div>
      )}

      <Button
        onClick={execute}
        loading={loading}
        disabled={!amount}
        className="w-full"
        style={{ borderColor: `${color}30`, color, background: `${color}10` } as React.CSSProperties}
      >
        Execute {actionId.charAt(0).toUpperCase() + actionId.slice(1)}
      </Button>
    </div>
  );
}
