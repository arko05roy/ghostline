// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IUniversalCreditRegistry} from "./interfaces/IUniversalCreditRegistry.sol";

/**
 * @title CreditOracle
 * @notice Keeper contract for off-chain indexer to write mainnet credit events
 * @dev Authorized keepers monitor Creditcoin mainnet, detect credit-relevant transactions,
 *      and submit them to UniversalCreditRegistry via this oracle.
 *
 * Architecture:
 * - Off-chain indexer (Node.js) monitors Creditcoin mainnet for DeFi activity
 * - Indexer detects: DEX swaps, lending events, staking, repayments
 * - Indexer calls submitMainnetEvent() or submitBatch() to write to registry
 * - Replay protection via txHash tracking
 *
 * For Hackathon (Mocked):
 * - Instead of real mainnet indexer, use manual keeper submissions
 * - Keeper can submit mock mainnet events for demo purposes
 */
contract CreditOracle is
    Ownable,
    ReentrancyGuard
{
    // ============ State Variables ============

    /// @notice Reference to UniversalCreditRegistry
    IUniversalCreditRegistry public registry;

    /// @notice Authorized keeper addresses (off-chain indexers)
    mapping(address => bool) public keepers;

    /// @notice Processed transaction hashes (replay protection)
    mapping(bytes32 => bool) public processedEvents;

    /// @notice Source ID for "Creditcoin Mainnet" in the registry
    uint256 public mainnetSourceId;

    /// @notice Total events submitted
    uint256 public totalEventsSubmitted;

    // ============ Structs ============

    struct MainnetEvent {
        address user;
        IUniversalCreditRegistry.ActionType actionType;
        uint256 amount;
        uint256 timestamp;
        bytes32 txHash;
    }

    // ============ Events ============

    event MainnetEventSubmitted(
        address indexed user,
        IUniversalCreditRegistry.ActionType indexed actionType,
        uint256 amount,
        bytes32 indexed txHash
    );

    event KeeperAdded(address indexed keeper);
    event KeeperRemoved(address indexed keeper);

    // ============ Modifiers ============

    modifier onlyKeeper() {
        require(keepers[msg.sender], "CreditOracle: not authorized keeper");
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Constructor - simplified for hackathon
     * @param _owner The owner address
     * @param _registry The UniversalCreditRegistry address
     * @param _mainnetSourceId The source ID for mainnet in the registry
     */
    constructor(
        address _owner,
        address _registry,
        uint256 _mainnetSourceId
    ) Ownable(_owner) {
        require(_registry != address(0), "CreditOracle: zero address");
        registry = IUniversalCreditRegistry(_registry);
        mainnetSourceId = _mainnetSourceId;
    }

    // ============ Core Functions ============

    /**
     * @notice Submit a mainnet credit event (single)
     * @param user The user who performed the action
     * @param actionType The type of action (SWAP, LEND, REPAY, etc.)
     * @param amount The amount involved
     * @param txHash The mainnet transaction hash (for replay protection)
     */
    function submitMainnetEvent(
        address user,
        IUniversalCreditRegistry.ActionType actionType,
        uint256 amount,
        uint256 /* timestamp */,
        bytes32 txHash
    ) external onlyKeeper nonReentrant {
        require(user != address(0), "CreditOracle: zero address");
        require(amount > 0, "CreditOracle: zero amount");
        require(txHash != bytes32(0), "CreditOracle: zero txHash");
        require(!processedEvents[txHash], "CreditOracle: already processed");

        // Mark as processed
        processedEvents[txHash] = true;

        // Submit to registry
        registry.registerEvent(user, mainnetSourceId, actionType, amount);

        // Increment counter
        totalEventsSubmitted++;

        emit MainnetEventSubmitted(user, actionType, amount, txHash);
    }

    /**
     * @notice Submit multiple mainnet events in a batch (gas efficient)
     * @param events Array of MainnetEvent structs
     */
    function submitBatch(MainnetEvent[] calldata events) external onlyKeeper nonReentrant {
        uint256 length = events.length;
        require(length > 0, "CreditOracle: empty batch");
        require(length <= 50, "CreditOracle: batch too large"); // Max 50 events per batch

        for (uint256 i = 0; i < length; i++) {
            MainnetEvent calldata evt = events[i];

            require(evt.user != address(0), "CreditOracle: zero address");
            require(evt.amount > 0, "CreditOracle: zero amount");
            require(evt.txHash != bytes32(0), "CreditOracle: zero txHash");
            require(!processedEvents[evt.txHash], "CreditOracle: already processed");

            // Mark as processed
            processedEvents[evt.txHash] = true;

            // Submit to registry
            registry.registerEvent(evt.user, mainnetSourceId, evt.actionType, evt.amount);

            // Emit event
            emit MainnetEventSubmitted(evt.user, evt.actionType, evt.amount, evt.txHash);
        }

        // Increment counter
        totalEventsSubmitted += length;
    }

    // ============ Admin Functions ============

    /**
     * @notice Add a keeper address
     * @param keeper The keeper address to add
     */
    function addKeeper(address keeper) external onlyOwner {
        require(keeper != address(0), "CreditOracle: zero address");
        require(!keepers[keeper], "CreditOracle: already keeper");

        keepers[keeper] = true;
        emit KeeperAdded(keeper);
    }

    /**
     * @notice Remove a keeper address
     * @param keeper The keeper address to remove
     */
    function removeKeeper(address keeper) external onlyOwner {
        require(keepers[keeper], "CreditOracle: not keeper");

        keepers[keeper] = false;
        emit KeeperRemoved(keeper);
    }

    /**
     * @notice Update the registry address (emergency only)
     * @param _registry New registry address
     */
    function setRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "CreditOracle: zero address");
        registry = IUniversalCreditRegistry(_registry);
    }

    /**
     * @notice Update the mainnet source ID
     * @param _mainnetSourceId New source ID
     */
    function setMainnetSourceId(uint256 _mainnetSourceId) external onlyOwner {
        mainnetSourceId = _mainnetSourceId;
    }

    // ============ View Functions ============

    /**
     * @notice Check if a transaction hash has been processed
     * @param txHash The transaction hash
     * @return Whether the event has been processed
     */
    function isProcessed(bytes32 txHash) external view returns (bool) {
        return processedEvents[txHash];
    }

    /**
     * @notice Check if an address is a keeper
     * @param keeper The address to check
     * @return Whether the address is a keeper
     */
    function isKeeper(address keeper) external view returns (bool) {
        return keepers[keeper];
    }
}
