"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/useWallet";
import { useContracts } from "@/hooks/useContracts";
import { useToast } from "@/hooks/useToast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import GhostScoreGauge from "@/components/ui/GhostScoreGauge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { shortenAddress, getTierInfo } from "@/lib/utils";

interface Attestation {
  scoreThreshold: number;
  timestamp: number;
  valid: boolean;
}

export default function ZKProofPage() {
  const { address } = useWallet();
  const { registry, verifier } = useContracts();
  const { addToast, updateToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [score, setScore] = useState(0);
  const [commitment, setCommitment] = useState("");
  const [salt, setSalt] = useState("");
  const [merkleRoot, setMerkleRoot] = useState("");
  const [mockMode, setMockMode] = useState(false);
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [attestationCount, setAttestationCount] = useState(0);
  const [hasValid, setHasValid] = useState(false);

  // Proof submission state
  const [proofHex, setProofHex] = useState("");
  const [publicInputs, setPublicInputs] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Threshold check
  const [threshold, setThreshold] = useState("");
  const [thresholdResult, setThresholdResult] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!address) return;
    async function load() {
      setLoading(true);
      try {
        const [s, c, sl, mr, mm, att, ac] = await Promise.all([
          registry.getMyScore().catch(() => 0n),
          registry.getScoreCommitment(address).catch(() => "0x0"),
          registry.getMySalt().catch(() => "0x0"),
          registry.getRegistryMerkleRoot().catch(() => "0x0"),
          verifier.mockMode().catch(() => false),
          verifier.getLatestAttestation(address).catch(() => [null, false]),
          verifier.getAttestationCount(address).catch(() => 0n),
        ]);

        setScore(Number(s));
        setCommitment(String(c));
        setSalt(String(sl));
        setMerkleRoot(String(mr));
        setMockMode(Boolean(mm));
        setAttestationCount(Number(ac));

        // Parse attestation tuple
        const [attData, exists] = att as [{ scoreThreshold: bigint; timestamp: bigint; valid: boolean } | null, boolean];
        if (exists && attData) {
          setAttestation({
            scoreThreshold: Number(attData.scoreThreshold),
            timestamp: Number(attData.timestamp),
            valid: attData.valid,
          });
          setHasValid(attData.valid);
        } else {
          setAttestation(null);
          setHasValid(false);
        }
      } catch {
        /* ignore */
      }
      setLoading(false);
    }
    load();
  }, [address, registry, verifier]);

  async function handleSubmitProof() {
    if (!proofHex) return;
    setSubmitting(true);
    const tid = addToast("Submitting ZK proof...", "pending");
    try {
      const inputs = publicInputs
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const tx = await verifier.verifyAndAttest(proofHex, inputs);
      updateToast(tid, "Proof submitted, waiting for confirmation...", "pending");
      await tx.wait();
      updateToast(tid, "ZK proof verified and attested!", "success");

      // Refresh attestation data
      const [att, ac] = await Promise.all([
        verifier.getLatestAttestation(address).catch(() => [null, false]),
        verifier.getAttestationCount(address).catch(() => 0n),
      ]);
      setAttestationCount(Number(ac));
      const [attData, exists] = att as [{ scoreThreshold: bigint; timestamp: bigint; valid: boolean } | null, boolean];
      if (exists && attData) {
        setAttestation({
          scoreThreshold: Number(attData.scoreThreshold),
          timestamp: Number(attData.timestamp),
          valid: attData.valid,
        });
        setHasValid(attData.valid);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Proof verification failed";
      updateToast(tid, msg.slice(0, 80), "error");
    }
    setSubmitting(false);
  }

  async function handleCheckThreshold() {
    if (!threshold || !address) return;
    setChecking(true);
    try {
      const result = await verifier.hasValidAttestation(address, BigInt(threshold));
      setThresholdResult(Boolean(result));
    } catch {
      setThresholdResult(false);
    }
    setChecking(false);
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  const tier = getTierInfo(score);
  const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            ZK Score Proof
          </h2>
          <p className="text-[#555] text-sm font-mono mt-1">
            Prove your credit score without revealing it
          </p>
        </div>
        {mockMode && (
          <span className="px-3 py-1 text-[10px] font-mono tracking-wider rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-400">
            MOCK MODE
          </span>
        )}
      </div>

      {/* Score + Cryptographic State */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Score Card */}
        <Card className="flex flex-col items-center justify-center py-8">
          <GhostScoreGauge score={score} size={160} />
          <div
            className="mt-4 text-xs font-mono font-bold tracking-wider"
            style={{ color: tier.color }}
          >
            {tier.name}
          </div>
        </Card>

        {/* Cryptographic Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-3">
              Score Commitment
            </div>
            <div className="font-mono text-xs text-[#888] break-all leading-relaxed">
              {commitment !== zeroHash ? commitment : (
                <span className="text-[#444]">No commitment generated</span>
              )}
            </div>
            <div className="mt-3 text-[10px] text-[#444] font-mono">
              H(score ‖ salt) — on-chain hash
            </div>
          </Card>

          <Card>
            <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-3">
              Your Salt
            </div>
            <div className="font-mono text-xs text-[#888] break-all leading-relaxed">
              {salt !== zeroHash ? salt : (
                <span className="text-[#444]">No salt assigned</span>
              )}
            </div>
            <div className="mt-3 text-[10px] text-[#444] font-mono">
              Private randomness for ZK proof
            </div>
          </Card>

          <Card>
            <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-3">
              Registry Merkle Root
            </div>
            <div className="font-mono text-xs text-[#888] break-all leading-relaxed">
              {merkleRoot !== zeroHash ? merkleRoot : (
                <span className="text-[#444]">Empty registry</span>
              )}
            </div>
            <div className="mt-3 text-[10px] text-[#444] font-mono">
              Root of all credit commitments
            </div>
          </Card>

          <Card>
            <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-3">
              Attestations
            </div>
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold font-mono text-white">
                {attestationCount}
              </div>
              <div className={`px-2 py-0.5 rounded text-[10px] font-mono tracking-wider ${
                hasValid
                  ? "text-[#00FF88] bg-[#00FF88]/8 border border-[#00FF88]/20"
                  : "text-[#555] bg-[#111] border border-[#1a1a1a]"
              }`}>
                {hasValid ? "VALID" : "NONE"}
              </div>
            </div>
            <div className="mt-3 text-[10px] text-[#444] font-mono">
              Verified ZK proofs on-chain
            </div>
          </Card>
        </div>
      </div>

      {/* Latest Attestation */}
      {attestation && (
        <Card>
          <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-4">
            Latest Attestation
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-[10px] text-[#444] font-mono mb-1">Score Threshold</div>
              <div className="text-lg font-bold font-mono text-[#00FF88]">
                ≥ {attestation.scoreThreshold}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#444] font-mono mb-1">Timestamp</div>
              <div className="text-sm font-mono text-[#aaa]">
                {new Date(attestation.timestamp * 1000).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-[#444] font-mono mb-1">Status</div>
              <div className={`text-sm font-mono font-bold ${
                attestation.valid ? "text-[#00FF88]" : "text-red-400"
              }`}>
                {attestation.valid ? "VERIFIED" : "INVALID"}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Submit Proof + Check Threshold */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Submit ZK Proof */}
        <Card>
          <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-1">
            Submit ZK Proof
          </div>
          <p className="text-[11px] text-[#444] font-mono mb-5">
            Prove your score exceeds a threshold without revealing the exact value
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#555] tracking-wider uppercase block mb-1.5">
                Proof (hex)
              </label>
              <textarea
                value={proofHex}
                onChange={(e) => setProofHex(e.target.value)}
                placeholder="0x..."
                rows={3}
                className="w-full bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-[#333] focus:outline-none focus:border-[#00FF88]/30 transition-colors resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#555] tracking-wider uppercase block mb-1.5">
                Public Inputs (comma-separated bytes32)
              </label>
              <input
                type="text"
                value={publicInputs}
                onChange={(e) => setPublicInputs(e.target.value)}
                placeholder="0xabc..., 0xdef..."
                className="w-full bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-[#333] focus:outline-none focus:border-[#00FF88]/30 transition-colors"
              />
            </div>

            <Button
              onClick={handleSubmitProof}
              loading={submitting}
              disabled={!proofHex}
              className="w-full"
            >
              Verify &amp; Attest
            </Button>
          </div>
        </Card>

        {/* Check Threshold */}
        <Card>
          <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-1">
            Check Attestation
          </div>
          <p className="text-[11px] text-[#444] font-mono mb-5">
            Verify if your address has a valid attestation above a score threshold
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#555] tracking-wider uppercase block mb-1.5">
                Minimum Score Threshold
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => {
                  setThreshold(e.target.value);
                  setThresholdResult(null);
                }}
                placeholder="e.g. 300"
                className="w-full bg-[#111] border border-[#1a1a1a] rounded-lg px-4 py-3 text-sm font-mono text-white placeholder-[#333] focus:outline-none focus:border-[#00FF88]/30 transition-colors"
              />
            </div>

            <Button
              onClick={handleCheckThreshold}
              loading={checking}
              disabled={!threshold}
              variant="secondary"
              className="w-full"
            >
              Check Attestation
            </Button>

            {thresholdResult !== null && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-lg border ${
                  thresholdResult
                    ? "border-[#00FF88]/20 bg-[#00FF88]/5"
                    : "border-red-500/20 bg-red-500/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    thresholdResult
                      ? "bg-[#00FF88]/10 text-[#00FF88]"
                      : "bg-red-500/10 text-red-400"
                  }`}>
                    {thresholdResult ? "✓" : "✗"}
                  </div>
                  <div>
                    <div className={`text-sm font-mono font-bold ${
                      thresholdResult ? "text-[#00FF88]" : "text-red-400"
                    }`}>
                      {thresholdResult ? "ATTESTATION VALID" : "NO VALID ATTESTATION"}
                    </div>
                    <div className="text-[10px] text-[#555] font-mono mt-0.5">
                      {thresholdResult
                        ? `Score ≥ ${threshold} verified on-chain`
                        : `No proof for score ≥ ${threshold} found`}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* How it works */}
          <div className="mt-6 pt-5 border-t border-[#1a1a1a]">
            <div className="text-[10px] text-[#555] tracking-[0.2em] uppercase mb-3">
              How ZK Proofs Work
            </div>
            <div className="space-y-2">
              {[
                { step: "01", text: "Your score + salt produce a commitment hash stored on-chain" },
                { step: "02", text: "Generate a ZK proof off-chain that your score ≥ threshold" },
                { step: "03", text: "Submit the proof — verifier checks without seeing your score" },
                { step: "04", text: "Attestation stored on-chain; use it for undercollateralized loans" },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 items-start">
                  <span className="text-[10px] font-mono text-[#00FF88]/50 mt-0.5">
                    {item.step}
                  </span>
                  <span className="text-[11px] font-mono text-[#555] leading-relaxed">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
