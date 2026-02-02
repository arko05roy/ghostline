import { creditcoinTestnet } from "./wagmi-config";

// Contract addresses - deployed on Creditcoin Testnet (Chain ID: 102031)
export const CONTRACTS = {
    // Factory and bridge (singleton contracts)
    creditChainFactory: "0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6" as `0x${string}`,
    crossChainBridge: "0xD84AaBb64c6a835acB4CE8aB4C0b685331115DF6" as `0x${string}`,

    // Implementation contracts (used by factory for cloning)
    implementations: {
        registry: "0x12399B328754637f8b92EdfaE281B79eECC107d9" as `0x${string}`,
        interceptor: "0xF694b3FB6AB97b08539DCA1F446B1eC6541064B8" as `0x${string}`,
        vault: "0x3605Ab0331b0810C362F3A42EC999F0bf8D7D980" as `0x${string}`,
        verifier: "0x8d96dbAdd6B4317EBC8Dbc79975f860d66fb8c8f" as `0x${string}`,
        nft: "0x3DaDa53ec4835B8a84470c05C75EE3059e016bF9" as `0x${string}`,
    },

    // Demo appchain contracts (Ghostline Demo - Chain ID: 0)
    demoAppChain: {
        registry: "0x0000000000000000000000000000000000000180" as `0x${string}`,
        interceptor: "0x425F17C99f87d70b3fC92c4C2FE1f3D4c946e58A" as `0x${string}`,
        vault: "0x5928523cB07ac22572df28e8a6f9c62Fd7e7Cf4B" as `0x${string}`,
        verifier: "0xAAB41ca208595EdfCA97dD71CFd7F986F377c2B0" as `0x${string}`,
        nft: "0x039602a303924B38d979c2657F8bf2231Afdb869" as `0x${string}`,
    },

    // Mock token for testing
    mockCTC: "0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708" as `0x${string}`,
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
        ],
        outputs: [{ name: "success", type: "bool" }],
    },
    {
        name: "getAttestation",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "user", type: "address" },
            { name: "index", type: "uint256" },
        ],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "scoreThreshold", type: "uint256" },
                    { name: "timestamp", type: "uint256" },
                    { name: "valid", type: "bool" },
                ],
            },
        ],
    },
    {
        name: "hasValidAttestation",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "user", type: "address" },
            { name: "minThreshold", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        name: "getAttestationCount",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "mockMode",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        name: "GhostScoreVerified",
        type: "event",
        inputs: [
            { name: "commitment", type: "bytes32", indexed: true },
            { name: "scoreThreshold", type: "uint256", indexed: false },
            { name: "timestamp", type: "uint256", indexed: false },
        ],
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

// CreditChainFactory ABI (for deploying appchains)
export const CreditChainFactoryABI = [
    {
        name: "deployAppChainSimple",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "appName", type: "string" }],
        outputs: [{ name: "chainId", type: "uint256" }],
    },
    {
        name: "getAppChain",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "chainId", type: "uint256" }],
        outputs: [
            {
                name: "",
                type: "tuple",
                components: [
                    { name: "chainId", type: "uint256" },
                    { name: "admin", type: "address" },
                    { name: "registry", type: "address" },
                    { name: "interceptor", type: "address" },
                    { name: "vault", type: "address" },
                    { name: "verifier", type: "address" },
                    { name: "nft", type: "address" },
                    { name: "lendingToken", type: "address" },
                    { name: "name", type: "string" },
                    { name: "active", type: "bool" },
                ],
            },
        ],
    },
    {
        name: "getAppChainCount",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "AppChainDeployed",
        type: "event",
        inputs: [
            { name: "chainId", type: "uint256", indexed: true },
            { name: "admin", type: "address", indexed: true },
            { name: "appName", type: "string", indexed: false },
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
