"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CreditVaultABI, CreditRegistryABI, ERC20_ABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils";
import { Wallet, TrendingUp, Clock, DollarSign } from "lucide-react";
import { parseEther } from "viem";

export default function VaultPage({ params }: { params: { chainId: string } }) {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<"deposit" | "borrow" | "loans">("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");

  const vaultAddress = CONTRACT_ADDRESSES.demoAppChain.vault;
  const registryAddress = CONTRACT_ADDRESSES.demoAppChain.registry;
  const tokenAddress = CONTRACT_ADDRESSES.mockCTC;

  const { data: totalDeposited } = useReadContract({
    address: vaultAddress,
    abi: CreditVaultABI,
    functionName: "getTotalDeposited",
  });

  const { data: totalBorrowed } = useReadContract({
    address: vaultAddress,
    abi: CreditVaultABI,
    functionName: "getTotalBorrowed",
  });

  const { data: availableLiquidity } = useReadContract({
    address: vaultAddress,
    abi: CreditVaultABI,
    functionName: "getAvailableLiquidity",
  });

  const { data: score } = useReadContract({
    address: registryAddress,
    abi: CreditRegistryABI,
    functionName: "getMyScore",
    query: { enabled: isConnected && !!address },
  });

  const { data: loanTier } = useReadContract({
    address: vaultAddress,
    abi: CreditVaultABI,
    functionName: "getLoanTierForScore",
    args: score ? [score] : undefined,
    query: { enabled: isConnected && !!address && score !== undefined },
  });

  const { data: myDeposit } = useReadContract({
    address: vaultAddress,
    abi: CreditVaultABI,
    functionName: "getLenderDeposit",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: myLoans } = useReadContract({
    address: vaultAddress,
    abi: CreditVaultABI,
    functionName: "getBorrowerLoans",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { writeContract: deposit, data: depositHash } = useWriteContract();
  const { writeContract: borrow, data: borrowHash } = useWriteContract();

  const { isLoading: isDepositing } = useWaitForTransactionReceipt({
    hash: depositHash,
  });

  const { isLoading: isBorrowing } = useWaitForTransactionReceipt({
    hash: borrowHash,
  });

  const handleDeposit = () => {
    if (!depositAmount) return;
    deposit({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [vaultAddress, parseEther(depositAmount)],
    });
    // Then deposit
    deposit({
      address: vaultAddress,
      abi: CreditVaultABI,
      functionName: "depositLiquidity",
      args: [parseEther(depositAmount)],
    });
  };

  const handleBorrow = () => {
    if (!borrowAmount) return;
    borrow({
      address: vaultAddress,
      abi: CreditVaultABI,
      functionName: "requestLoanSimple",
      args: [parseEther(borrowAmount)],
      value: loanTier
        ? (parseEther(borrowAmount) * BigInt(loanTier.collateralBps)) / 10000n
        : 0n,
    });
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500">Please connect your wallet to access the vault</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Credit Vault</h1>
        <p className="text-slate-400">Deposit liquidity or borrow using your credit score</p>
      </div>

      {/* Vault Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Deposited</p>
              <p className="text-2xl font-bold text-slate-100">
                {totalDeposited ? formatNumber(totalDeposited) : "0"}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Borrowed</p>
              <p className="text-2xl font-bold text-slate-100">
                {totalBorrowed ? formatNumber(totalBorrowed) : "0"}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Available Liquidity</p>
              <p className="text-2xl font-bold text-slate-100">
                {availableLiquidity ? formatNumber(availableLiquidity) : "0"}
              </p>
            </div>
            <Wallet className="w-8 h-8 text-amber-400" />
          </div>
        </Card>
      </div>

      {/* Loan Tier Info */}
      {loanTier && (
        <Card variant="gradient">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">Your Loan Tier</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">Max Loan</p>
              <p className="text-lg font-semibold text-slate-100">
                {formatNumber(loanTier.maxAmount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Interest Rate</p>
              <p className="text-lg font-semibold text-slate-100">
                {(Number(loanTier.interestBps) / 100).toFixed(2)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Duration</p>
              <p className="text-lg font-semibold text-slate-100">
                {Number(loanTier.durationDays)} days
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">Collateral</p>
              <p className="text-lg font-semibold text-slate-100">
                {(Number(loanTier.collateralBps) / 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800">
        {(["deposit", "borrow", "loans"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === tab
                ? "text-amber-400 border-b-2 border-amber-400"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Deposit Tab */}
      {activeTab === "deposit" && (
        <Card>
          <h3 className="text-xl font-semibold text-slate-100 mb-6">Deposit Liquidity</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <p className="text-sm text-slate-400 mb-2">
                Balance: {balance ? formatNumber(balance) : "0"} CTC
              </p>
              <p className="text-sm text-slate-400">
                Your Deposit: {myDeposit ? formatNumber(myDeposit) : "0"} CTC
              </p>
            </div>
            <Input
              label="Amount"
              type="number"
              placeholder="0.0"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <Button
              onClick={handleDeposit}
              disabled={!depositAmount || isDepositing}
              className="w-full"
            >
              {isDepositing ? "Depositing..." : "Deposit"}
            </Button>
          </div>
        </Card>
      )}

      {/* Borrow Tab */}
      {activeTab === "borrow" && (
        <Card>
          <h3 className="text-xl font-semibold text-slate-100 mb-6">Request Loan</h3>
          <div className="space-y-4 max-w-md">
            {loanTier && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">
                  Max Loan Amount: {formatNumber(loanTier.maxAmount)} CTC
                </p>
                <p className="text-sm text-slate-400">
                  Required Collateral: {(Number(loanTier.collateralBps) / 100).toFixed(1)}%
                </p>
              </div>
            )}
            <Input
              label="Loan Amount"
              type="number"
              placeholder="0.0"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
            />
            {borrowAmount && loanTier && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-sm text-amber-400">
                  Required Collateral:{" "}
                  {formatNumber(
                    (parseEther(borrowAmount) * BigInt(loanTier.collateralBps)) / 10000n
                  )}{" "}
                  tCTC
                </p>
              </div>
            )}
            <Button
              onClick={handleBorrow}
              disabled={!borrowAmount || isBorrowing || !loanTier}
              className="w-full"
            >
              {isBorrowing ? "Processing..." : "Request Loan"}
            </Button>
          </div>
        </Card>
      )}

      {/* My Loans Tab */}
      {activeTab === "loans" && (
        <Card>
          <h3 className="text-xl font-semibold text-slate-100 mb-6">My Loans</h3>
          {myLoans && myLoans.length > 0 ? (
            <div className="space-y-4">
              {myLoans.map((loanId) => (
                <LoanCard key={loanId.toString()} loanId={loanId} vaultAddress={vaultAddress} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active loans</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function LoanCard({ loanId, vaultAddress }: { loanId: bigint; vaultAddress: `0x${string}` }) {
  const { data: loan } = useReadContract({
    address: vaultAddress,
    abi: CreditVaultABI,
    functionName: "getLoan",
    args: [loanId],
  });

  const [repayAmount, setRepayAmount] = useState("");
  const { writeContract: repay, data: repayHash } = useWriteContract();
  const { isLoading: isRepaying } = useWaitForTransactionReceipt({
    hash: repayHash,
  });

  if (!loan) return null;

  const totalOwed = loan.amount + (loan.amount * BigInt(loan.interestRate)) / 10000n;
  const remaining = totalOwed - loan.repaid;
  const progress = Number(loan.repaid) / Number(totalOwed);

  const handleRepay = () => {
    if (!repayAmount) return;
    repay({
      address: vaultAddress,
      abi: CreditVaultABI,
      functionName: "repayLoan",
      args: [loanId, parseEther(repayAmount)],
    });
  };

  return (
    <div className="p-6 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-lg font-semibold text-slate-100">Loan #{loanId.toString()}</h4>
          <Badge
            variant={
              loan.status === 0 ? "info" : loan.status === 1 ? "success" : "danger"
            }
            className="mt-2"
          >
            {loan.status === 0 ? "Active" : loan.status === 1 ? "Repaid" : "Defaulted"}
          </Badge>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Amount</p>
          <p className="text-lg font-semibold text-slate-100">
            {formatNumber(loan.amount)} CTC
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Interest Rate:</span>
          <span className="text-slate-300">{(Number(loan.interestRate) / 100).toFixed(2)}%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Repaid:</span>
          <span className="text-slate-300">
            {formatNumber(loan.repaid)} / {formatNumber(totalOwed)}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {loan.status === 0 && remaining > 0n && (
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="0.0"
            value={repayAmount}
            onChange={(e) => setRepayAmount(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleRepay} disabled={!repayAmount || isRepaying}>
            {isRepaying ? "Repaying..." : "Repay"}
          </Button>
        </div>
      )}
    </div>
  );
}
