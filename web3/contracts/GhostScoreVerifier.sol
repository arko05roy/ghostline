// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IGhostScoreVerifier} from "./interfaces/IGhostScoreVerifier.sol";

/**
 * @title GhostScoreVerifier
 * @notice Wrapper for Noir-generated ZK verifier with attestation storage
 * @dev Verifies GhostScore proofs and stores attestations for later use by CreditVault
 * 
 * Two modes:
 * 1. Production mode: Uses actual Noir UltraVerifier for ZK proof verification
 * 2. Mock mode: If verifier is address(0), always accepts proofs (for hackathon demo)
 */
contract GhostScoreVerifier is 
    Initializable, 
    OwnableUpgradeable,
    IGhostScoreVerifier 
{
    // ============ State Variables ============

    /// @notice The Noir-generated UltraVerifier contract
    address public ultraVerifier;

    /// @notice User attestations
    mapping(address => GhostScoreAttestation[]) public attestations;

    /// @notice Mapping of user commitment to address (for looking up attestations)
    mapping(bytes32 => address) public commitmentToAddress;

    /// @notice Used proofs to prevent replay
    mapping(bytes32 => bool) public usedProofs;

    /// @notice Whether mock mode is enabled (for hackathon demo)
    bool public mockMode;

    // ============ Constructor ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============

    /**
     * @notice Initialize the contract (for proxy pattern)
     * @param _owner The owner address
     * @param _verifier The UltraVerifier address (can be zero for mock mode)
     */
    function initialize(
        address _owner,
        address _verifier
    ) external initializer {
        __Ownable_init(_owner);

        ultraVerifier = _verifier;
        mockMode = (_verifier == address(0));
    }

    // ============ Core Functions ============

    /**
     * @notice Verify a GhostScore proof and create attestation
     * @param proof The ZK proof bytes
     * @param publicInputs Public inputs [scoreThreshold, userCommitment]
     * @return success Whether verification succeeded
     */
    function verifyAndAttest(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) external override returns (bool success) {
        require(publicInputs.length >= 2, "GhostScoreVerifier: invalid inputs");

        // Extract public inputs
        uint256 scoreThreshold = uint256(publicInputs[0]);
        bytes32 userCommitment = publicInputs[1];

        // Prevent replay attacks
        bytes32 proofHash = keccak256(abi.encodePacked(proof, publicInputs));
        require(!usedProofs[proofHash], "GhostScoreVerifier: proof already used");
        usedProofs[proofHash] = true;

        // Verify proof
        if (mockMode) {
            // In mock mode, accept all proofs (for hackathon demo)
            success = true;
        } else {
            // Call the actual Noir verifier
            success = _verifyProof(proof, publicInputs);
        }

        require(success, "GhostScoreVerifier: invalid proof");

        // Store attestation
        attestations[msg.sender].push(GhostScoreAttestation({
            scoreThreshold: scoreThreshold,
            timestamp: block.timestamp,
            valid: true
        }));

        // Map commitment to address for future lookups
        commitmentToAddress[userCommitment] = msg.sender;

        emit GhostScoreVerified(userCommitment, scoreThreshold, block.timestamp);

        return true;
    }

    // ============ View Functions ============

    /**
     * @notice Get an attestation for a user
     * @param user The user address
     * @param index The attestation index
     * @return The attestation struct
     */
    function getAttestation(
        address user,
        uint256 index
    ) external view override returns (GhostScoreAttestation memory) {
        require(index < attestations[user].length, "GhostScoreVerifier: invalid index");
        return attestations[user][index];
    }

    /**
     * @notice Check if user has valid attestation above threshold
     * @param user The user address
     * @param minThreshold The minimum score threshold
     * @return Whether user has valid attestation
     */
    function hasValidAttestation(
        address user,
        uint256 minThreshold
    ) external view override returns (bool) {
        GhostScoreAttestation[] storage userAttestations = attestations[user];
        
        for (uint256 i = 0; i < userAttestations.length; i++) {
            if (userAttestations[i].valid && userAttestations[i].scoreThreshold >= minThreshold) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * @notice Get the number of attestations for a user
     * @param user The user address
     * @return The attestation count
     */
    function getAttestationCount(address user) external view override returns (uint256) {
        return attestations[user].length;
    }

    /**
     * @notice Get the latest valid attestation for a user
     * @param user The user address
     * @return attestation The latest valid attestation
     * @return exists Whether a valid attestation exists
     */
    function getLatestAttestation(
        address user
    ) external view returns (GhostScoreAttestation memory attestation, bool exists) {
        GhostScoreAttestation[] storage userAttestations = attestations[user];
        
        for (uint256 i = userAttestations.length; i > 0; i--) {
            if (userAttestations[i - 1].valid) {
                return (userAttestations[i - 1], true);
            }
        }
        
        return (attestation, false);
    }

    // ============ User Functions ============

    /**
     * @notice Invalidate an attestation (user can self-invalidate)
     * @param index The attestation index to invalidate
     */
    function invalidateAttestation(uint256 index) external override {
        require(index < attestations[msg.sender].length, "GhostScoreVerifier: invalid index");
        attestations[msg.sender][index].valid = false;
        emit AttestationInvalidated(msg.sender, index);
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the UltraVerifier contract address
     * @param verifier The verifier address
     */
    function setVerifier(address verifier) external override onlyOwner {
        address oldVerifier = ultraVerifier;
        ultraVerifier = verifier;
        mockMode = (verifier == address(0));
        emit VerifierUpdated(oldVerifier, verifier);
    }

    /**
     * @notice Enable or disable mock mode
     * @param enabled Whether mock mode should be enabled
     */
    function setMockMode(bool enabled) external onlyOwner {
        mockMode = enabled;
    }

    // ============ Internal Functions ============

    /**
     * @notice Call the actual Noir verifier
     * @param proof The proof bytes
     * @param publicInputs The public inputs
     * @return success Whether verification succeeded
     */
    function _verifyProof(
        bytes calldata proof,
        bytes32[] calldata publicInputs
    ) internal view returns (bool success) {
        // The Noir-generated verifier has signature:
        // function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) public view returns (bool)
        
        (bool callSuccess, bytes memory returnData) = ultraVerifier.staticcall(
            abi.encodeWithSignature(
                "verify(bytes,bytes32[])",
                proof,
                publicInputs
            )
        );

        if (callSuccess && returnData.length >= 32) {
            success = abi.decode(returnData, (bool));
        } else {
            success = false;
        }
    }
}
