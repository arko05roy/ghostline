// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ICreditVault
 * @notice Interface for the CreditVault - undercollateralized lending vault
 * @dev Accepts GhostScore ZK proofs for loan eligibility
 */
interface ICreditVault {
    // ============ Enums ============

    enum LoanStatus {
        ACTIVE,
        REPAID,
        DEFAULTED
    }

    // ============ Structs ============

    struct Loan {
        address borrower;
        uint256 amount;
        uint256 interestRate;     // in basis points (100 = 1%)
        uint256 startTime;
        uint256 duration;         // in seconds
        uint256 repaid;
        uint256 collateral;
        LoanStatus status;
    }

    struct LoanTier {
        uint256 scoreThreshold;   // minimum score required
        uint256 maxAmount;        // maximum loan amount
        uint256 interestBps;      // interest rate in basis points
        uint256 durationDays;     // loan duration in days
        uint256 collateralBps;    // required collateral in basis points (10000 = 100%)
    }

    // ============ Events ============

    event LiquidityDeposited(address indexed lender, uint256 amount);
    event LiquidityWithdrawn(address indexed lender, uint256 amount);
    
    event LoanIssued(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 interestRate,
        uint256 collateralRequired,
        uint256 duration
    );
    
    event LoanRepaid(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 amount,
        uint256 remaining
    );
    
    event LoanDefaulted(
        uint256 indexed loanId,
        address indexed borrower,
        uint256 collateralSeized
    );

    event TierUpdated(uint256 indexed scoreThreshold, LoanTier tier);
    event GhostScoreVerifierUpdated(address indexed oldVerifier, address indexed newVerifier);

    // ============ Lender Functions ============

    /**
     * @notice Deposit liquidity into the vault
     * @param amount The amount to deposit
     */
    function depositLiquidity(uint256 amount) external;

    /**
     * @notice Withdraw liquidity from the vault
     * @param amount The amount to withdraw
     */
    function withdrawLiquidity(uint256 amount) external;

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
    ) external payable returns (uint256 loanId);

    /**
     * @notice Request a loan using plain score (for demo without ZK)
     * @param amount The requested loan amount
     * @return loanId The ID of the created loan
     * @dev This is a simplified version for hackathon demo
     */
    function requestLoanSimple(uint256 amount) external payable returns (uint256 loanId);

    /**
     * @notice Repay a loan (partial or full)
     * @param loanId The loan ID to repay
     * @param amount The repayment amount
     */
    function repayLoan(uint256 loanId, uint256 amount) external;

    /**
     * @notice Liquidate a defaulted loan
     * @param loanId The loan ID to liquidate
     */
    function liquidate(uint256 loanId) external;

    // ============ View Functions ============

    /**
     * @notice Get loan details
     * @param loanId The loan ID
     * @return The loan struct
     */
    function getLoan(uint256 loanId) external view returns (Loan memory);

    /**
     * @notice Get loan tier for a score
     * @param score The credit score
     * @return The applicable loan tier
     */
    function getLoanTierForScore(uint256 score) external view returns (LoanTier memory);

    /**
     * @notice Get available liquidity in the vault
     * @return The available amount
     */
    function getAvailableLiquidity() external view returns (uint256);

    /**
     * @notice Get total deposited in the vault
     * @return Total deposited amount
     */
    function getTotalDeposited() external view returns (uint256);

    /**
     * @notice Get total borrowed from the vault
     * @return Total borrowed amount
     */
    function getTotalBorrowed() external view returns (uint256);

    /**
     * @notice Get lender's deposited amount
     * @param lender The lender address
     * @return Deposited amount
     */
    function getLenderDeposit(address lender) external view returns (uint256);

    /**
     * @notice Get borrower's active loan IDs
     * @param borrower The borrower address
     * @return Array of loan IDs
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory);

    // ============ Admin Functions ============

    /**
     * @notice Set a loan tier
     * @param tier The tier configuration
     */
    function setTier(LoanTier calldata tier) external;

    /**
     * @notice Set the GhostScore verifier address
     * @param verifier The verifier address
     */
    function setGhostScoreVerifier(address verifier) external;

    /**
     * @notice Set the credit interceptor for repayment events
     * @param interceptor The interceptor address
     */
    function setInterceptor(address interceptor) external;

    /**
     * @notice Initialize the contract (for proxy pattern)
     * @param owner The owner address
     * @param lendingToken The token used for lending
     * @param registry The credit registry address
     */
    function initialize(
        address owner,
        address lendingToken,
        address registry
    ) external;
}
