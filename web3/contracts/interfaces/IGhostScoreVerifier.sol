// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IGhostScoreVerifier
 * @notice Interface for the GhostScore ZK proof verifier
 * @dev Wraps Noir-generated UltraVerifier and stores attestations
 */
interface IGhostScoreVerifier {
    // ============ Structs ============

    struct GhostScoreAttestation {
        uint256 scoreThreshold;    // The minimum score proven
        uint256 timestamp;         // When the attestation was created
        bool valid;                // Whether attestation is still valid
    }

    // ============ Events ============

    event GhostScoreVerified(
        bytes32 indexed userCommitment,
        uint256 scoreThreshold,
        uint256 timestamp
    );

    event AttestationInvalidated(
        address indexed user,
        uint256 indexed attestationIndex
    );

    event VerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    // ============ Functions ============

    /**
     * @notice Verify a GhostScore proof and create attestation
     * @param proof The ZK proof bytes
     * @param publicInputs Public inputs [scoreThreshold, userCommitment]
     * @return success Whether verification succeeded
     */
    function verifyAndAttest(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external returns (bool success);

    /**
     * @notice Get an attestation for a user
     * @param user The user address
     * @param index The attestation index
     * @return The attestation struct
     */
    function getAttestation(
        address user,
        uint256 index
    ) external view returns (GhostScoreAttestation memory);

    /**
     * @notice Check if user has valid attestation above threshold
     * @param user The user address
     * @param minThreshold The minimum score threshold
     * @return Whether user has valid attestation
     */
    function hasValidAttestation(
        address user,
        uint256 minThreshold
    ) external view returns (bool);

    /**
     * @notice Get the number of attestations for a user
     * @param user The user address
     * @return The attestation count
     */
    function getAttestationCount(address user) external view returns (uint256);

    /**
     * @notice Invalidate an attestation (user can self-invalidate)
     * @param index The attestation index to invalidate
     */
    function invalidateAttestation(uint256 index) external;

    /**
     * @notice Set the UltraVerifier contract address
     * @param verifier The verifier address
     */
    function setVerifier(address verifier) external;

    /**
     * @notice Initialize the contract (for proxy pattern)
     * @param owner The owner address
     * @param verifier The UltraVerifier address (optional, can be zero for mock mode)
     */
    function initialize(address owner, address verifier) external;
}
