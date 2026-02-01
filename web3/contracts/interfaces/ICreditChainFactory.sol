// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ICreditVault} from "./ICreditVault.sol";

/**
 * @title ICreditChainFactory
 * @notice Interface for the master appchain deployer
 * @dev Any institution deploys a full CreditNet stack with one function call
 */
interface ICreditChainFactory {
    // ============ Structs ============

    /// @notice Storage struct for appchain (no dynamic arrays)
    struct AppChain {
        uint256 id;
        address admin;              // Institution wallet
        string name;
        address registry;           // Deployed CreditRegistry instance
        address interceptor;        // Deployed CreditInterceptor instance
        address vault;              // Deployed CreditVault instance
        address verifier;           // Deployed GhostScoreVerifier instance
        address nft;                // Deployed CreditNFT instance
        bool allowCrossChainScores;
        uint256 minScoreForLoan;
        uint256 createdAt;
        bool active;
    }

    /// @notice Deploy configuration (passed as calldata, not stored)
    struct AppChainConfig {
        uint256[] actionWeights;        // Institution sets its own credit scoring weights
        ICreditVault.LoanTier[] loanTiers;  // Institution sets its own loan terms
        bool allowCrossChainScores;     // Accept scores imported from other appchains
        uint256 minScoreForLoan;
        address[] whitelistedTokens;
    }

    // ============ Events ============

    event AppChainDeployed(
        uint256 indexed chainId,
        address indexed admin,
        string name,
        address registry,
        address interceptor,
        address vault,
        address verifier,
        address nft
    );

    event AppChainDeactivated(uint256 indexed chainId, address indexed admin);
    event AppChainReactivated(uint256 indexed chainId, address indexed admin);
    event ImplementationUpgraded(string contractName, address indexed oldImpl, address indexed newImpl);

    // ============ Core Functions ============

    /**
     * @notice Deploy a new appchain with all CreditNet contracts
     * @param name The appchain name (e.g., "Acme Bank")
     * @param config The appchain configuration
     * @return chainId The ID of the deployed appchain
     */
    function deployAppChain(
        string calldata name,
        AppChainConfig calldata config
    ) external returns (uint256 chainId);

    /**
     * @notice Deploy with default configuration
     * @param name The appchain name
     * @return chainId The ID of the deployed appchain
     */
    function deployAppChainSimple(string calldata name) external returns (uint256 chainId);

    // ============ View Functions ============

    /**
     * @notice Get appchain details
     * @param chainId The appchain ID
     * @return The appchain struct
     */
    function getAppChain(uint256 chainId) external view returns (AppChain memory);

    /**
     * @notice Get all appchains by admin
     * @param admin The admin address
     * @return Array of appchain IDs
     */
    function getAppChainsByAdmin(address admin) external view returns (uint256[] memory);

    /**
     * @notice Get total number of appchains
     * @return Total count
     */
    function getAppChainCount() external view returns (uint256);

    /**
     * @notice Check if an appchain exists and is active
     * @param chainId The appchain ID
     * @return Whether it exists and is active
     */
    function isActiveAppChain(uint256 chainId) external view returns (bool);

    // ============ Admin Functions ============

    /**
     * @notice Deactivate an appchain (only chain admin)
     * @param chainId The appchain ID
     */
    function deactivateAppChain(uint256 chainId) external;

    /**
     * @notice Reactivate an appchain (only chain admin)
     * @param chainId The appchain ID
     */
    function reactivateAppChain(uint256 chainId) external;

    /**
     * @notice Upgrade an implementation contract (only factory owner)
     * @param contractName The contract name ("registry", "interceptor", "vault", "verifier", "nft")
     * @param newImpl The new implementation address
     */
    function upgradeImplementation(string calldata contractName, address newImpl) external;

    /**
     * @notice Get implementation addresses
     * @return registryImpl
     * @return interceptorImpl
     * @return vaultImpl
     * @return verifierImpl
     * @return nftImpl
     */
    function getImplementations() external view returns (
        address registryImpl,
        address interceptorImpl,
        address vaultImpl,
        address verifierImpl,
        address nftImpl
    );
}
