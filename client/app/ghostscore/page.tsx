"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CONTRACTS, GhostScoreVerifierABI } from "@/lib/contracts";
import { getTierFromScore } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    Lock,
    CheckCircle,
    Loader2,
    Eye,
    EyeOff,
    Wallet,
    Zap,
    Clock,
} from "lucide-react";

// Demo score - will come from contract
const DEMO_SCORE = 450;

const thresholds = [100, 200, 300, 400, 500, 600, 700, 800, 900];

export default function GhostScorePage() {
    const { isConnected, address } = useAccount();
    const [selectedThreshold, setSelectedThreshold] = useState(300);
    const [isGenerating, setIsGenerating] = useState(false);
    const [proofGenerated, setProofGenerated] = useState(false);
    const [showScore, setShowScore] = useState(false);

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const canProve = DEMO_SCORE >= selectedThreshold;
    const tier = getTierFromScore(selectedThreshold);

    const generateProof = async () => {
        setIsGenerating(true);

        // Simulate proof generation (in production, this would call the Noir prover)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setProofGenerated(true);
        setIsGenerating(false);

        toast.success("GhostScore proof generated!", {
            description: `Proving score >= ${selectedThreshold}`,
        });
    };

    const submitAttestation = async () => {
        if (!proofGenerated) {
            toast.error("Generate a proof first");
            return;
        }

        try {
            // Mock proof bytes for demo
            const mockProof = "0x" + "00".repeat(32);
            const mockPublicInputs: `0x${string}`[] = [];

            writeContract({
                address: CONTRACTS.demoAppChain.verifier,
                abi: GhostScoreVerifierABI,
                functionName: "verifyAndAttest",
                args: [mockProof as `0x${string}`, mockPublicInputs, BigInt(selectedThreshold)],
            });

            toast.success("Attestation submitted!", {
                description: "Your GhostScore is now verifiable on-chain.",
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit attestation");
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="p-4 rounded-full bg-purple-500/10 mb-6">
                    <Wallet className="w-12 h-12 text-purple-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                    Connect Your Wallet
                </h1>
                <p className="text-gray-400 max-w-md">
                    Connect to view your score and generate a GhostScore proof.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Page header */}
            <div className="text-center">
                <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-full bg-purple-500/10">
                        <Shield className="w-10 h-10 text-purple-400" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-white">GhostScore</h1>
                <p className="text-gray-400 mt-2 max-w-md mx-auto">
                    Generate a zero-knowledge proof to verify your creditworthiness
                    without revealing your actual score.
                </p>
            </div>

            {/* Current score (private) */}
            <Card variant="gradient" className="border-purple-500/20">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                                {showScore ? (
                                    <Eye className="w-5 h-5 text-purple-400" />
                                ) : (
                                    <EyeOff className="w-5 h-5 text-purple-400" />
                                )}
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Your Credit Score</p>
                                <p className="text-2xl font-bold text-white">
                                    {showScore ? DEMO_SCORE : "••••"}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowScore(!showScore)}
                        >
                            {showScore ? "Hide" : "Reveal"}
                        </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Only you can see this score. Others see your verified threshold.
                    </p>
                </CardContent>
            </Card>

            {/* Threshold selector */}
            <Card variant="glass">
                <CardHeader>
                    <CardTitle>Select Threshold to Prove</CardTitle>
                    <CardDescription>
                        Choose the minimum score you want to prove. Higher thresholds unlock
                        better loan terms.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Threshold slider */}
                    <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Threshold</span>
                            <span className="font-medium" style={{ color: tier.color }}>
                                {selectedThreshold} ({tier.name})
                            </span>
                        </div>
                        <input
                            type="range"
                            min={100}
                            max={900}
                            step={100}
                            value={selectedThreshold}
                            onChange={(e) => setSelectedThreshold(Number(e.target.value))}
                            className="w-full accent-purple-500"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>100</span>
                            <span>900</span>
                        </div>
                    </div>

                    {/* Can prove indicator */}
                    <div
                        className={`p-4 rounded-lg border ${canProve
                                ? "bg-green-500/10 border-green-500/30"
                                : "bg-red-500/10 border-red-500/30"
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            {canProve ? (
                                <CheckCircle className="w-5 h-5 text-green-400" />
                            ) : (
                                <Zap className="w-5 h-5 text-red-400" />
                            )}
                            <div>
                                <p
                                    className={`font-medium ${canProve ? "text-green-400" : "text-red-400"
                                        }`}
                                >
                                    {canProve
                                        ? "You can prove this threshold"
                                        : "Score too low for this threshold"}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    {canProve
                                        ? "Generate a proof to verify on-chain"
                                        : "Build more credit or choose a lower threshold"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tier benefits */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { tier: "Builder", min: 100, benefit: "5K max loan" },
                            { tier: "Trusted", min: 300, benefit: "25K max loan" },
                            { tier: "Elite", min: 600, benefit: "100K, 0% collateral" },
                        ].map((t) => (
                            <div
                                key={t.tier}
                                className={`p-3 rounded-lg border text-center transition-all ${selectedThreshold >= t.min
                                        ? "border-purple-500/50 bg-purple-500/10"
                                        : "border-gray-800 bg-gray-800/30"
                                    }`}
                            >
                                <p
                                    className={`text-sm font-medium ${selectedThreshold >= t.min
                                            ? "text-purple-400"
                                            : "text-gray-500"
                                        }`}
                                >
                                    {t.tier}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{t.benefit}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Generate proof */}
            <Card variant="glass">
                <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-white">
                                Generate Proof
                            </h3>
                            <p className="text-sm text-gray-400">
                                Create a ZK proof that your score ≥ {selectedThreshold}
                            </p>
                        </div>
                        <Badge
                            variant={proofGenerated ? "success" : "default"}
                            className="shrink-0"
                        >
                            {proofGenerated ? "Proof Ready" : "No Proof"}
                        </Badge>
                    </div>

                    <AnimatePresence mode="wait">
                        {isGenerating ? (
                            <motion.div
                                key="generating"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center py-8"
                            >
                                <Loader2 className="w-12 h-12 text-purple-400 animate-spin mb-4" />
                                <p className="text-white font-medium">Generating ZK Proof...</p>
                                <p className="text-sm text-gray-400 mt-1">
                                    This may take a few seconds
                                </p>
                            </motion.div>
                        ) : proofGenerated ? (
                            <motion.div
                                key="generated"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <div>
                                            <p className="font-medium text-green-400">
                                                Proof Generated Successfully
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Score ≥ {selectedThreshold} verified
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="gradient"
                                    className="w-full"
                                    onClick={submitAttestation}
                                    loading={isPending || isConfirming}
                                >
                                    Submit Attestation On-Chain
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="generate"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <Button
                                    variant="gradient"
                                    className="w-full"
                                    onClick={generateProof}
                                    disabled={!canProve}
                                >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Generate GhostScore Proof
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>

            {/* Attestation history (mock) */}
            <Card variant="glass">
                <CardHeader>
                    <CardTitle>Your Attestations</CardTitle>
                    <CardDescription>
                        Previously verified thresholds
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSuccess ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            Score ≥ {selectedThreshold}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            Just now
                                        </p>
                                    </div>
                                </div>
                                <Badge variant="success">Valid</Badge>
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-4">
                            No attestations yet. Generate and submit a proof above.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
