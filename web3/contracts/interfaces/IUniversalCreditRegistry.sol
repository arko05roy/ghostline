// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICreditRegistry} from "./ICreditRegistry.sol";

/**
 * @title IUniversalCreditRegistry
 * @notice Interface for the Universal Credit Registry - aggregates credit from multiple sources
 * @dev Extends ICreditRegistry with multi-source support
 */
interface IUniversalCreditRegistry {
    // ============ Enums ============

    enum ActionType {
        SWAP,
        LEND,
        REPAY,
        STAKE,
        TRANSFER,
        PROVIDE_LIQUIDITY
    }

    enum SourceType {
        APPCHAIN,           // Credit from factory-deployed appchains
        MAINNET_PROTOCOL,   // Credit from Creditcoin mainnet DeFi protocols
        RWA_ORACLE          // Credit from off-chain RWA data via oracles
    }

    // ============ Structs ============

    struct UniversalScore {
        uint256 totalScore;
        uint256 lastUpdated;
        uint256 eventCount;
    }

    struct CreditEvent {
        address user;
        uint256 sourceId;
        ActionType actionType;
        uint256 amount;
        uint256 timestamp;
        uint256 pointsEarned;
    }

    struct CreditSource {
        string name;
        SourceType sourceType;
        uint256 weight;         // Weight multiplier in basis points (100 = 1x, 200 = 2x)
        bool active;
        uint256 createdAt;
    }

    // ============ Events ============

    event UniversalCreditEventRecorded(
        address indexed user,
        uint256 indexed sourceId,
        ActionType indexed actionType,
        uint256 amount,
        uint256 pointsEarned,
        uint256 timestamp
    );

    event SourceRegistered(
        uint256 indexed sourceId,
        string name,
        SourceType sourceType,
        uint256 weight
    );

    event SourceWeightUpdated(
        uint256 indexed sourceId,
        uint256 oldWeight,
        uint256 newWeight
    );

    event WriterAuthorized(address indexed writer);
    event WriterRevoked(address indexed writer);

    event ScoreCommitmentUpdated(address indexed user, bytes32 commitment);

    // ============ Core Functions ============

    /**
     * @notice Register a credit event from an authorized source
     * @param user The user address
     * @param sourceId The source ID (appchain, mainnet protocol, or RWA oracle)
     * @param actionType The type of action performed
     * @param amount The amount involved in the action
     */
    function registerEvent(
        address user,
        uint256 sourceId,
        ActionType actionType,
        uint256 amount
    ) external;

    /**
     * @notice Register a new credit source (appchain, mainnet protocol, or RWA oracle)
     * @param name Human-readable name of the source
     * @param sourceType The type of source
     * @param weight Weight multiplier in basis points (100 = 1x)
     * @return sourceId The ID of the newly registered source
     */
    function registerSource(
        string calldata name,
        SourceType sourceType,
        uint256 weight
    ) external returns (uint256 sourceId);

    /**
     * @notice Authorize an address to write credit events
     * @param writer The address to authorize (keeper, appchain interceptor, oracle)
     */
    function authorizeWriter(address writer) external;

    /**
     * @notice Revoke write access from an address
     * @param writer The address to revoke
     */
    function revokeWriter(address writer) external;

    // ============ View Functions (Private Access) ============

    /**
     * @notice Get the caller's universal credit score
     * @return UniversalScore struct containing totalScore, lastUpdated, eventCount
     */
    function getMyUniversalScore() external view returns (UniversalScore memory);

    /**
     * @notice Get the caller's event history
     * @return Array of credit events for msg.sender
     */
    function getMyEventHistory() external view returns (CreditEvent[] memory);

    /**
     * @notice Get the caller's score breakdown by source
     * @return sourceIds Array of source IDs
     * @return scores Array of scores from each source
     */
    function getMyScoreBreakdown() external view returns (
        uint256[] memory sourceIds,
        uint256[] memory scores
    );

    // ============ View Functions (Public Access) ============

    /**
     * @notice Get the score commitment for any user (hash, not actual score)
     * @param user The user address
     * @return The keccak256 hash of (totalScore, salt)
     */
    function getScoreCommitment(address user) external view returns (bytes32);

    /**
     * @notice Get information about a credit source
     * @param sourceId The source ID
     * @return CreditSource struct
     */
    function getSource(uint256 sourceId) external view returns (CreditSource memory);

    /**
     * @notice Get the total number of registered sources
     * @return Total count of sources
     */
    function getSourceCount() external view returns (uint256);

    /**
     * @notice Check if an address is an authorized writer
     * @param writer The address to check
     * @return Whether the address is authorized
     */
    function isAuthorizedWriter(address writer) external view returns (bool);

    /**
     * @notice Get total number of universal credit events
     * @return Total count of all events across all sources
     */
    function getTotalUniversalEvents() external view returns (uint256);

    /**
     * @notice Get the number of events for a user
     * @param user The user address
     * @return Event count for the user
     */
    function getUserEventCount(address user) external view returns (uint256);

    // ============ Admin Functions ============

    /**
     * @notice Update the weight for a credit source
     * @param sourceId The source ID
     * @param weight New weight in basis points
     */
    function setSourceWeight(uint256 sourceId, uint256 weight) external;

    /**
     * @notice Deactivate a credit source
     * @param sourceId The source ID
     */
    function deactivateSource(uint256 sourceId) external;

}
