"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CONTRACTS, CreditInterceptorABI, ERC20ABI } from "@/lib/contracts";
import { ACTIONS, ActionType } from "@/lib/types";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
    ArrowLeftRight,
    Landmark,
    CheckCircle,
    Lock,
    Send,
    Droplets,
    Zap,
    Wallet,
} from "lucide-react";

const iconMap = {
    [ActionType.SWAP]: ArrowLeftRight,
    [ActionType.LEND]: Landmark,
    [ActionType.REPAY]: CheckCircle,
    [ActionType.STAKE]: Lock,
    [ActionType.TRANSFER]: Send,
    [ActionType.PROVIDE_LIQUIDITY]: Droplets,
};

interface ActionCardProps {
    action: typeof ACTIONS[number];
    onExecute: () => void;
    isLoading: boolean;
    weight: number;
}

function ActionCard({ action, onExecute, isLoading, weight }: ActionCardProps) {
    const Icon = iconMap[action.type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <Card variant="glass" hover className="h-full">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div
                            className="p-3 rounded-xl shrink-0"
                            style={{ backgroundColor: `${action.color}20` }}
                        >
                            <Icon className="w-6 h-6" style={{ color: action.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold text-white">
                                    {action.name}
                                </h3>
                                <Badge
                                    variant="tier"
                                    tierColor={action.color}
                                    className="shrink-0"
                                >
                                    +{weight} pts
                                </Badge>
                            </div>
                            <p className="text-sm text-gray-400 mb-4">{action.description}</p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={onExecute}
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                <Zap className="w-4 h-4 mr-2" />
                                Execute Action
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export default function ActionsPage() {
    const { isConnected, address } = useAccount();
    const [executingAction, setExecutingAction] = useState<ActionType | null>(null);

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

    // Mock weights for demo
    const weights = [10, 25, 50, 20, 5, 30];

    const executeAction = async (actionType: ActionType) => {
        if (!isConnected || !address) {
            toast.error("Please connect your wallet first");
            return;
        }

        setExecutingAction(actionType);

        try {
            const amount = parseEther("100"); // Demo amount

            switch (actionType) {
                case ActionType.SWAP:
                    writeContract({
                        address: CONTRACTS.demoAppChain.interceptor,
                        abi: CreditInterceptorABI,
                        functionName: "interceptSwap",
                        args: [
                            CONTRACTS.mockCTC,
                            CONTRACTS.mockCTC,
                            amount,
                            amount,
                            BigInt(Math.floor(Date.now() / 1000) + 3600),
                        ],
                    });
                    break;

                case ActionType.LEND:
                    writeContract({
                        address: CONTRACTS.demoAppChain.interceptor,
                        abi: CreditInterceptorABI,
                        functionName: "interceptLend",
                        args: [CONTRACTS.mockCTC, amount],
                    });
                    break;

                case ActionType.STAKE:
                    writeContract({
                        address: CONTRACTS.demoAppChain.interceptor,
                        abi: CreditInterceptorABI,
                        functionName: "interceptStake",
                        args: [amount],
                        value: amount,
                    });
                    break;

                case ActionType.PROVIDE_LIQUIDITY:
                    writeContract({
                        address: CONTRACTS.demoAppChain.interceptor,
                        abi: CreditInterceptorABI,
                        functionName: "interceptProvideLiquidity",
                        args: [CONTRACTS.mockCTC, amount],
                    });
                    break;

                default:
                    toast.info("This action is coming soon!");
            }

            toast.success("Transaction submitted!", {
                description: "Your credit event will be recorded once confirmed.",
            });
        } catch (error) {
            console.error(error);
            toast.error("Transaction failed", {
                description: "Please try again.",
            });
        } finally {
            setExecutingAction(null);
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="p-4 rounded-full bg-cyan-500/10 mb-6">
                    <Wallet className="w-12 h-12 text-cyan-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    Connect Your Wallet
                </h1>
                <p className="text-gray-400 max-w-md">
                    Connect your wallet to start building your on-chain credit score.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Build Your Credit</h1>
                <p className="text-gray-400 mt-1">
                    Perform DeFi actions to earn credit points and improve your score
                </p>
            </div>

            {/* Info banner */}
            <Card variant="glass" className="border-cyan-500/20">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Zap className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm text-white font-medium">
                            Every action counts
                        </p>
                        <p className="text-xs text-gray-400">
                            Each DeFi action is recorded and contributes to your credit score.
                            Higher weight actions like repaying loans give more points.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Actions grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACTIONS.map((action, index) => (
                    <ActionCard
                        key={action.type}
                        action={action}
                        weight={weights[index]}
                        onExecute={() => executeAction(action.type)}
                        isLoading={executingAction === action.type && (isPending || isConfirming)}
                    />
                ))}
            </div>

            {/* Weight explanation */}
            <Card variant="glass">
                <CardHeader>
                    <CardTitle>Credit Weights</CardTitle>
                    <CardDescription>
                        Different actions contribute different amounts to your score
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {ACTIONS.map((action, index) => (
                            <div
                                key={action.type}
                                className="text-center p-3 rounded-lg bg-gray-800/30"
                            >
                                <p className="text-2xl font-bold" style={{ color: action.color }}>
                                    {weights[index]}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{action.name}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
