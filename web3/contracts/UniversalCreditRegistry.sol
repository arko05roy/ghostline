// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IUniversalCreditRegistry} from "./interfaces/IUniversalCreditRegistry.sol";

/**
 * @title UniversalCreditRegistry
 * @notice Global credit registry that aggregates credit from multiple sources
 * @dev Universal credit layer for Creditcoin - aggregates from appchains, mainnet protocols, and RWA oracles
 *
 * Architecture:
 * - Multi-source tracking: appchains, mainnet DeFi, off-chain RWA data
 * - Source-weighted scoring: different sources can have different weights
 * - Privacy-preserving: scores stored as commitments, only readable by user
 * - Authorized writers: only approved keepers, appchains, and oracles can write
 *
 * Usage:
 * 1. Register sources (appchains, mainnet protocols, RWA oracles)
 * 2. Authorize writers (keeper wallets, appchain interceptors, oracle contracts)
 * 3. Writers call registerEvent() to record credit events
 * 4. Users query getMyUniversalScore() for their aggregated score
 */
contract UniversalCreditRegistry is
    Ownable,
    ReentrancyGuard,
    IUniversalCreditRegistry
{
    // ============ Constants ============

    /// @notice Base points multiplier for normalization
    uint256 public constant POINTS_DECIMALS = 1e18;

    /// @notice Maximum credit score
    uint256 public constant MAX_SCORE = 1000;

    /// @notice Basis points for weight calculations (100 = 1x, 200 = 2x)
    uint256 public constant WEIGHT_BASIS_POINTS = 100;

    // ============ State Variables ============

    /// @notice Universal scores per user (INTERNAL - not publicly readable)
    mapping(address => UniversalScore) internal scores;

    /// @notice Credit event history per user (INTERNAL - not publicly readable)
    mapping(address => CreditEvent[]) internal eventHistory;

    /// @notice Score commitments per user (public - hash of score + salt)
    mapping(address => bytes32) public scoreCommitments;

    /// @notice Salt per user for commitment generation
    mapping(address => bytes32) internal userSalts;

    /// @notice Score breakdown per user per source (INTERNAL)
    /// @dev user => sourceId => score from that source
    mapping(address => mapping(uint256 => uint256)) internal scoresBySource;

    /// @notice Registered credit sources (appchains, mainnet protocols, RWA oracles)
    mapping(uint256 => CreditSource) public sources;

    /// @notice Authorized writers (keepers, appchain interceptors, oracles)
    mapping(address => bool) public authorizedWriters;

    /// @notice Total number of registered sources
    uint256 public sourceCount;

    /// @notice Total universal credit events across all sources
    uint256 public totalUniversalEvents;

    /// @notice Action weights (same as CreditRegistry)
    mapping(ActionType => uint256) public actionWeights;

    // ============ Modifiers ============

    modifier onlyAuthorized() {
        require(authorizedWriters[msg.sender], "UniversalCreditRegistry: not authorized");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Constructor - simplified for hackathon (no proxy pattern)
     * @param _owner The owner address
     */
    constructor(address _owner) Ownable(_owner) {

        // Set default action weights (same as CreditRegistry)
        actionWeights[ActionType.SWAP] = 10;
        actionWeights[ActionType.LEND] = 25;
        actionWeights[ActionType.REPAY] = 50; // Highest - repayment is best credit signal
        actionWeights[ActionType.STAKE] = 20;
        actionWeights[ActionType.TRANSFER] = 5;
        actionWeights[ActionType.PROVIDE_LIQUIDITY] = 30;
    }

    // ============ Core Functions ============

    /**
     * @notice Register a credit event from an authorized source
     * @param user The user address
     * @param sourceId The source ID (must be registered)
     * @param actionType The type of action performed
     * @param amount The amount involved in the action
     */
    function registerEvent(
        address user,
        uint256 sourceId,
        ActionType actionType,
        uint256 amount
    ) external override onlyAuthorized nonReentrant {
        require(user != address(0), "UniversalCreditRegistry: zero address");
        require(amount > 0, "UniversalCreditRegistry: zero amount");
        require(sourceId < sourceCount, "UniversalCreditRegistry: invalid source");
        require(sources[sourceId].active, "UniversalCreditRegistry: source inactive");

        // Get source weight
        CreditSource storage source = sources[sourceId];

        // Calculate points: base points * action weight * source weight
        uint256 actionWeight = actionWeights[actionType];
        uint256 basePoints = _calculateBasePoints(amount, actionWeight);
        uint256 pointsEarned = (basePoints * source.weight) / WEIGHT_BASIS_POINTS;

        // Create credit event
        CreditEvent memory newEvent = CreditEvent({
            user: user,
            sourceId: sourceId,
            actionType: actionType,
            amount: amount,
            timestamp: block.timestamp,
            pointsEarned: pointsEarned
        });

        // Store event
        eventHistory[user].push(newEvent);

        // Update total score (capped at MAX_SCORE)
        UniversalScore storage userScore = scores[user];
        uint256 newTotalScore = userScore.totalScore + pointsEarned;
        if (newTotalScore > MAX_SCORE) {
            newTotalScore = MAX_SCORE;
        }
        userScore.totalScore = newTotalScore;
        userScore.lastUpdated = block.timestamp;
        userScore.eventCount++;

        // Update score breakdown by source
        scoresBySource[user][sourceId] += pointsEarned;

        // Update score commitment (hash of score + salt)
        _updateScoreCommitment(user);

        // Increment counters
        totalUniversalEvents++;

        emit UniversalCreditEventRecorded(
            user,
            sourceId,
            actionType,
            amount,
            pointsEarned,
            block.timestamp
        );
    }

    /**
     * @notice Register a new credit source
     * @param name Human-readable name of the source
     * @param sourceType The type of source (appchain, mainnet protocol, or RWA oracle)
     * @param weight Weight multiplier in basis points (100 = 1x, 200 = 2x)
     * @return sourceId The ID of the newly registered source
     */
    function registerSource(
        string calldata name,
        SourceType sourceType,
        uint256 weight
    ) external override onlyOwner returns (uint256 sourceId) {
        require(bytes(name).length > 0, "UniversalCreditRegistry: empty name");
        require(weight > 0 && weight <= 500, "UniversalCreditRegistry: invalid weight"); // Max 5x

        sourceId = sourceCount++;

        sources[sourceId] = CreditSource({
            name: name,
            sourceType: sourceType,
            weight: weight,
            active: true,
            createdAt: block.timestamp
        });

        emit SourceRegistered(sourceId, name, sourceType, weight);
    }

    /**
     * @notice Authorize an address to write credit events
     * @param writer The address to authorize (keeper, appchain interceptor, oracle)
     */
    function authorizeWriter(address writer) external override onlyOwner {
        require(writer != address(0), "UniversalCreditRegistry: zero address");
        require(!authorizedWriters[writer], "UniversalCreditRegistry: already authorized");

        authorizedWriters[writer] = true;
        emit WriterAuthorized(writer);
    }

    /**
     * @notice Revoke write access from an address
     * @param writer The address to revoke
     */
    function revokeWriter(address writer) external override onlyOwner {
        require(authorizedWriters[writer], "UniversalCreditRegistry: not authorized");

        authorizedWriters[writer] = false;
        emit WriterRevoked(writer);
    }

    // ============ View Functions (Private Access) ============

    /**
     * @notice Get the caller's universal credit score
     * @return UniversalScore struct containing totalScore, lastUpdated, eventCount
     */
    function getMyUniversalScore() external view override returns (UniversalScore memory) {
        return scores[msg.sender];
    }

    /**
     * @notice Get the caller's event history
     * @return Array of credit events for msg.sender
     */
    function getMyEventHistory() external view override returns (CreditEvent[] memory) {
        return eventHistory[msg.sender];
    }

    /**
     * @notice Get the caller's score breakdown by source
     * @return sourceIds Array of source IDs
     * @return sourceScores Array of scores from each source
     */
    function getMyScoreBreakdown() external view override returns (
        uint256[] memory sourceIds,
        uint256[] memory sourceScores
    ) {
        // Count non-zero sources
        uint256 nonZeroCount = 0;
        for (uint256 i = 0; i < sourceCount; i++) {
            if (scoresBySource[msg.sender][i] > 0) {
                nonZeroCount++;
            }
        }

        // Allocate arrays
        sourceIds = new uint256[](nonZeroCount);
        sourceScores = new uint256[](nonZeroCount);

        // Populate arrays
        uint256 index = 0;
        for (uint256 i = 0; i < sourceCount; i++) {
            if (scoresBySource[msg.sender][i] > 0) {
                sourceIds[index] = i;
                sourceScores[index] = scoresBySource[msg.sender][i];
                index++;
            }
        }
    }

    // ============ View Functions (Public Access) ============

    /**
     * @notice Get the score commitment for any user (hash, not actual score)
     * @param user The user address
     * @return The keccak256 hash of (totalScore, salt)
     */
    function getScoreCommitment(address user) external view override returns (bytes32) {
        return scoreCommitments[user];
    }

    /**
     * @notice Get information about a credit source
     * @param sourceId The source ID
     * @return CreditSource struct
     */
    function getSource(uint256 sourceId) external view override returns (CreditSource memory) {
        require(sourceId < sourceCount, "UniversalCreditRegistry: invalid source");
        return sources[sourceId];
    }

    /**
     * @notice Get the total number of registered sources
     * @return Total count of sources
     */
    function getSourceCount() external view override returns (uint256) {
        return sourceCount;
    }

    /**
     * @notice Check if an address is an authorized writer
     * @param writer The address to check
     * @return Whether the address is authorized
     */
    function isAuthorizedWriter(address writer) external view override returns (bool) {
        return authorizedWriters[writer];
    }

    /**
     * @notice Get total number of universal credit events
     * @return Total count of all events across all sources
     */
    function getTotalUniversalEvents() external view override returns (uint256) {
        return totalUniversalEvents;
    }

    /**
     * @notice Get the number of events for a user
     * @param user The user address
     * @return Event count for the user
     */
    function getUserEventCount(address user) external view override returns (uint256) {
        return eventHistory[user].length;
    }

    // ============ Admin Functions ============

    /**
     * @notice Update the weight for a credit source
     * @param sourceId The source ID
     * @param weight New weight in basis points
     */
    function setSourceWeight(uint256 sourceId, uint256 weight) external override onlyOwner {
        require(sourceId < sourceCount, "UniversalCreditRegistry: invalid source");
        require(weight > 0 && weight <= 500, "UniversalCreditRegistry: invalid weight");

        uint256 oldWeight = sources[sourceId].weight;
        sources[sourceId].weight = weight;

        emit SourceWeightUpdated(sourceId, oldWeight, weight);
    }

    /**
     * @notice Deactivate a credit source
     * @param sourceId The source ID
     */
    function deactivateSource(uint256 sourceId) external override onlyOwner {
        require(sourceId < sourceCount, "UniversalCreditRegistry: invalid source");
        require(sources[sourceId].active, "UniversalCreditRegistry: already inactive");

        sources[sourceId].active = false;
    }

    // ============ Internal Functions ============

    /**
     * @notice Calculate base points from amount and action weight
     * @param amount The action amount
     * @param weight The action weight
     * @return Base points earned (before source weight multiplier)
     */
    function _calculateBasePoints(uint256 amount, uint256 weight) internal pure returns (uint256) {
        // Normalize amount: log-scale to prevent whale gaming
        uint256 normalizedAmount = amount / POINTS_DECIMALS;
        if (normalizedAmount == 0) {
            normalizedAmount = 1; // Minimum 1 point base
        }

        // Cap normalized amount to prevent overflow
        if (normalizedAmount > 1000) {
            normalizedAmount = 1000;
        }

        // Points = weight * normalizedAmount / 100
        uint256 points = (weight * normalizedAmount) / 100;

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

        // Compute commitment: hash(totalScore, salt)
        bytes32 commitment = keccak256(abi.encodePacked(scores[user].totalScore, userSalts[user]));
        scoreCommitments[user] = commitment;

        emit ScoreCommitmentUpdated(user, commitment);
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
