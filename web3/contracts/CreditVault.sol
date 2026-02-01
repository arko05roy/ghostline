// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ICreditVault} from "./interfaces/ICreditVault.sol";
import {ICreditRegistry} from "./interfaces/ICreditRegistry.sol";

/**
 * @title CreditVault
 * @notice Undercollateralized lending vault powered by GhostScore ZK proofs
 * @dev The killer demo for CreditNet - higher credit scores = better loan terms
 * 
 * Key Features:
 * - Score-based loan tiers (higher score = lower collateral requirement)
 * - Undercollateralized loans for high scores (Elite tier: 30% collateral)
 * - Repayment builds credit (positive feedback loop)
 * - Liquidation mechanism with grace period
 */
contract CreditVault is 
    Initializable, 
    OwnableUpgradeable, 
    ReentrancyGuardUpgradeable,
    PausableUpgradeable,
    ICreditVault 
{
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Grace period after loan duration before liquidation (3 days)
    uint256 public constant GRACE_PERIOD = 3 days;

    /// @notice Basis points denominator
    uint256 public constant BPS_DENOMINATOR = 10000;

    // ============ State Variables ============

    /// @notice The lending token (stablecoin or CTC)
    IERC20 public lendingToken;

    /// @notice Credit registry for score lookups
    ICreditRegistry public registry;

    /// @notice GhostScore verifier (optional - for ZK proof verification)
    address public ghostScoreVerifier;

    /// @notice Credit interceptor for repayment events
    address public interceptor;

    /// @notice All loans
    mapping(uint256 => Loan) public loans;

    /// @notice Loan tiers by score threshold
    mapping(uint256 => LoanTier) public tiers;

    /// @notice Available tier thresholds (sorted)
    uint256[] public tierThresholds;

    /// @notice Lender deposits
    mapping(address => uint256) public lenderDeposits;

    /// @notice Borrower loan IDs
    mapping(address => uint256[]) public borrowerLoanIds;

    /// @notice Total loans issued
    uint256 public totalLoans;

    /// @notice Total deposited liquidity
    uint256 public totalDeposited;

    /// @notice Total currently borrowed
    uint256 public totalBorrowed;

    // ============ Constructor ============

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    // ============ Initialization ============

    /**
     * @notice Initialize the contract (for proxy pattern)
     * @param _owner The owner address
     * @param _lendingToken The token used for lending
     * @param _registry The credit registry address
     */
    function initialize(
        address _owner,
        address _lendingToken,
        address _registry
    ) external initializer {
        __Ownable_init(_owner);
        __ReentrancyGuard_init();
        __Pausable_init();

        require(_lendingToken != address(0), "CreditVault: zero lending token");
        require(_registry != address(0), "CreditVault: zero registry");

        lendingToken = IERC20(_lendingToken);
        registry = ICreditRegistry(_registry);

        // Set default loan tiers
        _setDefaultTiers();
    }

    // ============ Lender Functions ============

    /**
     * @notice Deposit liquidity into the vault
     * @param amount The amount to deposit
     */
    function depositLiquidity(uint256 amount) external override nonReentrant whenNotPaused {
        require(amount > 0, "CreditVault: zero amount");

        lendingToken.safeTransferFrom(msg.sender, address(this), amount);
        
        lenderDeposits[msg.sender] += amount;
        totalDeposited += amount;

        emit LiquidityDeposited(msg.sender, amount);
    }

    /**
     * @notice Withdraw liquidity from the vault
     * @param amount The amount to withdraw
     */
    function withdrawLiquidity(uint256 amount) external override nonReentrant {
        require(amount > 0, "CreditVault: zero amount");
        require(lenderDeposits[msg.sender] >= amount, "CreditVault: insufficient deposit");
        require(getAvailableLiquidity() >= amount, "CreditVault: insufficient liquidity");

        lenderDeposits[msg.sender] -= amount;
        totalDeposited -= amount;

        lendingToken.safeTransfer(msg.sender, amount);

        emit LiquidityWithdrawn(msg.sender, amount);
    }

    // ============ Borrower Functions ============

    /**
     * @notice Request a loan using GhostScore proof
     * @param ghostProof The ZK proof of credit score
     * @param publicInputs Public inputs for proof verification
     * @param amount The requested loan amount
     * @return loanId The ID of the created loan
     */
    function requestLoan(
        bytes calldata ghostProof,
        bytes32[] calldata publicInputs,
        uint256 amount
    ) external payable override nonReentrant whenNotPaused returns (uint256 loanId) {
        // Verify ZK proof if verifier is set
        if (ghostScoreVerifier != address(0)) {
            // Call verifier.verifyAndAttest(ghostProof, publicInputs)
            // For hackathon, we'll skip this and use score directly from registry
        }

        // Get user's credit score from registry
        // Note: In production with full ZK, the score would be proven via the proof
        // For hackathon demo, we read from registry (user calls from their address)
        uint256 userScore = registry.getMyScore();
        
        return _createLoan(msg.sender, amount, userScore, msg.value);
    }

    /**
     * @notice Request a loan using plain score (for demo without ZK)
     * @param amount The requested loan amount
     * @return loanId The ID of the created loan
     */
    function requestLoanSimple(uint256 amount) external payable override nonReentrant whenNotPaused returns (uint256 loanId) {
        uint256 userScore = registry.getMyScore();
        return _createLoan(msg.sender, amount, userScore, msg.value);
    }

    /**
     * @notice Internal function to create a loan
     */
    function _createLoan(
        address borrower,
        uint256 amount,
        uint256 userScore,
        uint256 collateralProvided
    ) internal returns (uint256 loanId) {
        require(amount > 0, "CreditVault: zero amount");
        require(getAvailableLiquidity() >= amount, "CreditVault: insufficient liquidity");

        // Get loan tier for user's score
        LoanTier memory tier = getLoanTierForScore(userScore);
        require(tier.maxAmount > 0, "CreditVault: no tier available");
        require(amount <= tier.maxAmount, "CreditVault: exceeds max amount");

        // Calculate required collateral
        uint256 requiredCollateral = (amount * tier.collateralBps) / BPS_DENOMINATOR;
        require(collateralProvided >= requiredCollateral, "CreditVault: insufficient collateral");

        // Create loan
        loanId = totalLoans++;
        
        loans[loanId] = Loan({
            borrower: borrower,
            amount: amount,
            interestRate: tier.interestBps,
            startTime: block.timestamp,
            duration: tier.durationDays * 1 days,
            repaid: 0,
            collateral: collateralProvided,
            status: LoanStatus.ACTIVE
        });

        borrowerLoanIds[borrower].push(loanId);
        totalBorrowed += amount;

        // Transfer loan amount to borrower
        lendingToken.safeTransfer(borrower, amount);

        emit LoanIssued(
            loanId,
            borrower,
            amount,
            tier.interestBps,
            requiredCollateral,
            tier.durationDays * 1 days
        );
    }

    /**
     * @notice Repay a loan (partial or full)
     * @param loanId The loan ID to repay
     * @param amount The repayment amount
     */
    function repayLoan(uint256 loanId, uint256 amount) external override nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.borrower == msg.sender, "CreditVault: not borrower");
        require(loan.status == LoanStatus.ACTIVE, "CreditVault: loan not active");
        require(amount > 0, "CreditVault: zero amount");

        // Calculate total owed (principal + interest)
        uint256 interest = (loan.amount * loan.interestRate) / BPS_DENOMINATOR;
        uint256 totalOwed = loan.amount + interest;
        uint256 remaining = totalOwed - loan.repaid;

        // Cap repayment at remaining amount
        if (amount > remaining) {
            amount = remaining;
        }

        // Transfer repayment
        lendingToken.safeTransferFrom(msg.sender, address(this), amount);
        loan.repaid += amount;

        // Check if fully repaid
        if (loan.repaid >= totalOwed) {
            loan.status = LoanStatus.REPAID;
            totalBorrowed -= loan.amount;

            // Return collateral
            if (loan.collateral > 0) {
                payable(loan.borrower).transfer(loan.collateral);
            }

            // Register credit event for repayment (highest weight action)
            if (interceptor != address(0)) {
                // The interceptor will call registry.registerCreditEvent
                // For simplicity in hackathon, we call registry directly
            }
            registry.registerCreditEvent(msg.sender, ICreditRegistry.ActionType.REPAY, amount);
        }

        emit LoanRepaid(loanId, msg.sender, amount, totalOwed - loan.repaid);
    }

    /**
     * @notice Liquidate a defaulted loan
     * @param loanId The loan ID to liquidate
     */
    function liquidate(uint256 loanId) external override nonReentrant {
        Loan storage loan = loans[loanId];
        require(loan.status == LoanStatus.ACTIVE, "CreditVault: loan not active");
        
        // Check if loan is past due + grace period
        uint256 deadline = loan.startTime + loan.duration + GRACE_PERIOD;
        require(block.timestamp > deadline, "CreditVault: loan not defaulted");

        // Calculate outstanding
        uint256 interest = (loan.amount * loan.interestRate) / BPS_DENOMINATOR;
        uint256 totalOwed = loan.amount + interest;
        uint256 outstanding = totalOwed - loan.repaid;

        // Mark as defaulted
        loan.status = LoanStatus.DEFAULTED;
        totalBorrowed -= (loan.amount - loan.repaid);

        // Seize collateral (liquidator receives a portion as incentive)
        uint256 collateralToSeize = loan.collateral;
        uint256 liquidatorReward = collateralToSeize / 10; // 10% to liquidator
        
        if (liquidatorReward > 0) {
            payable(msg.sender).transfer(liquidatorReward);
        }
        
        // Remaining collateral goes to vault
        uint256 vaultShare = collateralToSeize - liquidatorReward;
        // ETH stays in contract

        emit LoanDefaulted(loanId, loan.borrower, collateralToSeize);
    }

    // ============ View Functions ============

    /**
     * @notice Get loan details
     * @param loanId The loan ID
     * @return The loan struct
     */
    function getLoan(uint256 loanId) external view override returns (Loan memory) {
        return loans[loanId];
    }

    /**
     * @notice Get loan tier for a score
     * @param score The credit score
     * @return tier The applicable loan tier
     */
    function getLoanTierForScore(uint256 score) public view override returns (LoanTier memory tier) {
        // Find highest tier threshold that user qualifies for
        uint256 bestThreshold = 0;
        
        for (uint256 i = 0; i < tierThresholds.length; i++) {
            if (score >= tierThresholds[i] && tierThresholds[i] >= bestThreshold) {
                bestThreshold = tierThresholds[i];
            }
        }

        return tiers[bestThreshold];
    }

    /**
     * @notice Get available liquidity in the vault
     * @return The available amount
     */
    function getAvailableLiquidity() public view override returns (uint256) {
        return totalDeposited - totalBorrowed;
    }

    /**
     * @notice Get total deposited in the vault
     * @return Total deposited amount
     */
    function getTotalDeposited() external view override returns (uint256) {
        return totalDeposited;
    }

    /**
     * @notice Get total borrowed from the vault
     * @return Total borrowed amount
     */
    function getTotalBorrowed() external view override returns (uint256) {
        return totalBorrowed;
    }

    /**
     * @notice Get lender's deposited amount
     * @param lender The lender address
     * @return Deposited amount
     */
    function getLenderDeposit(address lender) external view override returns (uint256) {
        return lenderDeposits[lender];
    }

    /**
     * @notice Get borrower's active loan IDs
     * @param borrower The borrower address
     * @return Array of loan IDs
     */
    function getBorrowerLoans(address borrower) external view override returns (uint256[] memory) {
        return borrowerLoanIds[borrower];
    }

    // ============ Admin Functions ============

    /**
     * @notice Set a loan tier
     * @param tier The tier configuration
     */
    function setTier(LoanTier calldata tier) external override onlyOwner {
        require(tier.maxAmount > 0, "CreditVault: invalid max amount");
        
        // Check if threshold already exists
        bool exists = false;
        for (uint256 i = 0; i < tierThresholds.length; i++) {
            if (tierThresholds[i] == tier.scoreThreshold) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            tierThresholds.push(tier.scoreThreshold);
        }

        tiers[tier.scoreThreshold] = tier;
        emit TierUpdated(tier.scoreThreshold, tier);
    }

    /**
     * @notice Set the GhostScore verifier address
     * @param verifier The verifier address
     */
    function setGhostScoreVerifier(address verifier) external override onlyOwner {
        address oldVerifier = ghostScoreVerifier;
        ghostScoreVerifier = verifier;
        emit GhostScoreVerifierUpdated(oldVerifier, verifier);
    }

    /**
     * @notice Set the credit interceptor for repayment events
     * @param _interceptor The interceptor address
     */
    function setInterceptor(address _interceptor) external override onlyOwner {
        interceptor = _interceptor;
    }

    /**
     * @notice Pause the vault
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the vault
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ============ Internal Functions ============

    /**
     * @notice Set default loan tiers matching the plan
     * @dev Tiers: Newcomer (0-100), Builder (100-300), Trusted (300-600), Elite (600+)
     */
    function _setDefaultTiers() internal {
        // Newcomer tier: 0-99 score
        tierThresholds.push(0);
        tiers[0] = LoanTier({
            scoreThreshold: 0,
            maxAmount: 100 * 1e18,      // $100 max
            interestBps: 2000,           // 20% interest
            durationDays: 7,             // 7 days
            collateralBps: 15000         // 150% collateral (overcollateralized)
        });

        // Builder tier: 100-299 score
        tierThresholds.push(100);
        tiers[100] = LoanTier({
            scoreThreshold: 100,
            maxAmount: 500 * 1e18,       // $500 max
            interestBps: 1500,           // 15% interest
            durationDays: 14,            // 14 days
            collateralBps: 10000         // 100% collateral
        });

        // Trusted tier: 300-599 score
        tierThresholds.push(300);
        tiers[300] = LoanTier({
            scoreThreshold: 300,
            maxAmount: 2000 * 1e18,      // $2000 max
            interestBps: 1000,           // 10% interest
            durationDays: 30,            // 30 days
            collateralBps: 5000          // 50% collateral (undercollateralized!)
        });

        // Elite tier: 600+ score
        tierThresholds.push(600);
        tiers[600] = LoanTier({
            scoreThreshold: 600,
            maxAmount: 10000 * 1e18,     // $10,000 max
            interestBps: 500,            // 5% interest
            durationDays: 90,            // 90 days
            collateralBps: 3000          // 30% collateral (highly undercollateralized!)
        });
    }

    // ============ Receive ETH ============

    receive() external payable {}
}
