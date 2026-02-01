// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {ICreditNFT} from "./interfaces/ICreditNFT.sol";

/**
 * @title CreditNFT
 * @notice Soulbound achievement NFTs for credit milestones
 * @dev Non-transferable ERC721 with on-chain SVG generation
 * 
 * Tiers:
 * - Newcomer: 0-99 score (gray badge)
 * - Builder: 100-299 score (bronze badge)
 * - Trusted: 300-599 score (silver badge)
 * - Elite: 600+ score (gold badge)
 */
contract CreditNFT is 
    Initializable, 
    OwnableUpgradeable, 
    ERC721Upgradeable,
    ICreditNFT 
{
    using Strings for uint256;

    // ============ State Variables ============

    /// @notice Credit registry (authorized minter)
    address public registry;

    /// @notice All badges
    mapping(uint256 => CreditBadge) public badges;

    /// @notice User's minted badges
    mapping(address => uint256[]) public userBadges;

    /// @notice User's highest tier index (0=none, 1=Newcomer, 2=Builder, 3=Trusted, 4=Elite)
    mapping(address => uint256) public userHighestTier;

    /// @notice Total badges minted
    uint256 public totalMinted;

    // ============ Tier Colors ============

    string constant NEWCOMER_COLOR = "#6B7280";   // Gray
    string constant BUILDER_COLOR = "#CD7F32";    // Bronze
    string constant TRUSTED_COLOR = "#C0C0C0";    // Silver
    string constant ELITE_COLOR = "#FFD700";      // Gold

    // ============ Constructor ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============

    /**
     * @notice Initialize the contract (for proxy pattern)
     * @param _owner The owner address
     * @param _registry The credit registry address
     */
    function initialize(
        address _owner,
        address _registry
    ) external initializer {
        __Ownable_init(_owner);
        __ERC721_init("CreditNet Badge", "CREDIT");

        registry = _registry;
    }

    // ============ Modifiers ============

    modifier onlyRegistry() {
        require(msg.sender == registry, "CreditNFT: caller is not registry");
        _;
    }

    // ============ Core Functions ============

    /**
     * @notice Mint a credit badge to a user
     * @param to The recipient address
     * @param score The user's credit score at time of mint
     * @return tokenId The minted token ID
     */
    function mint(address to, uint256 score) external override onlyRegistry returns (uint256 tokenId) {
        string memory tier = getTierForScore(score);
        uint256 tierIndex = _getTierIndex(score);

        // Only mint if this is a new tier for user
        require(tierIndex > userHighestTier[to], "CreditNFT: already has this tier or higher");

        tokenId = totalMinted++;
        
        badges[tokenId] = CreditBadge({
            scoreAtMint: score,
            tier: tier,
            timestamp: block.timestamp
        });

        userBadges[to].push(tokenId);
        userHighestTier[to] = tierIndex;

        _safeMint(to, tokenId);

        emit BadgeMinted(to, tokenId, tier, score);
    }

    // ============ View Functions ============

    /**
     * @notice Get badge metadata
     * @param tokenId The token ID
     * @return The badge struct
     */
    function getBadge(uint256 tokenId) external view override returns (CreditBadge memory) {
        return badges[tokenId];
    }

    /**
     * @notice Get user's highest tier badge
     * @param user The user address
     * @return tier The tier name
     * @return score The score at mint
     */
    function getHighestBadge(address user) external view override returns (string memory tier, uint256 score) {
        uint256[] memory userTokens = userBadges[user];
        if (userTokens.length == 0) {
            return ("None", 0);
        }
        
        uint256 highestToken = userTokens[userTokens.length - 1];
        CreditBadge memory badge = badges[highestToken];
        return (badge.tier, badge.scoreAtMint);
    }

    /**
     * @notice Check if an address has a specific tier badge
     * @param user The user address
     * @param tier The tier name to check
     * @return Whether user has the badge
     */
    function hasTierBadge(address user, string calldata tier) external view override returns (bool) {
        uint256[] memory userTokens = userBadges[user];
        for (uint256 i = 0; i < userTokens.length; i++) {
            if (keccak256(bytes(badges[userTokens[i]].tier)) == keccak256(bytes(tier))) {
                return true;
            }
        }
        return false;
    }

    /**
     * @notice Get the tier name for a score
     * @param score The credit score
     * @return The tier name
     */
    function getTierForScore(uint256 score) public pure override returns (string memory) {
        if (score >= 600) return "Elite";
        if (score >= 300) return "Trusted";
        if (score >= 100) return "Builder";
        return "Newcomer";
    }

    /**
     * @notice Get token URI with on-chain SVG
     * @param tokenId The token ID
     * @return The token URI (data:application/json;base64,...)
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);

        CreditBadge memory badge = badges[tokenId];
        string memory color = _getColorForTier(badge.tier);
        
        string memory svg = _generateSVG(badge.tier, badge.scoreAtMint, color);
        
        string memory json = string(abi.encodePacked(
            '{"name": "CreditNet ', badge.tier, ' Badge",',
            '"description": "Soulbound credit achievement badge from CreditNet Protocol",',
            '"image": "data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '",',
            '"attributes": [',
                '{"trait_type": "Tier", "value": "', badge.tier, '"},',
                '{"trait_type": "Score at Mint", "value": ', badge.scoreAtMint.toString(), '},',
                '{"trait_type": "Minted At", "value": ', badge.timestamp.toString(), '}',
            ']}'
        ));

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the credit registry address
     * @param _registry The new registry address
     */
    function setRegistry(address _registry) external override onlyOwner {
        require(_registry != address(0), "CreditNFT: zero address");
        address oldRegistry = registry;
        registry = _registry;
        emit RegistryUpdated(oldRegistry, _registry);
    }

    // ============ Transfer Restrictions (Soulbound) ============

    /**
     * @notice Override transfer to make non-transferable (soulbound)
     * @dev Only minting is allowed, no transfers
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Block all transfers (from != address(0))
        if (from != address(0) && to != address(0)) {
            revert("CreditNFT: soulbound - non-transferable");
        }

        return super._update(to, tokenId, auth);
    }

    // ============ Internal Functions ============

    /**
     * @notice Get tier index for comparison
     */
    function _getTierIndex(uint256 score) internal pure returns (uint256) {
        if (score >= 600) return 4;
        if (score >= 300) return 3;
        if (score >= 100) return 2;
        return 1; // Newcomer starts at 1 (0 means no badge)
    }

    /**
     * @notice Get color for tier
     */
    function _getColorForTier(string memory tier) internal pure returns (string memory) {
        if (keccak256(bytes(tier)) == keccak256(bytes("Elite"))) return ELITE_COLOR;
        if (keccak256(bytes(tier)) == keccak256(bytes("Trusted"))) return TRUSTED_COLOR;
        if (keccak256(bytes(tier)) == keccak256(bytes("Builder"))) return BUILDER_COLOR;
        return NEWCOMER_COLOR;
    }

    /**
     * @notice Generate on-chain SVG for badge
     */
    function _generateSVG(
        string memory tier,
        uint256 score,
        string memory color
    ) internal pure returns (string memory) {
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
            '<defs>',
                '<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" style="stop-color:#0F172A"/>',
                    '<stop offset="100%" style="stop-color:#1E293B"/>',
                '</linearGradient>',
                '<linearGradient id="badge" x1="0%" y1="0%" x2="100%" y2="100%">',
                    '<stop offset="0%" style="stop-color:', color, '"/>',
                    '<stop offset="100%" style="stop-color:', color, ';stop-opacity:0.7"/>',
                '</linearGradient>',
            '</defs>',
            '<rect width="400" height="400" fill="url(#bg)"/>',
            // Badge circle
            '<circle cx="200" cy="160" r="80" fill="url(#badge)" opacity="0.9"/>',
            '<circle cx="200" cy="160" r="70" fill="none" stroke="', color, '" stroke-width="2"/>',
            // Star in center
            '<polygon points="200,100 210,140 250,140 218,165 230,205 200,180 170,205 182,165 150,140 190,140" fill="#0F172A"/>',
            // Text
            '<text x="200" y="280" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" font-weight="bold">', tier, '</text>',
            '<text x="200" y="320" font-family="Arial, sans-serif" font-size="20" fill="#94A3B8" text-anchor="middle">Score: ', score.toString(), '</text>',
            '<text x="200" y="360" font-family="Arial, sans-serif" font-size="14" fill="#64748B" text-anchor="middle">CreditNet Protocol</text>',
            '</svg>'
        ));
    }
}
