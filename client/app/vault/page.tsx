"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CONTRACTS, CreditVaultABI, ERC20ABI } from "@/lib/contracts";
import { getTierFromScore } from "@/lib/utils";
import { TIERS } from "@/lib/types";
import { toast } from "sonner";
import {
    Landmark,
    TrendingUp,
    TrendingDown,
    Wallet,
    Coins,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Shield,
    DollarSign,
    Percent,
} from "lucide-react";

// Demo data - will come from contract
const DEMO_SCORE = 450;
const DEMO_VAULT_STATS = {
    totalDeposits: "500000",
    totalBorrowed: "125000",
    availableLiquidity: "375000",
    utilizationRate: 25,
};

const LOAN_TIERS = [
    { name: "Newcomer", minScore: 0, maxLoan: "1000", interest: 15, collateral: 150 },
    { name: "Builder", minScore: 100, maxLoan: "5000", interest: 10, collateral: 100 },
    { name: "Trusted", minScore: 300, maxLoan: "25000", interest: 7, collateral: 50 },
    { name: "Elite", minScore: 600, maxLoan: "100000", interest: 5, collateral: 0 },
];

export default function VaultPage() {
    const { isConnected, address } = useAccount();
    const [activeTab, setActiveTab] = useState<"deposit" | "borrow" | "loans">("borrow");
    const [amount, setAmount] = useState("");

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

    const tier = getTierFromScore(DEMO_SCORE);
    const userTier = LOAN_TIERS.find(
        (t) => DEMO_SCORE >= t.minScore && DEMO_SCORE < (LOAN_TIERS[LOAN_TIERS.indexOf(t) + 1]?.minScore ?? 1001)
    ) ?? LOAN_TIERS[0];

    const handleDeposit = async () => {
        if (!amount) {
            toast.error("Enter an amount");
            return;
        }

        try {
            writeContract({
                address: CONTRACTS.demoAppChain.vault,
                abi: CreditVaultABI,
                functionName: "deposit",
                args: [parseEther(amount)],
            });
            toast.success("Deposit submitted!");
        } catch (error) {
            console.error(error);
            toast.error("Deposit failed");
        }
    };

    const handleBorrow = async () => {
        if (!amount) {
            toast.error("Enter an amount");
            return;
        }

        const loanAmount = parseEther(amount);
        const collateralAmount = (loanAmount * BigInt(userTier.collateral)) / 100n;

        try {
            writeContract({
                address: CONTRACTS.demoAppChain.vault,
                abi: CreditVaultABI,
                functionName: "requestLoan",
                args: [loanAmount, collateralAmount],
            });
            toast.success("Loan request submitted!");
        } catch (error) {
            console.error(error);
            toast.error("Loan request failed");
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="p-4 rounded-full bg-green-500/10 mb-6">
                    <Wallet className="w-12 h-12 text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    Connect Your Wallet
                </h1>
                <p className="text-gray-400 max-w-md">
                    Connect to access the CreditVault and use your credit score for loans.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">CreditVault</h1>
                    <p className="text-gray-400 mt-1">
                        Undercollateralized lending powered by your credit score
                    </p>
                </div>
                <Badge variant="tier" tierColor={tier.color}>
                    {tier.name} Tier
                </Badge>
            </div>

            {/* Vault stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Deposits",
                        value: `$${Number(DEMO_VAULT_STATS.totalDeposits).toLocaleString()}`,
                        icon: Coins,
                        color: "#10B981",
                    },
                    {
                        label: "Total Borrowed",
                        value: `$${Number(DEMO_VAULT_STATS.totalBorrowed).toLocaleString()}`,
                        icon: TrendingUp,
                        color: "#8B5CF6",
                    },
                    {
                        label: "Available",
                        value: `$${Number(DEMO_VAULT_STATS.availableLiquidity).toLocaleString()}`,
                        icon: DollarSign,
                        color: "#00D4FF",
                    },
                    {
                        label: "Utilization",
                        value: `${DEMO_VAULT_STATS.utilizationRate}%`,
                        icon: Percent,
                        color: "#F59E0B",
                    },
                ].map((stat) => (
                    <Card key={stat.label} variant="glass">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-400">{stat.label}</p>
                                    <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
                                </div>
                                <div
                                    className="p-2 rounded-lg"
                                    style={{ backgroundColor: `${stat.color}20` }}
                                >
                                    <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Loan tiers */}
            <Card variant="glass">
                <CardHeader>
                    <CardTitle>Loan Tiers</CardTitle>
                    <CardDescription>
                        Better credit score = better loan terms
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                                        Tier
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                                        Min Score
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                                        Max Loan
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                                        Interest
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                                        Collateral
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {LOAN_TIERS.map((t) => {
                                    const isCurrentTier = t.name === userTier.name;
                                    const tierInfo = TIERS.find((ti) => ti.name === t.name);

                                    return (
                                        <tr
                                            key={t.name}
                                            className={`border-b border-gray-800/50 ${isCurrentTier ? "bg-cyan-500/10" : ""
                                                }`}
                                        >
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="font-medium"
                                                        style={{ color: tierInfo?.color }}
                                                    >
                                                        {t.name}
                                                    </span>
                                                    {isCurrentTier && (
                                                        <Badge variant="info" className="text-xs">
                                                            Your tier
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-white">{t.minScore}</td>
                                            <td className="py-3 px-4 text-white">
                                                ${Number(t.maxLoan).toLocaleString()}
                                            </td>
                                            <td className="py-3 px-4 text-white">{t.interest}%</td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={
                                                        t.collateral === 0 ? "text-green-400" : "text-white"
                                                    }
                                                >
                                                    {t.collateral === 0 ? "None!" : `${t.collateral}%`}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Action tabs */}
            <Card variant="glass">
                <CardHeader>
                    <div className="flex gap-2">
                        {["deposit", "borrow", "loans"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as typeof activeTab)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab
                                        ? "bg-cyan-500/20 text-cyan-400"
                                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent>
                    {activeTab === "deposit" && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">
                                    Amount to Deposit (CTC)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.0"
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <Button
                                variant="gradient"
                                className="w-full"
                                onClick={handleDeposit}
                                loading={isPending || isConfirming}
                            >
                                <ArrowUpRight className="w-4 h-4 mr-2" />
                                Deposit
                            </Button>
                        </div>
                    )}

                    {activeTab === "borrow" && (
                        <div className="space-y-4">
                            {/* Your tier info */}
                            <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-gray-400">Your Tier</span>
                                    <Badge variant="tier" tierColor={tier.color}>
                                        {userTier.name}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-xs text-gray-500">Max Loan</p>
                                        <p className="text-sm font-medium text-white">
                                            ${Number(userTier.maxLoan).toLocaleString()}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Interest</p>
                                        <p className="text-sm font-medium text-white">
                                            {userTier.interest}%
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Collateral</p>
                                        <p className="text-sm font-medium text-white">
                                            {userTier.collateral}%
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm text-gray-400 mb-2 block">
                                    Loan Amount (CTC)
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.0"
                                    max={userTier.maxLoan}
                                    className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                                />
                            </div>

                            {amount && (
                                <div className="p-4 rounded-lg bg-gray-800/30 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Required Collateral</span>
                                        <span className="text-white">
                                            {(Number(amount) * userTier.collateral) / 100} CTC
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Interest ({userTier.interest}%)</span>
                                        <span className="text-white">
                                            {(Number(amount) * userTier.interest) / 100} CTC
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium pt-2 border-t border-gray-700">
                                        <span className="text-gray-400">Total Repayment</span>
                                        <span className="text-cyan-400">
                                            {Number(amount) + (Number(amount) * userTier.interest) / 100} CTC
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="gradient"
                                className="w-full"
                                onClick={handleBorrow}
                                loading={isPending || isConfirming}
                            >
                                <ArrowDownRight className="w-4 h-4 mr-2" />
                                Request Loan
                            </Button>
                        </div>
                    )}

                    {activeTab === "loans" && (
                        <div className="text-center py-8 text-gray-500">
                            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No active loans</p>
                            <p className="text-sm mt-1">Request a loan to get started</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* GhostScore requirement info */}
            <Card variant="glass" className="border-purple-500/20">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                        <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-white font-medium">
                            Undercollateralized Loans
                        </p>
                        <p className="text-xs text-gray-400">
                            Higher tiers get better terms. Elite tier users can borrow with
                            0% collateral using their verified GhostScore.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
