"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CONTRACTS, GhostScoreVerifierABI } from "@/lib/contracts";
import { getTierFromScore } from "@/lib/utils";
import {
    generateProof,
    formatProofForContract,
    generateSalt,
    hashUserAddress,
    getTierName,
    TIER_THRESHOLDS,
    type GhostScoreProof,
} from "@/lib/ghostscore";
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
    Copy,
    ExternalLink,
} from "lucide-react";

// Demo score - will come from contract
const DEMO_SCORE = 450;

const thresholds = [100, 200, 300, 400, 500, 600];

export default function GhostScorePage() {
    const { isConnected, address } = useAccount();
    const [selectedThreshold, setSelectedThreshold] = useState(300);
    const [isGenerating, setIsGenerating] = useState(false);
    const [proof, setProof] = useState<GhostScoreProof | null>(null);
    const [showScore, setShowScore] = useState(false);
    const [attestations, setAttestations] = useState<Array<{
        threshold: number;
        timestamp: number;
        txHash?: string;
    }>>([]);

    const { writeContract, data: hash, isPending } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const canProve = DEMO_SCORE >= selectedThreshold;
    const tier = getTierFromScore(selectedThreshold);
    const userTier = getTierName(DEMO_SCORE);

    // Add attestation when transaction succeeds
    useEffect(() => {
        if (isSuccess && proof) {
            setAttestations(prev => [
                {
                    threshold: proof.publicInputs.scoreThreshold,
                    timestamp: Date.now(),
                    txHash: hash,
                },
                ...prev,
            ]);
            toast.success("Attestation recorded on-chain!", {
                description: "Your GhostScore is now verifiable.",
            });
        }
    }, [isSuccess, hash, proof]);

    const generateZKProof = async () => {
        if (!address) {
            toast.error("Please connect your wallet");
            return;
        }

        setIsGenerating(true);
        setProof(null);

        try {
            const userAddressHash = hashUserAddress(address);
            const salt = generateSalt();

            const newProof = await generateProof({
                actualScore: DEMO_SCORE,
                salt,
                userAddressHash,
                scoreThreshold: selectedThreshold,
            });

            setProof(newProof);
            toast.success("GhostScore proof generated!", {
                description: `Proving score >= ${selectedThreshold}`,
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate proof", {
                description: error instanceof Error ? error.message : "Unknown error",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const submitAttestation = async () => {
        if (!proof) {
            toast.error("Generate a proof first");
            return;
        }

        try {
            const { proof: proofBytes, publicInputs } = formatProofForContract(proof);

            writeContract({
                address: CONTRACTS.demoAppChain.verifier,
                abi: GhostScoreVerifierABI,
                functionName: "verifyAndAttest",
                args: [proofBytes, publicInputs],
            });

            toast.success("Attestation submitted!", {
                description: "Waiting for confirmation...",
            });
        } catch (error) {
            console.error(error);
            toast.error("Failed to submit attestation");
        }
    };

    const copyProofHash = () => {
        if (proof?.proofHash) {
            navigator.clipboard.writeText(proof.proofHash);
            toast.success("Proof hash copied!");
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
                                <div className="flex items-center gap-3">
                                    <p className="text-2xl font-bold text-white">
                                        {showScore ? DEMO_SCORE : "••••"}
                                    </p>
                                    <Badge variant="tier" tierColor={getTierFromScore(DEMO_SCORE).color}>
                                        {userTier}
                                    </Badge>
                                </div>
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
                        Only you can see this score. Others see only your verified threshold.
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
                    {/* Threshold buttons */}
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {thresholds.map((threshold) => {
                            const isSelected = selectedThreshold === threshold;
                            const isAchievable = DEMO_SCORE >= threshold;

                            return (
                                <button
                                    key={threshold}
                                    onClick={() => setSelectedThreshold(threshold)}
                                    disabled={!isAchievable}
                                    className={`p-3 rounded-lg border text-center transition-all ${isSelected
                                        ? "border-purple-500 bg-purple-500/20"
                                        : isAchievable
                                            ? "border-gray-700 bg-gray-800/30 hover:border-gray-600"
                                            : "border-gray-800 bg-gray-900/50 opacity-50 cursor-not-allowed"
                                        }`}
                                >
                                    <p className={`text-lg font-bold ${isSelected ? "text-purple-400" : "text-white"}`}>
                                        {threshold}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {getTierName(threshold)}
                                    </p>
                                </button>
                            );
                        })}
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
                                        ? `Your score (${showScore ? DEMO_SCORE : "hidden"}) meets the ${selectedThreshold} threshold`
                                        : "Build more credit or choose a lower threshold"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tier benefits */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { tier: "BUILDER", min: 100, benefit: "5K max loan", collateral: "100%" },
                            { tier: "TRUSTED", min: 300, benefit: "25K max loan", collateral: "50%" },
                            { tier: "ELITE", min: 600, benefit: "100K max loan", collateral: "0%" },
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
                                <p className="text-xs text-gray-500">{t.collateral} collateral</p>
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
                                Generate ZK Proof
                            </h3>
                            <p className="text-sm text-gray-400">
                                Create a proof that your score ≥ {selectedThreshold}
                            </p>
                        </div>
                        <Badge
                            variant={proof ? "success" : "default"}
                            className="shrink-0"
                        >
                            {proof ? "Proof Ready" : "No Proof"}
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
                                    Computing Pedersen commitments...
                                </p>
                            </motion.div>
                        ) : proof ? (
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
                                        <div className="flex-1">
                                            <p className="font-medium text-green-400">
                                                Proof Generated Successfully
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Score ≥ {proof.publicInputs.scoreThreshold} verified
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Proof details */}
                                <div className="p-4 rounded-lg bg-gray-800/30 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-400">Proof Hash</span>
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs text-cyan-400">
                                                {proof.proofHash.slice(0, 10)}...{proof.proofHash.slice(-8)}
                                            </code>
                                            <button
                                                onClick={copyProofHash}
                                                className="text-gray-500 hover:text-white"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Commitment</span>
                                        <code className="text-xs text-gray-500">
                                            {proof.publicInputs.commitment.slice(0, 10)}...
                                        </code>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-400">Generated</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(proof.generatedAt).toLocaleTimeString()}
                                        </span>
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
                                    onClick={generateZKProof}
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

            {/* Attestation history */}
            <Card variant="glass">
                <CardHeader>
                    <CardTitle>Your Attestations</CardTitle>
                    <CardDescription>Previously verified thresholds</CardDescription>
                </CardHeader>
                <CardContent>
                    {attestations.length > 0 ? (
                        <div className="space-y-3">
                            {attestations.map((att, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30"
                                >
                                    <div className="flex items-center gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                Score ≥ {att.threshold}
                                            </p>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(att.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="success">Valid</Badge>
                                        {att.txHash && (
                                            <a
                                                href={`https://explorer.cc3-testnet.creditcoin.network/tx/${att.txHash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-gray-500 hover:text-cyan-400"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-4">
                            No attestations yet. Generate and submit a proof above.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* How it works */}
            <Card variant="glass" className="border-purple-500/20">
                <CardContent className="p-4">
                    <h4 className="text-sm font-medium text-white mb-3">How GhostScore Works</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                                <span className="text-purple-400 font-bold">1</span>
                            </div>
                            <p className="text-xs text-gray-400">
                                Your actual score is kept private
                            </p>
                        </div>
                        <div>
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                                <span className="text-purple-400 font-bold">2</span>
                            </div>
                            <p className="text-xs text-gray-400">
                                ZK proof proves score ≥ threshold
                            </p>
                        </div>
                        <div>
                            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-2">
                                <span className="text-purple-400 font-bold">3</span>
                            </div>
                            <p className="text-xs text-gray-400">
                                Attestation stored on-chain forever
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
