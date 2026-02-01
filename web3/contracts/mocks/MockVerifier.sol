// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title MockVerifier
 * @notice Mock ZK verifier for testing (mimics Noir UltraVerifier interface)
 * @dev Always returns true for testing purposes
 */
contract MockVerifier {
    /// @notice Whether to return true or false for proofs
    bool public shouldPass = true;

    /// @notice Mapping of allowed proofs (for selective passing)
    mapping(bytes32 => bool) public allowedProofs;

    event ProofVerified(bytes32 proofHash, bool result);

    /**
     * @notice Verify a proof (mock implementation)
     * @param _proof The proof bytes
     * @param _publicInputs The public inputs
     * @return Whether the proof is valid
     */
    function verify(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs
    ) external view returns (bool) {
        // In mock mode, just return the configured result
        if (shouldPass) {
            return true;
        }

        // Check if this specific proof is allowed
        bytes32 proofHash = keccak256(abi.encodePacked(_proof, _publicInputs));
        return allowedProofs[proofHash];
    }

    /**
     * @notice Set whether all proofs should pass
     * @param _shouldPass Whether to pass all proofs
     */
    function setShouldPass(bool _shouldPass) external {
        shouldPass = _shouldPass;
    }

    /**
     * @notice Allow a specific proof
     * @param proofHash The proof hash to allow
     */
    function allowProof(bytes32 proofHash) external {
        allowedProofs[proofHash] = true;
    }

    /**
     * @notice Disallow a specific proof
     * @param proofHash The proof hash to disallow
     */
    function disallowProof(bytes32 proofHash) external {
        allowedProofs[proofHash] = false;
    }

    /**
     * @notice Calculate proof hash (helper for testing)
     * @param _proof The proof bytes
     * @param _publicInputs The public inputs
     * @return The proof hash
     */
    function getProofHash(
        bytes calldata _proof,
        bytes32[] calldata _publicInputs
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(_proof, _publicInputs));
    }
}
