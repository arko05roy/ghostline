"use client";

import { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { GhostScoreVerifierABI, CreditRegistryABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Shield, Lock, CheckCircle } from "lucide-react";

export default function GhostScorePage({ params }: { params: { chainId: string } }) {
  const { address, isConnected } = useAccount();
  const [threshold, setThreshold] = useState("100");
  const [proof, setProof] = useState("");

  const registryAddress = CONTRACT_ADDRESSES.demoAppChain.registry;
  const verifierAddress = CONTRACT_ADDRESSES.demoAppChain.verifier;

  const { data: score } = useReadContract({
    address: registryAddress,
    abi: CreditRegistryABI,
    functionName: "getMyScore",
    query: { enabled: isConnected && !!address },
  });

  const { data: attestationCount } = useReadContract({
    address: verifierAddress,
    abi: GhostScoreVerifierABI,
    functionName: "getAttestationCount",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && !!address },
  });

  const { writeContract: verify, data: verifyHash } = useWriteContract();
  const { isLoading: isVerifying } = useWaitForTransactionReceipt({
    hash: verifyHash,
  });

  const currentScore = score ? Number(score) : 0;
  const thresholdNum = parseInt(threshold) || 0;

  const handleGenerateProof = () => {
    // In production, this would call a Noir prover
    // For now, generate a mock proof
    const mockProof = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    setProof(mockProof);
  };

  const handleSubmitProof = () => {
    if (!proof || !address) return;

    // Mock public inputs - in production, these come from the proof generation
    const publicInputs: `0x${string}`[] = [
      `0x${thresholdNum.toString(16).padStart(64, "0")}` as `0x${string}`,
      `0x${address.slice(2).padStart(64, "0")}` as `0x${string}`,
    ];

    verify({
      address: verifierAddress,
      abi: GhostScoreVerifierABI,
      functionName: "verifyAndAttest",
      args: [proof as `0x${string}`, publicInputs],
    });
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto">
        <Card className="text-center py-12">
          <h2 className="text-xl font-semibold text-slate-300 mb-2">Connect Your Wallet</h2>
          <p className="text-slate-500">Please connect your wallet to generate GhostScore proofs</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 mb-2">GhostScore</h1>
        <p className="text-slate-400">Generate ZK proofs of your credit score without revealing it</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proof Generation */}
        <Card variant="gradient">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Generate Proof</h2>
              <p className="text-sm text-slate-400">Create a ZK proof of your credit score</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="text-sm text-slate-400 mb-1">Your Credit Score</div>
              <div className="text-2xl font-bold text-slate-100">{currentScore}</div>
              <div className="text-xs text-slate-500 mt-1">Private - only you can see this</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prove your score is above:
              </label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="100"
                min="0"
                max={currentScore.toString()}
              />
              <p className="text-xs text-slate-500 mt-1">
                Maximum: {currentScore} (your current score)
              </p>
            </div>

            {thresholdNum > currentScore && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-sm text-red-400">
                Threshold cannot exceed your current score
              </div>
            )}

            <Button
              onClick={handleGenerateProof}
              disabled={!threshold || thresholdNum > currentScore || thresholdNum <= 0}
              className="w-full"
            >
              <Lock className="w-4 h-4 mr-2" />
              Generate Proof
            </Button>

            {proof && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-800/50 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Proof Generated</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400 break-all">{proof}</div>
                </div>

                <Button
                  onClick={handleSubmitProof}
                  disabled={isVerifying}
                  className="w-full"
                >
                  {isVerifying ? "Submitting..." : "Submit to Chain"}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Attestations */}
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-100">Attestations</h2>
              <p className="text-sm text-slate-400">Your verified proofs</p>
            </div>
          </div>

          {attestationCount === undefined || Number(attestationCount) === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No attestations yet</p>
              <p className="text-sm mt-2">Generate and submit a proof to create your first attestation</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from({ length: Number(attestationCount) }).map((_, i) => (
                <AttestationCard key={i} index={i} verifierAddress={verifierAddress} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function AttestationCard({ index, verifierAddress }: { index: number; verifierAddress: `0x${string}` }) {
  const { address } = useAccount();
  const { data: attestation } = useReadContract({
    address: verifierAddress,
    abi: GhostScoreVerifierABI,
    functionName: "getAttestation",
    args: address && index !== undefined ? [address, BigInt(index)] : undefined,
    query: { enabled: !!address },
  });

  if (!attestation) return null;

  return (
    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <Badge variant={attestation.valid ? "success" : "danger"}>
          {attestation.valid ? "Valid" : "Invalid"}
        </Badge>
        <span className="text-xs text-slate-500">
          {new Date(Number(attestation.timestamp) * 1000).toLocaleDateString()}
        </span>
      </div>
      <div className="text-sm text-slate-300">
        Score ≥ {Number(attestation.scoreThreshold)}
      </div>
    </div>
  );
}
