// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ICreditRegistry
 * @notice Interface for the CreditRegistry contract - central registry for credit events and scores
 * @dev Scores are stored privately - only the user can read their own score via msg.sender
 */
interface ICreditRegistry {
    // ============ Enums ============

    enum ActionType {
        SWAP,
        LEND,
        REPAY,
        STAKE,
        TRANSFER,
        PROVIDE_LIQUIDITY
    }

    // ============ Structs ============

    struct CreditEvent {
        address user;
        ActionType actionType;
        uint256 amount;
        uint256 timestamp;
        uint256 pointsEarned;
    }

    // ============ Events ============

    event CreditEventRecorded(
        address indexed user,
        ActionType indexed actionType,
        uint256 amount,
        uint256 pointsEarned,
        uint256 timestamp
    );

    event ActionWeightUpdated(ActionType indexed actionType, uint256 newWeight);

    event InterceptorUpdated(address indexed oldInterceptor, address indexed newInterceptor);

    event ScoreCommitmentUpdated(address indexed user, bytes32 commitment);

    // ============ Core Functions ============

    /**
     * @notice Registers a new credit event for a user
     * @param user The user address
     * @param actionType The type of action performed
     * @param amount The amount involved in the action
     * @dev Only callable by the authorized interceptor
     */
    function registerCreditEvent(
        address user,
        ActionType actionType,
        uint256 amount
    ) external;

    // ============ View Functions (Private Access) ============

    /**
     * @notice Get the caller's own credit score
     * @return The credit score of msg.sender
     * @dev Only returns score for msg.sender - privacy by design
     */
    function getMyScore() external view returns (uint256);

    /**
     * @notice Get the caller's own credit history
     * @return Array of credit events for msg.sender
     * @dev Only returns history for msg.sender - privacy by design
     */
    function getMyCreditHistory() external view returns (CreditEvent[] memory);

    // ============ View Functions (Public Access) ============

    /**
     * @notice Get the score commitment for any user (hash, not actual score)
     * @param user The user address
     * @return The keccak256 hash of (score, salt)
     */
    function getScoreCommitment(address user) external view returns (bytes32);

    /**
     * @notice Get the number of credit events for a user
     * @param user The user address
     * @return The count of credit events
     */
    function getCreditEventCount(address user) external view returns (uint256);

    /**
     * @notice Get the merkle root of all credit events
     * @return The current registry merkle root
     */
    function getRegistryMerkleRoot() external view returns (bytes32);

    /**
     * @notice Get the weight for a specific action type
     * @param actionType The action type
     * @return The weight multiplier for the action
     */
    function getActionWeight(ActionType actionType) external view returns (uint256);

    /**
     * @notice Get total number of credit events in the registry
     * @return Total count of all credit events
     */
    function getTotalCreditEvents() external view returns (uint256);

    // ============ Admin Functions ============

    /**
     * @notice Set the weight for an action type
     * @param actionType The action type to configure
     * @param weight The weight multiplier
     * @dev Only callable by owner
     */
    function setActionWeight(ActionType actionType, uint256 weight) external;

    /**
     * @notice Set the authorized interceptor address
     * @param interceptor The new interceptor address
     * @dev Only callable by owner
     */
    function setInterceptor(address interceptor) external;

    /**
     * @notice Initialize the contract (for proxy pattern)
     * @param owner The owner address
     * @param defaultWeights Array of default weights for each action type
     */
    function initialize(address owner, uint256[] calldata defaultWeights) external;
}
