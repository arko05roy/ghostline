// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IUniversalCreditRegistry} from "./interfaces/IUniversalCreditRegistry.sol";

/**
 * @title RWAOracle
 * @notice Oracle for submitting off-chain Real World Asset (RWA) credit data
 * @dev Institutions (banks, fintechs) can submit signed off-chain credit events
 *      (loan repayments, bank transactions, etc.) to be recorded in UniversalCreditRegistry
 *
 * Architecture:
 * - Institutions register with a signer address
 * - Each institution gets a unique source ID in UniversalCreditRegistry
 * - Institutions sign credit events off-chain with their signer key
 * - Anyone can submit the signed event on-chain (gasless for institutions)
 * - Signature validation ensures only authorized institutions can submit
 * - Replay protection via eventId tracking
 *
 * For Hackathon (Mocked):
 * - Register 1-2 mock institutions for demo
 * - Manually submit RWA events via frontend or keeper script
 */
contract RWAOracle is
    Ownable,
    ReentrancyGuard
{
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    // ============ State Variables ============

    /// @notice Reference to UniversalCreditRegistry
    IUniversalCreditRegistry public registry;

    /// @notice Registered institutions
    mapping(uint256 => Institution) public institutions;

    /// @notice Institution ID by signer address (for reverse lookup)
    mapping(address => uint256) public signerToInstitutionId;

    /// @notice Source ID per institution in UniversalCreditRegistry
    mapping(uint256 => uint256) public institutionSourceIds;

    /// @notice Processed event IDs (replay protection)
    mapping(bytes32 => bool) public processedEvents;

    /// @notice Total number of registered institutions
    uint256 public institutionCount;

    /// @notice Total RWA events submitted
    uint256 public totalRWAEventsSubmitted;

    // ============ Structs ============

    struct Institution {
        string name;
        address signer;
        bool active;
        uint256 createdAt;
    }

    struct RWAEvent {
        uint256 institutionId;
        address user;
        IUniversalCreditRegistry.ActionType actionType;
        uint256 amount;
        uint256 timestamp;
        bytes32 eventId;
    }

    // ============ Events ============

    event InstitutionRegistered(
        uint256 indexed institutionId,
        string name,
        address indexed signer,
        uint256 indexed sourceId
    );

    event InstitutionSignerUpdated(
        uint256 indexed institutionId,
        address indexed oldSigner,
        address indexed newSigner
    );

    event InstitutionDeactivated(uint256 indexed institutionId);

    event RWAEventSubmitted(
        uint256 indexed institutionId,
        address indexed user,
        IUniversalCreditRegistry.ActionType indexed actionType,
        uint256 amount,
        bytes32 eventId
    );

    // ============ Constructor ============

    /**
     * @notice Constructor - simplified for hackathon
     * @param _owner The owner address
     * @param _registry The UniversalCreditRegistry address
     */
    constructor(
        address _owner,
        address _registry
    ) Ownable(_owner) {
        require(_registry != address(0), "RWAOracle: zero address");
        registry = IUniversalCreditRegistry(_registry);
    }

    // ============ Core Functions ============

    /**
     * @notice Submit a signed RWA credit event
     * @param institutionId The institution ID
     * @param user The user who performed the action (e.g., loan borrower)
     * @param actionType The type of action (typically LEND or REPAY for RWA)
     * @param amount The amount involved (e.g., loan amount, repayment amount)
     * @param timestamp The timestamp of the off-chain event
     * @param eventId Unique event identifier (e.g., "loan-123-repayment-1")
     * @param signature The institution's signature over the event data
     */
    function submitRWAEvent(
        uint256 institutionId,
        address user,
        IUniversalCreditRegistry.ActionType actionType,
        uint256 amount,
        uint256 timestamp,
        bytes32 eventId,
        bytes calldata signature
    ) external nonReentrant {
        require(institutionId < institutionCount, "RWAOracle: invalid institution");
        require(user != address(0), "RWAOracle: zero address");
        require(amount > 0, "RWAOracle: zero amount");
        require(eventId != bytes32(0), "RWAOracle: zero eventId");
        require(!processedEvents[eventId], "RWAOracle: already processed");

        Institution storage institution = institutions[institutionId];
        require(institution.active, "RWAOracle: institution inactive");

        // Verify signature
        bytes32 messageHash = _getEventHash(
            institutionId,
            user,
            actionType,
            amount,
            timestamp,
            eventId
        );
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(signature);

        require(signer == institution.signer, "RWAOracle: invalid signature");

        // Mark as processed
        processedEvents[eventId] = true;

        // Submit to registry
        uint256 sourceId = institutionSourceIds[institutionId];
        registry.registerEvent(user, sourceId, actionType, amount);

        // Increment counter
        totalRWAEventsSubmitted++;

        emit RWAEventSubmitted(institutionId, user, actionType, amount, eventId);
    }

    // ============ Admin Functions ============

    /**
     * @notice Register a new institution
     * @param name Institution name (e.g., "Acme Bank", "LatAm Fintech")
     * @param signer The institution's authorized signer address
     * @param sourceWeight Weight for this institution's credit data (in basis points, 100 = 1x)
     * @return institutionId The ID of the newly registered institution
     */
    function registerInstitution(
        string calldata name,
        address signer,
        uint256 sourceWeight
    ) external onlyOwner returns (uint256 institutionId) {
        require(bytes(name).length > 0, "RWAOracle: empty name");
        require(signer != address(0), "RWAOracle: zero address");
        require(signerToInstitutionId[signer] == 0, "RWAOracle: signer already registered");

        institutionId = institutionCount++;

        // Register source in UniversalCreditRegistry
        uint256 sourceId = registry.registerSource(
            name,
            IUniversalCreditRegistry.SourceType.RWA_ORACLE,
            sourceWeight
        );

        // Store institution
        institutions[institutionId] = Institution({
            name: name,
            signer: signer,
            active: true,
            createdAt: block.timestamp
        });

        signerToInstitutionId[signer] = institutionId;
        institutionSourceIds[institutionId] = sourceId;

        emit InstitutionRegistered(institutionId, name, signer, sourceId);
    }

    /**
     * @notice Update an institution's signer address
     * @param institutionId The institution ID
     * @param newSigner The new signer address
     */
    function updateInstitutionSigner(
        uint256 institutionId,
        address newSigner
    ) external onlyOwner {
        require(institutionId < institutionCount, "RWAOracle: invalid institution");
        require(newSigner != address(0), "RWAOracle: zero address");

        Institution storage institution = institutions[institutionId];
        address oldSigner = institution.signer;

        require(signerToInstitutionId[newSigner] == 0, "RWAOracle: signer already registered");

        // Update mappings
        delete signerToInstitutionId[oldSigner];
        signerToInstitutionId[newSigner] = institutionId;
        institution.signer = newSigner;

        emit InstitutionSignerUpdated(institutionId, oldSigner, newSigner);
    }

    /**
     * @notice Deactivate an institution
     * @param institutionId The institution ID
     */
    function deactivateInstitution(uint256 institutionId) external onlyOwner {
        require(institutionId < institutionCount, "RWAOracle: invalid institution");
        require(institutions[institutionId].active, "RWAOracle: already inactive");

        institutions[institutionId].active = false;

        emit InstitutionDeactivated(institutionId);
    }

    /**
     * @notice Update the registry address (emergency only)
     * @param _registry New registry address
     */
    function setRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "RWAOracle: zero address");
        registry = IUniversalCreditRegistry(_registry);
    }

    // ============ View Functions ============

    /**
     * @notice Get institution by ID
     * @param institutionId The institution ID
     * @return Institution struct
     */
    function getInstitution(uint256 institutionId) external view returns (Institution memory) {
        require(institutionId < institutionCount, "RWAOracle: invalid institution");
        return institutions[institutionId];
    }

    /**
     * @notice Check if an event has been processed
     * @param eventId The event ID
     * @return Whether the event has been processed
     */
    function isProcessed(bytes32 eventId) external view returns (bool) {
        return processedEvents[eventId];
    }

    /**
     * @notice Get the institution ID for a signer address
     * @param signer The signer address
     * @return Institution ID (0 if not registered)
     */
    function getInstitutionIdBySigner(address signer) external view returns (uint256) {
        return signerToInstitutionId[signer];
    }

    // ============ Internal Functions ============

    /**
     * @notice Compute the hash of an RWA event for signature verification
     * @param institutionId The institution ID
     * @param user The user address
     * @param actionType The action type
     * @param amount The amount
     * @param timestamp The timestamp
     * @param eventId The event ID
     * @return The keccak256 hash of the event data
     */
    function _getEventHash(
        uint256 institutionId,
        address user,
        IUniversalCreditRegistry.ActionType actionType,
        uint256 amount,
        uint256 timestamp,
        bytes32 eventId
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            institutionId,
            user,
            actionType,
            amount,
            timestamp,
            eventId
        ));
    }

    /**
     * @notice Helper for institutions to pre-compute event hash off-chain
     * @param institutionId The institution ID
     * @param user The user address
     * @param actionType The action type
     * @param amount The amount
     * @param timestamp The timestamp
     * @param eventId The event ID
     * @return The keccak256 hash of the event data
     */
    function getEventHash(
        uint256 institutionId,
        address user,
        IUniversalCreditRegistry.ActionType actionType,
        uint256 amount,
        uint256 timestamp,
        bytes32 eventId
    ) external pure returns (bytes32) {
        return _getEventHash(institutionId, user, actionType, amount, timestamp, eventId);
    }
}
