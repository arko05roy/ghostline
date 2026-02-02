// Contract addresses and ABIs for CreditNet Protocol
// All contracts deployed on Creditcoin Testnet (Chain ID: 102031)

import { Address } from "viem";

// ============ Contract Addresses ============

export const CONTRACT_ADDRESSES = {
  // Core Infrastructure
  creditChainFactory: "0x15FF2fB78633Ce5fE6B129325938cA0F5414F2A6" as Address,
  crossChainBridge: "0xD84AaBb64c6a835acB4CE8aB4C0b685331115DF6" as Address,
  mockCTC: "0x53D6eBdCEB537DCC1e675E4e314dc5dCFe0B4708" as Address,

  // Implementation Contracts (for cloning)
  registryImpl: "0x12399B328754637f8b92EdfaE281B79eECC107d9" as Address,
  interceptorImpl: "0xF694b3FB6AB97b08539DCA1F446B1eC6541064B8" as Address,
  vaultImpl: "0x3605Ab0331b0810C362F3A42EC999F0bf8D7D980" as Address,
  verifierImpl: "0x8d96dbAdd6B4317EBC8Dbc79975f860d66fb8c8f" as Address,
  nftImpl: "0x3DaDa53ec4835B8a84470c05C75EE3059e016bF9" as Address,

  // Demo AppChain (Ghostline Demo)
  // Note: Update these addresses after deploying an appchain via the factory
  demoAppChain: {
    chainId: 0, // Update after deployment
    registry: "0x0000000000000000000000000000000000000180" as Address, // Placeholder - update after deployment
    interceptor: "0x425F17C99f87d70b3fC92c4C2FE1f3D4c946e58A" as Address,
    vault: "0x5928523cB07ac22572df28e8a6f9c62Fd7e7Cf4B" as Address,
    verifier: "0xAAB41ca208595EdfCA97dD71CFd7F986F377c2B0" as Address,
    nft: "0x039602a303924B38d979c2657F8bf2231Afdb869" as Address,
  },
} as const;

// ============ ABIs ============

// ERC20 ABI (for token operations)
export const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "allowance", type: "uint256" },
      { internalType: "uint256", name: "needed", type: "uint256" },
    ],
    name: "ERC20InsufficientAllowance",
    type: "error",
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "uint256", name: "balance", type: "uint256" },
      { internalType: "uint256", name: "needed", type: "uint256" },
    ],
    name: "ERC20InsufficientBalance",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "address", name: "spender", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Approval",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// CreditRegistry ABI
export const CreditRegistryABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "enum ICreditRegistry.ActionType", name: "actionType", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "pointsEarned", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "CreditEventRecorded",
    type: "event",
  },
  {
    inputs: [],
    name: "getMyScore",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getMyCreditHistory",
    outputs: [
      {
        components: [
          { internalType: "address", name: "user", type: "address" },
          { internalType: "enum ICreditRegistry.ActionType", name: "actionType", type: "uint8" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "uint256", name: "pointsEarned", type: "uint256" },
        ],
        internalType: "struct ICreditRegistry.CreditEvent[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getCreditEventCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalCreditEvents",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "enum ICreditRegistry.ActionType", name: "actionType", type: "uint8" }],
    name: "getActionWeight",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// CreditInterceptor ABI
export const CreditInterceptorABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "tokenIn", type: "address" },
      { indexed: true, internalType: "address", name: "tokenOut", type: "address" },
      { indexed: false, internalType: "uint256", name: "amountIn", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amountOut", type: "uint256" },
    ],
    name: "SwapIntercepted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "token", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "LendIntercepted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "StakeIntercepted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: true, internalType: "address", name: "token", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "TransferIntercepted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: true, internalType: "address", name: "token0", type: "address" },
      { indexed: true, internalType: "address", name: "token1", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount0", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "amount1", type: "uint256" },
    ],
    name: "LiquidityProvided",
    type: "event",
  },
  {
    inputs: [
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      { internalType: "uint256", name: "minAmountOut", type: "uint256" },
    ],
    name: "interceptSwap",
    outputs: [{ internalType: "uint256", name: "amountOut", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "interceptLend",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "interceptStake",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "interceptTransfer",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "token0", type: "address" },
      { internalType: "address", name: "token1", type: "address" },
      { internalType: "uint256", name: "amount0", type: "uint256" },
      { internalType: "uint256", name: "amount1", type: "uint256" },
    ],
    name: "interceptProvideLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// CreditVault ABI
export const CreditVaultABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "lender", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "LiquidityDeposited",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "loanId", type: "uint256" },
      { indexed: true, internalType: "address", name: "borrower", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "interestRate", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "collateralRequired", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "duration", type: "uint256" },
    ],
    name: "LoanIssued",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "loanId", type: "uint256" },
      { indexed: true, internalType: "address", name: "borrower", type: "address" },
      { indexed: false, internalType: "uint256", name: "amount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "remaining", type: "uint256" },
    ],
    name: "LoanRepaid",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "depositLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "withdrawLiquidity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "bytes", name: "ghostProof", type: "bytes" },
      { internalType: "bytes32[]", name: "publicInputs", type: "bytes32[]" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "requestLoan",
    outputs: [{ internalType: "uint256", name: "loanId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "requestLoanSimple",
    outputs: [{ internalType: "uint256", name: "loanId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "loanId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "repayLoan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "loanId", type: "uint256" }],
    name: "getLoan",
    outputs: [
      {
        components: [
          { internalType: "address", name: "borrower", type: "address" },
          { internalType: "uint256", name: "amount", type: "uint256" },
          { internalType: "uint256", name: "interestRate", type: "uint256" },
          { internalType: "uint256", name: "startTime", type: "uint256" },
          { internalType: "uint256", name: "duration", type: "uint256" },
          { internalType: "uint256", name: "repaid", type: "uint256" },
          { internalType: "uint256", name: "collateral", type: "uint256" },
          { internalType: "enum ICreditVault.LoanStatus", name: "status", type: "uint8" },
        ],
        internalType: "struct ICreditVault.Loan",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "score", type: "uint256" }],
    name: "getLoanTierForScore",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "scoreThreshold", type: "uint256" },
          { internalType: "uint256", name: "maxAmount", type: "uint256" },
          { internalType: "uint256", name: "interestBps", type: "uint256" },
          { internalType: "uint256", name: "durationDays", type: "uint256" },
          { internalType: "uint256", name: "collateralBps", type: "uint256" },
        ],
        internalType: "struct ICreditVault.LoanTier",
        name: "tier",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAvailableLiquidity",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalDeposited",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalBorrowed",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "lender", type: "address" }],
    name: "getLenderDeposit",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "borrower", type: "address" }],
    name: "getBorrowerLoans",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// GhostScoreVerifier ABI
export const GhostScoreVerifierABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "userCommitment", type: "bytes32" },
      { indexed: false, internalType: "uint256", name: "scoreThreshold", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    name: "GhostScoreVerified",
    type: "event",
  },
  {
    inputs: [
      { internalType: "bytes", name: "proof", type: "bytes" },
      { internalType: "bytes32[]", name: "publicInputs", type: "bytes32[]" },
    ],
    name: "verifyAndAttest",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "getAttestation",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "scoreThreshold", type: "uint256" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "valid", type: "bool" },
        ],
        internalType: "struct IGhostScoreVerifier.GhostScoreAttestation",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getAttestationCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "uint256", name: "minThreshold", type: "uint256" }],
    name: "hasValidAttestation",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// CreditNFT ABI
export const CreditNFTABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
      { indexed: false, internalType: "string", name: "tier", type: "string" },
      { indexed: false, internalType: "uint256", name: "score", type: "uint256" },
    ],
    name: "BadgeMinted",
    type: "event",
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "getBadge",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "scoreAtMint", type: "uint256" },
          { internalType: "string", name: "tier", type: "string" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
        ],
        internalType: "struct ICreditNFT.CreditBadge",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getHighestBadge",
    outputs: [
      { internalType: "string", name: "tier", type: "string" },
      { internalType: "uint256", name: "score", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// CreditChainFactory ABI
export const CreditChainFactoryABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "chainId", type: "uint256" },
      { indexed: true, internalType: "address", name: "admin", type: "address" },
      { indexed: false, internalType: "string", name: "name", type: "string" },
      { indexed: false, internalType: "address", name: "registry", type: "address" },
      { indexed: false, internalType: "address", name: "interceptor", type: "address" },
      { indexed: false, internalType: "address", name: "vault", type: "address" },
      { indexed: false, internalType: "address", name: "verifier", type: "address" },
      { indexed: false, internalType: "address", name: "nft", type: "address" },
    ],
    name: "AppChainDeployed",
    type: "event",
  },
  {
    inputs: [{ internalType: "string", name: "name", type: "string" }],
    name: "deployAppChainSimple",
    outputs: [{ internalType: "uint256", name: "chainId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "chainId", type: "uint256" }],
    name: "getAppChain",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "id", type: "uint256" },
          { internalType: "address", name: "admin", type: "address" },
          { internalType: "string", name: "name", type: "string" },
          { internalType: "address", name: "registry", type: "address" },
          { internalType: "address", name: "interceptor", type: "address" },
          { internalType: "address", name: "vault", type: "address" },
          { internalType: "address", name: "verifier", type: "address" },
          { internalType: "address", name: "nft", type: "address" },
          { internalType: "bool", name: "allowCrossChainScores", type: "bool" },
          { internalType: "uint256", name: "minScoreForLoan", type: "uint256" },
          { internalType: "uint256", name: "createdAt", type: "uint256" },
          { internalType: "bool", name: "active", type: "bool" },
        ],
        internalType: "struct ICreditChainFactory.AppChain",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAppChainCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "admin", type: "address" }],
    name: "getAppChainsByAdmin",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// CrossChainBridge ABI
export const CrossChainBridgeABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "fromChainId", type: "uint256" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "scoreThreshold", type: "uint256" },
      { indexed: false, internalType: "bytes32", name: "exportHash", type: "bytes32" },
    ],
    name: "ScoreExported",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "fromChainId", type: "uint256" },
      { indexed: true, internalType: "uint256", name: "toChainId", type: "uint256" },
      { indexed: true, internalType: "address", name: "user", type: "address" },
      { indexed: false, internalType: "uint256", name: "adjustedScore", type: "uint256" },
    ],
    name: "ScoreImported",
    type: "event",
  },
  {
    inputs: [{ internalType: "uint256", name: "fromChainId", type: "uint256" }],
    name: "exportScore",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "fromChainId", type: "uint256" },
          { internalType: "address", name: "user", type: "address" },
          { internalType: "uint256", name: "scoreThreshold", type: "uint256" },
          { internalType: "bytes", name: "proof", type: "bytes" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bytes32", name: "exportHash", type: "bytes32" },
        ],
        internalType: "struct ICrossChainBridge.ScoreExport",
        name: "scoreExport",
        type: "tuple",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "toChainId", type: "uint256" },
      {
        components: [
          { internalType: "uint256", name: "fromChainId", type: "uint256" },
          { internalType: "address", name: "user", type: "address" },
          { internalType: "uint256", name: "scoreThreshold", type: "uint256" },
          { internalType: "bytes", name: "proof", type: "bytes" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bytes32", name: "exportHash", type: "bytes32" },
        ],
        internalType: "struct ICrossChainBridge.ScoreExport",
        name: "exportData",
        type: "tuple",
      },
    ],
    name: "importScore",
    outputs: [{ internalType: "bool", name: "success", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "fromChainId", type: "uint256" },
      { internalType: "uint256", name: "toChainId", type: "uint256" },
    ],
    name: "getBridgeWeight",
    outputs: [{ internalType: "uint256", name: "weightBps", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "user", type: "address" }],
    name: "getUserExports",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "fromChainId", type: "uint256" },
          { internalType: "address", name: "user", type: "address" },
          { internalType: "uint256", name: "scoreThreshold", type: "uint256" },
          { internalType: "bytes", name: "proof", type: "bytes" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bytes32", name: "exportHash", type: "bytes32" },
        ],
        internalType: "struct ICrossChainBridge.ScoreExport[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ActionType enum values
export enum ActionType {
  SWAP = 0,
  LEND = 1,
  REPAY = 2,
  STAKE = 3,
  TRANSFER = 4,
  PROVIDE_LIQUIDITY = 5,
}

// LoanStatus enum values
export enum LoanStatus {
  ACTIVE = 0,
  REPAID = 1,
  DEFAULTED = 2,
}
