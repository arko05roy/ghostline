import { creditcoinTestnet } from "./wagmi-config";

// Contract addresses - update after deployment
export const CONTRACTS = {
    // Factory and bridge (singleton contracts)
    creditChainFactory: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    crossChainBridge: "0x0000000000000000000000000000000000000000" as `0x${string}`,

    // Demo appchain contracts (will be set after deployment)
    demoAppChain: {
        registry: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        interceptor: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        vault: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        verifier: "0x0000000000000000000000000000000000000000" as `0x${string}`,
        nft: "0x0000000000000000000000000000000000000000" as `0x${string}`,
    },

    // Mock token for testing
    mockCTC: "0x0000000000000000000000000000000000000000" as `0x${string}`,
} as const;

// Chain ID for contract deployment
export const CHAIN_ID = creditcoinTestnet.id;

// CreditRegistry ABI (minimal for frontend)
export const CreditRegistryABI = [
    {
        name: "getMyScore",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "getMyCreditHistory",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "tuple[]",
                components: [
                    { name: "user", type: "address" },
                    { name: "actionType", type: "uint8" },
                    { name: "amount", type: "uint256" },
                    { name: "timestamp", type: "uint256" },
                    { name: "pointsEarned", type: "uint256" },
                ],
            },
        ],
    },
    {
        name: "getCreditEventCount",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "getTotalCreditEvents",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "getScoreCommitment",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ name: "", type: "bytes32" }],
    },
    {
        name: "getActionWeight",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "actionType", type: "uint8" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "MAX_SCORE",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "CreditEventRecorded",
        type: "event",
        inputs: [
            { name: "user", type: "address", indexed: true },
            { name: "actionType", type: "uint8", indexed: false },
            { name: "amount", type: "uint256", indexed: false },
            { name: "pointsEarned", type: "uint256", indexed: false },
            { name: "timestamp", type: "uint256", indexed: false },
        ],
    },
] as const;

// CreditInterceptor ABI (minimal for frontend)
export const CreditInterceptorABI = [
    {
        name: "interceptSwap",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "tokenIn", type: "address" },
            { name: "tokenOut", type: "address" },
            { name: "amountIn", type: "uint256" },
            { name: "minAmountOut", type: "uint256" },
            { name: "deadline", type: "uint256" },
        ],
        outputs: [{ name: "amountOut", type: "uint256" }],
    },
    {
        name: "interceptLend",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
    },
    {
        name: "interceptStake",
        type: "function",
        stateMutability: "payable",
        inputs: [{ name: "amount", type: "uint256" }],
        outputs: [],
    },
    {
        name: "interceptProvideLiquidity",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "token", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
    },
    {
        name: "CreditActionExecuted",
        type: "event",
        inputs: [
            { name: "user", type: "address", indexed: true },
            { name: "actionType", type: "uint8", indexed: false },
            { name: "amount", type: "uint256", indexed: false },
            { name: "timestamp", type: "uint256", indexed: false },
        ],
    },
] as const;

// CreditVault ABI (minimal for frontend)
export const CreditVaultABI = [
    {
        name: "deposit",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "amount", type: "uint256" }],
        outputs: [],
    },
    {
        name: "requestLoan",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "amount", type: "uint256" },
            { name: "collateralAmount", type: "uint256" },
        ],
        outputs: [{ name: "loanId", type: "uint256" }],
    },
    {
        name: "repay",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "loanId", type: "uint256" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [],
    },
    {
        name: "getUserLoans",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ name: "", type: "uint256[]" }],
    },
    {
        name: "getLoan",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "loanId", type: "uint256" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "id", type: "uint256" },
                    { name: "borrower", type: "address" },
                    { name: "principal", type: "uint256" },
                    { name: "collateral", type: "uint256" },
                    { name: "interestBps", type: "uint256" },
                    { name: "startTime", type: "uint256" },
                    { name: "duration", type: "uint256" },
                    { name: "repaid", type: "uint256" },
                    { name: "active", type: "bool" },
                    { name: "scoreAtBorrow", type: "uint256" },
                ],
            },
        ],
    },
    {
        name: "getLoanTierForScore",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "score", type: "uint256" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "scoreThreshold", type: "uint256" },
                    { name: "maxAmount", type: "uint256" },
                    { name: "interestBps", type: "uint256" },
                    { name: "collateralBps", type: "uint256" },
                    { name: "name", type: "string" },
                ],
            },
        ],
    },
    {
        name: "totalDeposits",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "totalBorrowed",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "LoanRequested",
        type: "event",
        inputs: [
            { name: "loanId", type: "uint256", indexed: true },
            { name: "borrower", type: "address", indexed: true },
            { name: "principal", type: "uint256", indexed: false },
            { name: "collateral", type: "uint256", indexed: false },
            { name: "interestBps", type: "uint256", indexed: false },
        ],
    },
] as const;

// GhostScoreVerifier ABI
export const GhostScoreVerifierABI = [
    {
        name: "verifyAndAttest",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "proof", type: "bytes" },
            { name: "publicInputs", type: "bytes32[]" },
            { name: "scoreThreshold", type: "uint256" },
        ],
        outputs: [],
    },
    {
        name: "getAttestation",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "user", type: "address" },
                    { name: "scoreThreshold", type: "uint256" },
                    { name: "timestamp", type: "uint256" },
                    { name: "proofHash", type: "bytes32" },
                    { name: "valid", type: "bool" },
                ],
            },
        ],
    },
    {
        name: "mockMode",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "bool" }],
    },
] as const;

// CreditNFT ABI
export const CreditNFTABI = [
    {
        name: "tokenURI",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [{ name: "", type: "string" }],
    },
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "owner", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "getBadge",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "scoreAtMint", type: "uint256" },
                    { name: "tier", type: "string" },
                    { name: "timestamp", type: "uint256" },
                ],
            },
        ],
    },
] as const;

// ERC20 ABI (for token approvals)
export const ERC20ABI = [
    {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        name: "allowance",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "symbol",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
    },
    {
        name: "decimals",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint8" }],
    },
] as const;
