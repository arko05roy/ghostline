// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {ICreditChainFactory} from "./interfaces/ICreditChainFactory.sol";
import {ICreditRegistry} from "./interfaces/ICreditRegistry.sol";
import {ICreditInterceptor} from "./interfaces/ICreditInterceptor.sol";
import {ICreditVault} from "./interfaces/ICreditVault.sol";
import {IGhostScoreVerifier} from "./interfaces/IGhostScoreVerifier.sol";
import {ICreditNFT} from "./interfaces/ICreditNFT.sol";

/**
 * @title CreditChainFactory
 * @notice The core infrastructure primitive - any institution deploys a full CreditNet stack with one call
 * @dev Uses OpenZeppelin Clones (EIP-1167 minimal proxy) for gas-efficient deployment (~300k vs ~5M)
 * 
 * "Stripe for onchain credit — any institution deploys a full credit system on Creditcoin with one function call."
 * 
 * Each appchain gets:
 * - CreditRegistry (isolated credit scores)
 * - CreditInterceptor (DeFi middleware)
 * - CreditVault (undercollateralized lending)
 * - GhostScoreVerifier (ZK proof verification)
 * - CreditNFT (soulbound achievement badges)
 */
contract CreditChainFactory is Ownable, ICreditChainFactory {
    using Clones for address;

    // ============ State Variables ============

    /// @notice All deployed appchains
    mapping(uint256 => AppChain) public appChains;

    /// @notice Admin to appchain IDs mapping
    mapping(address => uint256[]) public adminAppChains;

    /// @notice Total appchains deployed
    uint256 public totalChains;

    /// @notice Implementation contracts for cloning
    address public registryImpl;
    address public interceptorImpl;
    address public vaultImpl;
    address public verifierImpl;
    address public nftImpl;

    /// @notice Default lending token for new vaults
    address public defaultLendingToken;

    // ============ Constructor ============

    constructor(
        address _registryImpl,
        address _interceptorImpl,
        address _vaultImpl,
        address _verifierImpl,
        address _nftImpl,
        address _defaultLendingToken
    ) Ownable(msg.sender) {
        require(_registryImpl != address(0), "Factory: zero registry impl");
        require(_interceptorImpl != address(0), "Factory: zero interceptor impl");
        require(_vaultImpl != address(0), "Factory: zero vault impl");
        require(_verifierImpl != address(0), "Factory: zero verifier impl");
        require(_nftImpl != address(0), "Factory: zero nft impl");

        registryImpl = _registryImpl;
        interceptorImpl = _interceptorImpl;
        vaultImpl = _vaultImpl;
        verifierImpl = _verifierImpl;
        nftImpl = _nftImpl;
        defaultLendingToken = _defaultLendingToken;
    }

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
    ) external override returns (uint256 chainId) {
        chainId = totalChains++;

        // Clone all implementation contracts
        address registry = registryImpl.clone();
        address interceptor = interceptorImpl.clone();
        address vault = vaultImpl.clone();
        address verifier = verifierImpl.clone();
        address nft = nftImpl.clone();

        // Initialize registry with action weights
        uint256[] memory weights = config.actionWeights;
        if (weights.length == 0) {
            weights = _getDefaultWeights();
        }
        ICreditRegistry(registry).initialize(msg.sender, weights);

        // Initialize interceptor and wire to registry
        ICreditInterceptor(interceptor).initialize(msg.sender, registry);

        // Set interceptor in registry
        ICreditRegistry(registry).setInterceptor(interceptor);

        // Initialize verifier (mock mode if no external verifier specified)
        IGhostScoreVerifier(verifier).initialize(msg.sender, address(0));

        // Initialize vault with registry and default token
        address lendingToken = defaultLendingToken;
        if (config.whitelistedTokens.length > 0) {
            lendingToken = config.whitelistedTokens[0];
        }
        ICreditVault(vault).initialize(msg.sender, lendingToken, registry);

        // Set up loan tiers if provided
        if (config.loanTiers.length > 0) {
            for (uint256 i = 0; i < config.loanTiers.length; i++) {
                ICreditVault(vault).setTier(config.loanTiers[i]);
            }
        }

        // Wire vault to verifier
        ICreditVault(vault).setGhostScoreVerifier(verifier);
        ICreditVault(vault).setInterceptor(interceptor);

        // Initialize NFT with registry
        ICreditNFT(nft).initialize(msg.sender, registry);

        // Store appchain data (only scalar values, no dynamic arrays)
        appChains[chainId] = AppChain({
            id: chainId,
            admin: msg.sender,
            name: name,
            registry: registry,
            interceptor: interceptor,
            vault: vault,
            verifier: verifier,
            nft: nft,
            allowCrossChainScores: config.allowCrossChainScores,
            minScoreForLoan: config.minScoreForLoan,
            createdAt: block.timestamp,
            active: true
        });

        adminAppChains[msg.sender].push(chainId);

        emit AppChainDeployed(
            chainId,
            msg.sender,
            name,
            registry,
            interceptor,
            vault,
            verifier,
            nft
        );
    }

    /**
     * @notice Deploy with default configuration
     * @param name The appchain name
     * @return chainId The ID of the deployed appchain
     */
    function deployAppChainSimple(string calldata name) external override returns (uint256 chainId) {
        // Create default config
        uint256[] memory emptyWeights;
        ICreditVault.LoanTier[] memory emptyTiers;
        address[] memory emptyTokens;

        AppChainConfig memory defaultConfig = AppChainConfig({
            actionWeights: emptyWeights,
            loanTiers: emptyTiers,
            allowCrossChainScores: true,
            minScoreForLoan: 0,
            whitelistedTokens: emptyTokens
        });

        return this.deployAppChain(name, defaultConfig);
    }

    // ============ View Functions ============

    /**
     * @notice Get appchain details
     * @param chainId The appchain ID
     * @return The appchain struct
     */
    function getAppChain(uint256 chainId) external view override returns (AppChain memory) {
        require(chainId < totalChains, "Factory: invalid chain ID");
        return appChains[chainId];
    }

    /**
     * @notice Get all appchains by admin
     * @param admin The admin address
     * @return Array of appchain IDs
     */
    function getAppChainsByAdmin(address admin) external view override returns (uint256[] memory) {
        return adminAppChains[admin];
    }

    /**
     * @notice Get total number of appchains
     * @return Total count
     */
    function getAppChainCount() external view override returns (uint256) {
        return totalChains;
    }

    /**
     * @notice Check if an appchain exists and is active
     * @param chainId The appchain ID
     * @return Whether it exists and is active
     */
    function isActiveAppChain(uint256 chainId) external view override returns (bool) {
        return chainId < totalChains && appChains[chainId].active;
    }

    /**
     * @notice Get implementation addresses
     */
    function getImplementations() external view override returns (
        address _registryImpl,
        address _interceptorImpl,
        address _vaultImpl,
        address _verifierImpl,
        address _nftImpl
    ) {
        return (registryImpl, interceptorImpl, vaultImpl, verifierImpl, nftImpl);
    }

    // ============ Admin Functions ============

    /**
     * @notice Deactivate an appchain (only chain admin)
     * @param chainId The appchain ID
     */
    function deactivateAppChain(uint256 chainId) external override {
        require(chainId < totalChains, "Factory: invalid chain ID");
        require(appChains[chainId].admin == msg.sender, "Factory: not admin");
        require(appChains[chainId].active, "Factory: already inactive");

        appChains[chainId].active = false;
        emit AppChainDeactivated(chainId, msg.sender);
    }

    /**
     * @notice Reactivate an appchain (only chain admin)
     * @param chainId The appchain ID
     */
    function reactivateAppChain(uint256 chainId) external override {
        require(chainId < totalChains, "Factory: invalid chain ID");
        require(appChains[chainId].admin == msg.sender, "Factory: not admin");
        require(!appChains[chainId].active, "Factory: already active");

        appChains[chainId].active = true;
        emit AppChainReactivated(chainId, msg.sender);
    }

    /**
     * @notice Upgrade an implementation contract (only factory owner)
     * @param contractName The contract name
     * @param newImpl The new implementation address
     */
    function upgradeImplementation(
        string calldata contractName,
        address newImpl
    ) external override onlyOwner {
        require(newImpl != address(0), "Factory: zero address");

        address oldImpl;
        bytes32 nameHash = keccak256(bytes(contractName));

        if (nameHash == keccak256(bytes("registry"))) {
            oldImpl = registryImpl;
            registryImpl = newImpl;
        } else if (nameHash == keccak256(bytes("interceptor"))) {
            oldImpl = interceptorImpl;
            interceptorImpl = newImpl;
        } else if (nameHash == keccak256(bytes("vault"))) {
            oldImpl = vaultImpl;
            vaultImpl = newImpl;
        } else if (nameHash == keccak256(bytes("verifier"))) {
            oldImpl = verifierImpl;
            verifierImpl = newImpl;
        } else if (nameHash == keccak256(bytes("nft"))) {
            oldImpl = nftImpl;
            nftImpl = newImpl;
        } else {
            revert("Factory: unknown contract");
        }

        emit ImplementationUpgraded(contractName, oldImpl, newImpl);
    }

    /**
     * @notice Set the default lending token for new vaults
     * @param token The token address
     */
    function setDefaultLendingToken(address token) external onlyOwner {
        defaultLendingToken = token;
    }

    // ============ Internal Functions ============

    /**
     * @notice Get default action weights
     * @return Default weight array
     */
    function _getDefaultWeights() internal pure returns (uint256[] memory) {
        uint256[] memory weights = new uint256[](6);
        weights[0] = 10;  // SWAP
        weights[1] = 25;  // LEND
        weights[2] = 50;  // REPAY (highest)
        weights[3] = 20;  // STAKE
        weights[4] = 5;   // TRANSFER
        weights[5] = 30;  // PROVIDE_LIQUIDITY
        return weights;
    }
}
