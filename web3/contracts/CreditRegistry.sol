// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ICreditRegistry} from "./interfaces/ICreditRegistry.sol";

/**
 * @title CreditRegistry
 * @notice Central registry for CreditNet Protocol - stores credit events and computes scores privately
 * @dev Scores are stored internally and only accessible by the user themselves
 * 
 * Privacy Design:
 * - creditScores mapping is internal, not public
 * - Only msg.sender can read their own score via getMyScore()
 * - Public data is limited to: score commitments (hashes), merkle root, event counts
 * - This makes ZK proofs meaningful: proving "score >= X" without revealing actual score
 */
contract CreditRegistry is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    ICreditRegistry 
{
    // ============ Constants ============

    /// @notice Base points multiplier for normalization
    uint256 public constant POINTS_DECIMALS = 1e18;
    
    /// @notice Maximum credit score
    uint256 public constant MAX_SCORE = 1000;

    // ============ State Variables ============

    /// @notice Credit history per user (INTERNAL - not publicly readable)
    mapping(address => CreditEvent[]) internal creditHistory;

    /// @notice Credit scores per user (INTERNAL - not publicly readable)
    mapping(address => uint256) internal creditScores;

    /// @notice Score commitments per user (public - hash of score + salt)
    mapping(address => bytes32) public scoreCommitments;

    /// @notice Salt per user for commitment generation
    mapping(address => bytes32) internal userSalts;

    /// @notice Merkle root of all credit events for ZK proofs
    bytes32 public registryMerkleRoot;

    /// @notice Weight multipliers per action type
    mapping(ActionType => uint256) public actionWeights;

    /// @notice Total credit events across all users
    uint256 public totalCreditEvents;

    /// @notice Authorized interceptor contract
    address public interceptor;

    /// @notice Nonce for merkle root updates
    uint256 private _merkleNonce;

    // ============ Modifiers ============

    modifier onlyInterceptor() {
        require(msg.sender == interceptor, "CreditRegistry: caller is not interceptor");
        _;
    }

    // ============ Constructor ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============

    /**
     * @notice Initialize the contract (for proxy pattern)
     * @param _owner The owner address
     * @param defaultWeights Array of default weights for each action type [SWAP, LEND, REPAY, STAKE, TRANSFER, PROVIDE_LIQUIDITY]
     */
    function initialize(
        address _owner, 
        uint256[] calldata defaultWeights
    ) external initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();

        // Set default weights if provided
        if (defaultWeights.length >= 6) {
            actionWeights[ActionType.SWAP] = defaultWeights[0];
            actionWeights[ActionType.LEND] = defaultWeights[1];
            actionWeights[ActionType.REPAY] = defaultWeights[2];
            actionWeights[ActionType.STAKE] = defaultWeights[3];
            actionWeights[ActionType.TRANSFER] = defaultWeights[4];
            actionWeights[ActionType.PROVIDE_LIQUIDITY] = defaultWeights[5];
        } else {
            // Default weights: REPAY highest (builds credit fast)
            actionWeights[ActionType.SWAP] = 10;
            actionWeights[ActionType.LEND] = 25;
            actionWeights[ActionType.REPAY] = 50; // Highest - repayment is best credit signal
            actionWeights[ActionType.STAKE] = 20;
            actionWeights[ActionType.TRANSFER] = 5;
            actionWeights[ActionType.PROVIDE_LIQUIDITY] = 30;
        }

        // Initialize merkle root
        registryMerkleRoot = keccak256(abi.encodePacked(block.chainid, address(this)));
    }

    // ============ Core Functions ============

    /**
     * @notice Registers a new credit event for a user
     * @param user The user address
     * @param actionType The type of action performed
     * @param amount The amount involved in the action
     */
    function registerCreditEvent(
        address user,
        ActionType actionType,
        uint256 amount
    ) external override onlyInterceptor nonReentrant {
        require(user != address(0), "CreditRegistry: zero address");
        require(amount > 0, "CreditRegistry: zero amount");

        // Calculate points earned based on weight and normalized amount
        uint256 weight = actionWeights[actionType];
        uint256 pointsEarned = _calculatePoints(amount, weight);

        // Create credit event
        CreditEvent memory newEvent = CreditEvent({
            user: user,
            actionType: actionType,
            amount: amount,
            timestamp: block.timestamp,
            pointsEarned: pointsEarned
        });

        // Store event
        creditHistory[user].push(newEvent);

        // Update credit score (capped at MAX_SCORE)
        uint256 newScore = creditScores[user] + pointsEarned;
        if (newScore > MAX_SCORE) {
            newScore = MAX_SCORE;
        }
        creditScores[user] = newScore;

        // Update score commitment (hash of score + salt)
        _updateScoreCommitment(user);

        // Update merkle root
        _updateMerkleRoot(user, newEvent);

        // Increment counters
        totalCreditEvents++;

        emit CreditEventRecorded(user, actionType, amount, pointsEarned, block.timestamp);
    }

    // ============ View Functions (Private Access) ============

    /**
     * @notice Get the caller's own credit score
     * @return The credit score of msg.sender
     */
    function getMyScore() external view override returns (uint256) {
        return creditScores[msg.sender];
    }

    /**
     * @notice Get the caller's own credit history
     * @return Array of credit events for msg.sender
     */
    function getMyCreditHistory() external view override returns (CreditEvent[] memory) {
        return creditHistory[msg.sender];
    }

    // ============ View Functions (Public Access) ============

    /**
     * @notice Get the score commitment for any user
     * @param user The user address
     * @return The keccak256 hash of (score, salt)
     */
    function getScoreCommitment(address user) external view override returns (bytes32) {
        return scoreCommitments[user];
    }

    /**
     * @notice Get the number of credit events for a user
     * @param user The user address
     * @return The count of credit events
     */
    function getCreditEventCount(address user) external view override returns (uint256) {
        return creditHistory[user].length;
    }

    /**
     * @notice Get the merkle root of all credit events
     * @return The current registry merkle root
     */
    function getRegistryMerkleRoot() external view override returns (bytes32) {
        return registryMerkleRoot;
    }

    /**
     * @notice Get the weight for a specific action type
     * @param actionType The action type
     * @return The weight multiplier for the action
     */
    function getActionWeight(ActionType actionType) external view override returns (uint256) {
        return actionWeights[actionType];
    }

    /**
     * @notice Get total number of credit events in the registry
     * @return Total count of all credit events
     */
    function getTotalCreditEvents() external view override returns (uint256) {
        return totalCreditEvents;
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the weight for an action type
     * @param actionType The action type to configure
     * @param weight The weight multiplier
     */
    function setActionWeight(ActionType actionType, uint256 weight) external override onlyOwner {
        require(weight > 0 && weight <= 100, "CreditRegistry: invalid weight");
        actionWeights[actionType] = weight;
        emit ActionWeightUpdated(actionType, weight);
    }

    /**
     * @notice Set the authorized interceptor address
     * @param _interceptor The new interceptor address
     */
    function setInterceptor(address _interceptor) external override onlyOwner {
        require(_interceptor != address(0), "CreditRegistry: zero address");
        address oldInterceptor = interceptor;
        interceptor = _interceptor;
        emit InterceptorUpdated(oldInterceptor, _interceptor);
    }

    // ============ Internal Functions ============

    /**
     * @notice Calculate points from amount and weight
     * @param amount The action amount
     * @param weight The action weight
     * @return Normalized points earned
     */
    function _calculatePoints(uint256 amount, uint256 weight) internal pure returns (uint256) {
        // Normalize amount: convert wei to whole tokens
        // Points = weight * amount_in_tokens
        uint256 normalizedAmount = amount / POINTS_DECIMALS;
        if (normalizedAmount == 0) {
            normalizedAmount = 1; // Minimum 1 token for calculation
        }

        // Cap normalized amount to prevent overflow
        if (normalizedAmount > 1000) {
            normalizedAmount = 1000;
        }

        // Points = weight * normalizedAmount (no division!)
        // This gives proper scores: weight directly scales with token amount
        uint256 points = weight * normalizedAmount;

        // Minimum 1 point for any valid action
        if (points == 0) {
            points = 1;
        }

        return points;
    }

    /**
     * @notice Update score commitment for a user
     * @param user The user address
     */
    function _updateScoreCommitment(address user) internal {
        // Generate or retrieve salt
        if (userSalts[user] == bytes32(0)) {
            userSalts[user] = keccak256(abi.encodePacked(user, block.timestamp, block.prevrandao));
        }

        // Compute commitment: hash(score, salt)
        bytes32 commitment = keccak256(abi.encodePacked(creditScores[user], userSalts[user]));
        scoreCommitments[user] = commitment;

        emit ScoreCommitmentUpdated(user, commitment);
    }

    /**
     * @notice Update merkle root after new event
     * @param user The user address
     * @param creditEvent The new credit event
     */
    function _updateMerkleRoot(address user, CreditEvent memory creditEvent) internal {
        // Simplified merkle update: chain hash of events
        // Full merkle tree implementation can be added for production
        registryMerkleRoot = keccak256(abi.encodePacked(
            registryMerkleRoot,
            user,
            uint8(creditEvent.actionType),
            creditEvent.amount,
            creditEvent.timestamp,
            _merkleNonce++
        ));
    }

    // ============ Helper Functions for ZK Proofs ============

    /**
     * @notice Get salt for a user (only callable by the user themselves)
     * @return The user's salt for commitment verification
     */
    function getMySalt() external view returns (bytes32) {
        return userSalts[msg.sender];
    }

    /**
     * @notice Verify a score commitment matches expected values
     * @param user The user address
     * @param score The claimed score
     * @param salt The claimed salt
     * @return Whether the commitment is valid
     */
    function verifyCommitment(
        address user,
        uint256 score,
        bytes32 salt
    ) external view returns (bool) {
        bytes32 expectedCommitment = keccak256(abi.encodePacked(score, salt));
        return scoreCommitments[user] == expectedCommitment;
    }
}
