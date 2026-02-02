"use client";

import { useState, useEffect } from "react";
import { parseEther } from "ethers";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/useToast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatCTC, getTierInfo } from "@/lib/utils";
import { ADDRESSES } from "@/config/contracts";

interface LoanTier {
  scoreThreshold: bigint;
  maxAmount: bigint;
  interestBps: bigint;
  durationDays: bigint;
  collateralBps: bigint;
}

interface Loan {
  borrower: string;
  amount: bigint;
  interestRate: bigint;
  startTime: bigint;
  duration: bigint;
  repaid: bigint;
  collateral: bigint;
  status: number;
}

const LOAN_STATUS = ["Active", "Repaid", "Defaulted"];

export default function VaultPage() {
  const { address } = useWallet();
  const { vault, registry, mockCTC } = useContracts();
  const { toast, update } = useToast();

  const [score, setScore] = useState(0);
  const [tier, setTier] = useState<LoanTier | null>(null);
  const [liquidity, setLiquidity] = useState(0n);
  const [totalDeposited, setTotalDeposited] = useState(0n);
  const [totalBorrowed, setTotalBorrowed] = useState(0n);
  const [myDeposit, setMyDeposit] = useState(0n);
  const [loans, setLoans] = useState<{ id: number; loan: Loan }[]>([]);
  const [loanAmount, setLoanAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [loading, setLoading] = useState("");

  const loadData = async () => {
    if (!address) return;
    try {
      const [s, liq, dep, bor, myDep, loanIds] = await Promise.all([
        registry.getMyScore().catch(() => 0n),
        vault.getAvailableLiquidity().catch(() => 0n),
        vault.getTotalDeposited().catch(() => 0n),
        vault.getTotalBorrowed().catch(() => 0n),
        vault.getLenderDeposit(address).catch(() => 0n),
        vault.getBorrowerLoans(address).catch(() => []),
      ]);
      setScore(Number(s));
      setLiquidity(liq);
      setTotalDeposited(dep);
      setTotalBorrowed(bor);
      setMyDeposit(myDep);

      const t = await vault.getLoanTierForScore(Number(s)).catch(() => null);
      if (t) setTier(t);

      const loanData = await Promise.all(
        (loanIds as bigint[]).map(async (id) => ({
          id: Number(id),
          loan: (await vault.getLoan(id)) as Loan,
        }))
      );
      setLoans(loanData);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadData();
  }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  const tierInfo = getTierInfo(score);

  const requestLoan = async () => {
    if (!loanAmount) return;
    setLoading("loan");
    const tid = toast("Requesting loan...", "pending");
    try {
      const amount = parseEther(loanAmount);
      const collateralBps = tier ? Number(tier.collateralBps) : 15000;
      const collateral = (amount * BigInt(collateralBps)) / 10000n;
      const tx = await vault.requestLoanSimple(amount, { value: collateral });
      update(tid, "Confirming...", "pending");
      await tx.wait();
      update(tid, "Loan issued!", "success");
      setLoanAmount("");
      loadData();
    } catch (err: unknown) {
      update(tid, (err as { reason?: string })?.reason || "Failed", "error");
    }
    setLoading("");
  };

  const depositLiq = async () => {
    if (!depositAmount) return;
    setLoading("deposit");
    const tid = toast("Depositing liquidity...", "pending");
    try {
      const amount = parseEther(depositAmount);
      await mockCTC.approve(ADDRESSES.CreditVault, amount);
      const tx = await vault.depositLiquidity(amount);
      await tx.wait();
      update(tid, "Deposit successful!", "success");
      setDepositAmount("");
      loadData();
    } catch (err: unknown) {
      update(tid, (err as { reason?: string })?.reason || "Failed", "error");
    }
    setLoading("");
  };

  const repayLoan = async (loanId: number, amount: bigint) => {
    setLoading(`repay-${loanId}`);
    const tid = toast("Repaying loan...", "pending");
    try {
      await mockCTC.approve(ADDRESSES.CreditVault, amount);
      const tx = await vault.repayLoan(loanId, amount);
      await tx.wait();
      update(tid, "Loan repaid! +50 credit pts", "success");
      loadData();
    } catch (err: unknown) {
      update(tid, (err as { reason?: string })?.reason || "Failed", "error");
    }
    setLoading("");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Lending Vault</h2>
        <p className="text-sm text-[#555] font-mono">
          Undercollateralized lending powered by your GhostScore
        </p>
      </div>

      {/* Tier + Pool Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow={tierInfo.color}>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-2">Your Tier</div>
          <div className="text-2xl font-bold font-mono" style={{ color: tierInfo.color }}>
            {tierInfo.name}
          </div>
          <div className="text-xs text-[#555] font-mono">Score: {score}</div>
        </Card>
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-2">Available Liquidity</div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatCTC(liquidity)} <span className="text-xs text-[#555]">CTC</span>
          </div>
        </Card>
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-2">Total Deposited</div>
          <div className="text-lg font-bold font-mono text-white">{formatCTC(totalDeposited)} CTC</div>
        </Card>
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-2">Total Borrowed</div>
          <div className="text-lg font-bold font-mono text-white">{formatCTC(totalBorrowed)} CTC</div>
        </Card>
      </div>

      {/* Tier Details */}
      {tier && (
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">Loan Terms</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-sm">
            <div>
              <div className="text-[#555] text-xs mb-1">Max Loan</div>
              <div className="text-white">{formatCTC(tier.maxAmount)} CTC</div>
            </div>
            <div>
              <div className="text-[#555] text-xs mb-1">Interest Rate</div>
              <div className="text-white">{Number(tier.interestBps) / 100}%</div>
            </div>
            <div>
              <div className="text-[#555] text-xs mb-1">Duration</div>
              <div className="text-white">{Number(tier.durationDays)} days</div>
            </div>
            <div>
              <div className="text-[#555] text-xs mb-1">Collateral</div>
              <div className="text-[#00FF88]">{Number(tier.collateralBps) / 100}%</div>
            </div>
          </div>
        </Card>
      )}

      {/* Borrow + Deposit */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">Request Loan</div>
          <div className="space-y-3">
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="Amount in CTC"
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#333] placeholder:text-[#333]"
            />
            {loanAmount && tier && (
              <div className="text-xs font-mono text-[#555]">
                Collateral required:{" "}
                <span className="text-[#FFB800]">
                  {(parseFloat(loanAmount) * Number(tier.collateralBps) / 10000).toFixed(4)} CTC
                </span>
              </div>
            )}
            <Button onClick={requestLoan} loading={loading === "loan"} disabled={!loanAmount} className="w-full">
              Borrow
            </Button>
          </div>
        </Card>

        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">Deposit Liquidity</div>
          <div className="space-y-3">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount in CTC"
              className="w-full bg-[#111] border border-[#222] rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-[#333] placeholder:text-[#333]"
            />
            {Number(myDeposit) > 0 && (
              <div className="text-xs font-mono text-[#555]">
                Your deposit: <span className="text-white">{formatCTC(myDeposit)} CTC</span>
              </div>
            )}
            <Button variant="secondary" onClick={depositLiq} loading={loading === "deposit"} disabled={!depositAmount} className="w-full">
              Deposit
            </Button>
          </div>
        </Card>
      </div>

      {/* Active Loans */}
      {loans.length > 0 && (
        <Card>
          <div className="text-[10px] text-[#555] tracking-wider uppercase mb-4">Your Loans</div>
          <div className="space-y-3">
            {loans.map(({ id, loan }) => {
              const totalDue = loan.amount + (loan.amount * loan.interestRate) / 10000n;
              const remaining = totalDue - loan.repaid;
              const progress = Number(loan.repaid) / Number(totalDue);
              return (
                <div key={id} className="flex items-center gap-4 p-4 bg-[#111] rounded-lg border border-[#1a1a1a]">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-white text-sm">Loan #{id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                          loan.status === 0 ? "bg-[#00FF88]/10 text-[#00FF88]" :
                          loan.status === 1 ? "bg-[#888]/10 text-[#888]" :
                          "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {LOAN_STATUS[loan.status]}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#555]">
                      {formatCTC(loan.amount)} CTC @ {Number(loan.interestRate) / 100}%
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00FF88] rounded-full transition-all"
                        style={{ width: `${Math.min(progress * 100, 100)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-[#444] font-mono mt-1">
                      {formatCTC(loan.repaid)} / {formatCTC(totalDue)} CTC repaid
                    </div>
                  </div>
                  {loan.status === 0 && (
                    <Button
                      size="sm"
                      onClick={() => repayLoan(id, remaining)}
                      loading={loading === `repay-${id}`}
                    >
                      Repay
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </motion.div>
  );
}
