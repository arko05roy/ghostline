/**
 * GhostScore ZK Proof Library
 * 
 * This module provides functions to generate and verify GhostScore proofs
 * in the browser using noir_js.
 * 
 * For the hackathon demo, we use a mock implementation that simulates
 * the ZK proof generation. In production, this would use the actual
 * Noir WASM prover.
 */

import { keccak256, encodePacked, toHex } from 'viem';

// Tier thresholds
export const TIER_THRESHOLDS = {
    NEWCOMER: 0,
    BUILDER: 100,
    TRUSTED: 300,
    ELITE: 600,
} as const;

export type TierName = keyof typeof TIER_THRESHOLDS;

/**
 * Get tier name from score
 */
export function getTierName(score: number): TierName {
    if (score >= TIER_THRESHOLDS.ELITE) return 'ELITE';
    if (score >= TIER_THRESHOLDS.TRUSTED) return 'TRUSTED';
    if (score >= TIER_THRESHOLDS.BUILDER) return 'BUILDER';
    return 'NEWCOMER';
}

/**
 * Proof inputs for the GhostScore circuit
 */
export interface ProofInputs {
    actualScore: number;
    salt: bigint;
    userAddressHash: `0x${string}`;
    scoreThreshold: number;
}

/**
 * Generated proof output
 */
export interface GhostScoreProof {
    proof: `0x${string}`;
    publicInputs: {
        scoreThreshold: number;
        commitment: `0x${string}`;
    };
    proofHash: `0x${string}`;
    generatedAt: number;
    canProve: boolean;
}

/**
 * Compute the commitment for a score
 * In the real circuit, this uses Pedersen hash
 * For demo, we use keccak256 as a mock
 */
export function computeCommitment(
    score: number,
    userAddressHash: `0x${string}`,
    salt: bigint
): `0x${string}` {
    return keccak256(
        encodePacked(
            ['uint256', 'bytes32', 'uint256'],
            [BigInt(score), userAddressHash, salt]
        )
    );
}

/**
 * Generate a random salt for proof generation
 */
export function generateSalt(): bigint {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return BigInt('0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join(''));
}

/**
 * Hash a user address for use in the circuit
 */
export function hashUserAddress(address: `0x${string}`): `0x${string}` {
    return keccak256(address);
}

/**
 * Generate a GhostScore proof
 * 
 * In production, this would call the Noir WASM prover.
 * For the hackathon demo, we generate a mock proof that
 * can be verified by the mock verifier contract.
 */
export async function generateProof(inputs: ProofInputs): Promise<GhostScoreProof> {
    const { actualScore, salt, userAddressHash, scoreThreshold } = inputs;

    // Check if proof is possible
    const canProve = actualScore >= scoreThreshold;

    // Compute the commitment (same algorithm as circuit)
    const commitment = computeCommitment(actualScore, userAddressHash, salt);

    // Simulate proof generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!canProve) {
        throw new Error(`Score ${actualScore} is below threshold ${scoreThreshold}`);
    }

    // Generate mock proof bytes
    // In production, this would be the actual ZK proof
    const proofData = encodePacked(
        ['bytes32', 'uint256', 'bytes32', 'uint256'],
        [commitment, BigInt(scoreThreshold), userAddressHash, salt]
    );

    const proofHash = keccak256(proofData);

    // Create mock proof (would be actual circuit proof in production)
    const mockProof = keccak256(
        encodePacked(
            ['bytes32', 'bytes32', 'uint256'],
            [proofHash, commitment, BigInt(Date.now())]
        )
    );

    return {
        proof: mockProof,
        publicInputs: {
            scoreThreshold,
            commitment,
        },
        proofHash,
        generatedAt: Date.now(),
        canProve,
    };
}

/**
 * Verify a GhostScore proof locally (before submitting to chain)
 * 
 * Note: Final verification happens on-chain in the verifier contract
 */
export function verifyProofLocally(proof: GhostScoreProof): boolean {
    // Basic validation
    if (!proof.proof || !proof.publicInputs.commitment) {
        return false;
    }

    // Check proof is recent (within 1 hour)
    const oneHour = 60 * 60 * 1000;
    if (Date.now() - proof.generatedAt > oneHour) {
        return false;
    }

    return proof.canProve;
}

/**
 * Format proof for on-chain submission
 * The contract expects:
 * - proof: bytes (the ZK proof)
 * - publicInputs: bytes32[] with [scoreThreshold as bytes32, commitment]
 */
export function formatProofForContract(proof: GhostScoreProof): {
    proof: `0x${string}`;
    publicInputs: readonly [`0x${string}`, `0x${string}`];
} {
    // Convert scoreThreshold to bytes32
    const thresholdBytes32 = `0x${proof.publicInputs.scoreThreshold.toString(16).padStart(64, '0')}` as `0x${string}`;

    return {
        proof: proof.proof,
        publicInputs: [thresholdBytes32, proof.publicInputs.commitment] as const,
    };
}

/**
 * Export proof as JSON for storage/sharing
 */
export function exportProof(proof: GhostScoreProof): string {
    return JSON.stringify({
        proof: proof.proof,
        publicInputs: proof.publicInputs,
        proofHash: proof.proofHash,
        generatedAt: proof.generatedAt,
    });
}

/**
 * Import proof from JSON
 */
export function importProof(json: string): GhostScoreProof {
    const data = JSON.parse(json);
    return {
        proof: data.proof,
        publicInputs: data.publicInputs,
        proofHash: data.proofHash,
        generatedAt: data.generatedAt,
        canProve: true, // Assume valid if we're importing
    };
}
