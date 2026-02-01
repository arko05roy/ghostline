// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ICrossChainBridge} from "./interfaces/ICrossChainBridge.sol";
import {ICreditChainFactory} from "./interfaces/ICreditChainFactory.sol";
import {ICreditRegistry} from "./interfaces/ICreditRegistry.sol";
import {IGhostScoreVerifier} from "./interfaces/IGhostScoreVerifier.sol";

/**
 * @title CrossChainBridge
 * @notice Enables credit score portability between CreditNet appchains
 * @dev Users can export their credit score from one appchain and import to another with weight adjustments
 * 
 * Example:
 * 1. User builds credit on "Acme Bank" appchain (score = 500)
 * 2. User exports score via CrossChainBridge
 * 3. User imports score on "LatAm Fintech" appchain (score = 500 * 70% = 350)
 * 4. User can now borrow on LatAm Fintech using imported score
 */
contract CrossChainBridge is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    ICrossChainBridge 
{
    // ============ State Variables ============

    /// @notice CreditChainFactory reference
    ICreditChainFactory public factory;

    /// @notice Bridge weights: fromChainId => toChainId => weightBps
    mapping(uint256 => mapping(uint256 => uint256)) public bridgeWeights;

    /// @notice Processed exports to prevent replay
    mapping(bytes32 => bool) public processedExports;

    /// @notice User exports
    mapping(address => ScoreExport[]) public userExports;

    /// @notice Default bridge weight (70% = 7000 bps)
    uint256 public constant DEFAULT_BRIDGE_WEIGHT = 7000;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ Constructor ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============

    /**
     * @notice Initialize the contract
     * @param _owner The owner address
     * @param _factory The CreditChainFactory address
     */
    function initialize(
        address _owner,
        address _factory
    ) external initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();

        require(_factory != address(0), "CrossChainBridge: zero factory");
        factory = ICreditChainFactory(_factory);
    }

    // ============ Core Functions ============

    /**
     * @notice Export a credit score from source appchain
     * @param fromChainId The source appchain ID
     * @return scoreExport The export struct with proof data
     */
    function exportScore(uint256 fromChainId) external override nonReentrant returns (ScoreExport memory scoreExport) {
        // Verify source appchain exists and is active
        require(factory.isActiveAppChain(fromChainId), "CrossChainBridge: invalid source chain");

        // Get appchain registry
        ICreditChainFactory.AppChain memory sourceChain = factory.getAppChain(fromChainId);
        ICreditRegistry registry = ICreditRegistry(sourceChain.registry);

        // Get user's current score (only works if called by user themselves)
        uint256 userScore = registry.getMyScore();
        require(userScore > 0, "CrossChainBridge: no credit history");

        // Get score commitment for verification
        bytes32 commitment = registry.getScoreCommitment(msg.sender);

        // Generate export hash
        bytes32 exportHash = keccak256(abi.encodePacked(
            fromChainId,
            msg.sender,
            userScore,
            commitment,
            block.timestamp
        ));

        // Create export data
        scoreExport = ScoreExport({
            fromChainId: fromChainId,
            user: msg.sender,
            scoreThreshold: userScore,
            proof: abi.encode(commitment), // Simplified proof for hackathon
            timestamp: block.timestamp,
            exportHash: exportHash
        });

        // Store export
        userExports[msg.sender].push(scoreExport);

        emit ScoreExported(fromChainId, msg.sender, userScore, exportHash);
    }

    /**
     * @notice Import a credit score to destination appchain
     * @param toChainId The destination appchain ID
     * @param exportData The score export data
     * @return success Whether import succeeded
     */
    function importScore(
        uint256 toChainId,
        ScoreExport calldata exportData
    ) external override nonReentrant returns (bool success) {
        // Verify caller is the export owner
        require(exportData.user == msg.sender, "CrossChainBridge: not owner");

        // Verify export hasn't been used
        require(!processedExports[exportData.exportHash], "CrossChainBridge: already processed");

        // Verify destination appchain exists and is active
        require(factory.isActiveAppChain(toChainId), "CrossChainBridge: invalid dest chain");

        // Get both appchains
        ICreditChainFactory.AppChain memory sourceChain = factory.getAppChain(exportData.fromChainId);
        ICreditChainFactory.AppChain memory destChain = factory.getAppChain(toChainId);

        // Verify both chains allow cross-chain scores
        require(sourceChain.allowCrossChainScores, "CrossChainBridge: source not enabled");
        require(destChain.allowCrossChainScores, "CrossChainBridge: dest not enabled");

        // Verify the proof (simplified for hackathon - just check commitment exists)
        bytes32 commitment = abi.decode(exportData.proof, (bytes32));
        bytes32 storedCommitment = ICreditRegistry(sourceChain.registry).getScoreCommitment(msg.sender);
        require(commitment == storedCommitment, "CrossChainBridge: invalid proof");

        // Get bridge weight for this route
        uint256 weight = getBridgeWeight(exportData.fromChainId, toChainId);

        // Calculate adjusted score
        uint256 adjustedScore = (exportData.scoreThreshold * weight) / BPS_DENOMINATOR;

        // Mark as processed
        processedExports[exportData.exportHash] = true;

        // Create credit event on destination chain
        // Note: We register a special "import" event that credits the adjusted score
        // For hackathon simplicity, we'll use the TRANSFER action type since it's lowest weight
        // In production, we'd add a specific IMPORT action type
        // ICreditRegistry destRegistry = ICreditRegistry(destChain.registry);
        
        // The actual credit event would need to be done through the interceptor
        // For this demo, we emit the event and the frontend handles the display
        // Full implementation would require modifying the registry to accept imports

        emit ScoreImported(exportData.fromChainId, toChainId, msg.sender, adjustedScore);

        return true;
    }

    // ============ Admin Functions ============

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
    ) external override onlyOwner {
        require(weightBps <= BPS_DENOMINATOR, "CrossChainBridge: weight too high");
        bridgeWeights[fromChainId][toChainId] = weightBps;
        emit BridgeWeightUpdated(fromChainId, toChainId, weightBps);
    }

    // ============ View Functions ============

    /**
     * @notice Get bridge weight between appchains
     * @param fromChainId Source appchain
     * @param toChainId Destination appchain
     * @return weightBps Weight in basis points
     */
    function getBridgeWeight(
        uint256 fromChainId,
        uint256 toChainId
    ) public view override returns (uint256 weightBps) {
        weightBps = bridgeWeights[fromChainId][toChainId];
        if (weightBps == 0) {
            weightBps = DEFAULT_BRIDGE_WEIGHT; // Default 70%
        }
    }

    /**
     * @notice Check if an export has been processed
     * @param exportHash The export hash
     * @return Whether it's been processed
     */
    function isExportProcessed(bytes32 exportHash) external view override returns (bool) {
        return processedExports[exportHash];
    }

    /**
     * @notice Get user's exports
     * @param user The user address
     * @return Array of exports
     */
    function getUserExports(address user) external view returns (ScoreExport[] memory) {
        return userExports[user];
    }

    /**
     * @notice Get user's export count
     * @param user The user address
     * @return Count of exports
     */
    function getUserExportCount(address user) external view returns (uint256) {
        return userExports[user].length;
    }
}
