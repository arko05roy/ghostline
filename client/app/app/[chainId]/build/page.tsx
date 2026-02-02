"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { CreditInterceptorABI, ERC20_ABI, CONTRACT_ADDRESSES, ActionType } from "@/lib/contracts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatNumber } from "@/lib/utils";
import { Zap, ArrowRight, TrendingUp } from "lucide-react";
import { parseEther } from "viem";

const actions = [
  {
    type: ActionType.SWAP,
    label: "Swap Tokens",
    icon: ArrowRight,
    description: "Swap tokens via DEX",
    color: "bg-blue-500/20 border-blue-500/30 text-blue-400",
  },
  {
    type: ActionType.LEND,
    label: "Lend Tokens",
    icon: TrendingUp,
    description: "Lend tokens to earn credit",
    color: "bg-purple-500/20 border-purple-500/30 text-purple-400",
  },
  {
    type: ActionType.STAKE,
    label: "Stake CTC",
    icon: Zap,
    description: "Stake Creditcoin tokens",
    color: "bg-amber-500/20 border-amber-500/30 text-amber-400",
  },
  {
    type: ActionType.TRANSFER,
    label: "Transfer Tokens",
    icon: ArrowRight,
    description: "Transfer tokens to another address",
    color: "bg-slate-500/20 border-slate-500/30 text-slate-400",
  },
  {
    type: ActionType.PROVIDE_LIQUIDITY,
    label: "Provide Liquidity",
    icon: TrendingUp,
    description: "Add liquidity to pools",
    color: "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
  },
];

export default function BuildCreditPage({ params }: { params: { chainId: string } }) {
  const { address, isConnected } = useAccount();
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const interceptorAddress = CONTRACT_ADDRESSES.demoAppChain.interceptor;
  const tokenAddress = CONTRACT_ADDRESSES.mockCTC;

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && interceptorAddress ? [address, interceptorAddress] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { writeContract: approve, data: approveHash } = useWriteContract();
  const { writeContract: intercept, data: interceptHash } = useWriteContract();

  const { isLoading: isApproving } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  const { isLoading: isExecuting } = useWaitForTransactionReceipt({
    hash: interceptHash,
  });

  const needsApproval = allowance && amount
    ? BigInt(allowance) < parseEther(amount)
    : false;

  const executeAction = () => {
    if (!selectedAction || !amount || !address) return;

    const amountWei = parseEther(amount);

    try {
      switch (selectedAction) {
        case ActionType.SWAP:
          intercept({
            address: interceptorAddress,
            abi: CreditInterceptorABI,
            functionName: "interceptSwap",
            args: [tokenAddress, tokenAddress, amountWei, 0n],
            value: amountWei,
          });
          break;
        case ActionType.LEND:
          intercept({
            address: interceptorAddress,
            abi: CreditInterceptorABI,
            functionName: "interceptLend",
            args: [tokenAddress, amountWei],
          });
          break;
        case ActionType.STAKE:
          intercept({
            address: interceptorAddress,
            abi: CreditInterceptorABI,
            functionName: "interceptStake",
            args: [amountWei],
            value: amountWei,
          });
          break;
        case ActionType.TRANSFER:
          if (!recipient) return;
          intercept({
            address: interceptorAddress,
            abi: CreditInterceptorABI,
            functionName: "interceptTransfer",
            args: [recipient as `0x${string}`, tokenAddress, amountWei],
          });
          break;
        case ActionType.PROVIDE_LIQUIDITY:
          intercept({
            address: interceptorAddress,
            abi: CreditInterceptorABI,
            functionName: "interceptProvideLiquidity",
            args: [tokenAddress, tokenAddress, amountWei, amountWei],
          });
          break;
      }
    } catch (error) {
      console.error("Error executing action:", error);
    }
  };

  const handleAction = async () => {
    if (!selectedAction || !amount || !address) return;

    const amountWei = parseEther(amount);

    if (needsApproval) {
      approve({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [interceptorAddress, amountWei],
      });
      return;
    }

    executeAction();
  };

  // Auto-execute after approval
  const { isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
    onSuccess: () => {
      // Execute action after approval succeeds
      if (selectedAction && amount) {
        executeAction();
      }
    },
  });

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500">Please connect your wallet to build credit</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">Build Credit</h1>
        <p className="text-slate-400">Perform DeFi actions to earn credit points</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {actions.map((action) => {
          const Icon = action.icon;
          const isSelected = selectedAction === action.type;
          return (
            <Card
              key={action.type}
              className={`cursor-pointer transition-all hover:scale-105 ${
                isSelected ? "ring-2 ring-amber-500" : ""
              }`}
              onClick={() => setSelectedAction(action.type)}
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${action.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-1">{action.label}</h3>
              <p className="text-sm text-slate-400">{action.description}</p>
            </Card>
          );
        })}
      </div>

      {selectedAction && (
        <Card variant="gradient">
          <h2 className="text-xl font-semibold text-slate-100 mb-6">
            {actions.find((a) => a.type === selectedAction)?.label}
          </h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-2">
                Balance: {balance ? formatNumber(balance) : "0"} CTC
              </p>
            </div>

            <Input
              label="Amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />

            {selectedAction === ActionType.TRANSFER && (
              <Input
                label="Recipient Address"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            )}

            <Button
              className="w-full"
              onClick={handleAction}
              disabled={!amount || isApproving || isExecuting}
            >
              {isApproving
                ? "Approving..."
                : isExecuting
                ? "Executing..."
                : needsApproval
                ? "Approve Token"
                : "Execute Action"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
