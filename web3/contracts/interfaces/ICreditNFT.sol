// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ICreditNFT
 * @notice Interface for soulbound credit achievement NFTs
 * @dev Non-transferable NFTs minted when users reach tier thresholds
 */
interface ICreditNFT {
    // ============ Structs ============

    struct CreditBadge {
        uint256 scoreAtMint;
        string tier;           // "Newcomer", "Builder", "Trusted", "Elite"
        uint256 timestamp;
    }

    // ============ Events ============

    event BadgeMinted(
        address indexed to,
        uint256 indexed tokenId,
        string tier,
        uint256 score
    );

    event RegistryUpdated(address indexed oldRegistry, address indexed newRegistry);

    // ============ Functions ============

    /**
     * @notice Mint a credit badge to a user
     * @param to The recipient address
     * @param score The user's credit score at time of mint
     * @return tokenId The minted token ID
     * @dev Only callable by CreditRegistry when user crosses tier threshold
     */
    function mint(address to, uint256 score) external returns (uint256 tokenId);

    /**
     * @notice Get badge metadata
     * @param tokenId The token ID
     * @return The badge struct
     */
    function getBadge(uint256 tokenId) external view returns (CreditBadge memory);

    /**
     * @notice Get user's highest tier badge
     * @param user The user address
     * @return tier The tier name
     * @return score The score at mint
     */
    function getHighestBadge(address user) external view returns (string memory tier, uint256 score);

    /**
     * @notice Check if an address has a specific tier badge
     * @param user The user address
     * @param tier The tier name to check
     * @return Whether user has the badge
     */
    function hasTierBadge(address user, string calldata tier) external view returns (bool);

    /**
     * @notice Get the tier name for a score
     * @param score The credit score
     * @return The tier name
     */
    function getTierForScore(uint256 score) external pure returns (string memory);

    /**
     * @notice Set the credit registry address
     * @param registry The new registry address
     */
    function setRegistry(address registry) external;

    /**
     * @notice Initialize the contract (for proxy pattern)
     * @param owner The owner address
     * @param registry The credit registry address
     */
    function initialize(address owner, address registry) external;
}
