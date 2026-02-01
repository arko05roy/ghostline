// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ICrossChainBridge
 * @notice Interface for cross-appchain score portability
 * @dev Allows users to port credit scores between appchains with weight adjustments
 */
interface ICrossChainBridge {
    // ============ Structs ============

    struct ScoreExport {
        uint256 fromChainId;
        address user;
        uint256 scoreThreshold;
        bytes proof;
        uint256 timestamp;
        bytes32 exportHash;
    }

    // ============ Events ============

    event ScoreExported(
        uint256 indexed fromChainId,
        address indexed user,
        uint256 scoreThreshold,
        bytes32 exportHash
    );

    event ScoreImported(
        uint256 indexed fromChainId,
        uint256 indexed toChainId,
        address indexed user,
        uint256 adjustedScore
    );

    event BridgeWeightUpdated(
        uint256 indexed fromChainId,
        uint256 indexed toChainId,
        uint256 weightBps
    );

    // ============ Functions ============

    /**
     * @notice Export a credit score from source appchain
     * @param fromChainId The source appchain ID
     * @return export The export struct with proof data
     */
    function exportScore(uint256 fromChainId) external returns (ScoreExport memory export);

    /**
     * @notice Import a credit score to destination appchain
     * @param toChainId The destination appchain ID
     * @param exportData The score export data
     * @return success Whether import succeeded
     */
    function importScore(
        uint256 toChainId,
        ScoreExport calldata exportData
    ) external returns (bool success);

    /**
     * @notice Set bridge weight between appchains
     * @param fromChainId Source appchain
     * @param toChainId Destination appchain
     * @param weightBps Weight in basis points (e.g., 7000 = 70%)
     */
    function setBridgeWeight(
        uint256 fromChainId,
        uint256 toChainId,
        uint256 weightBps
    ) external;

    /**
     * @notice Get bridge weight between appchains
     * @param fromChainId Source appchain
     * @param toChainId Destination appchain
     * @return weightBps Weight in basis points
     */
    function getBridgeWeight(
        uint256 fromChainId,
        uint256 toChainId
    ) external view returns (uint256 weightBps);

    /**
     * @notice Check if an export has been processed
     * @param exportHash The export hash
     * @return Whether it's been processed
     */
    function isExportProcessed(bytes32 exportHash) external view returns (bool);

    /**
     * @notice Initialize the contract
     * @param owner The owner address
     * @param factory The CreditChainFactory address
     */
    function initialize(address owner, address factory) external;
}
