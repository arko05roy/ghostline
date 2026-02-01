// Credit event types
export enum ActionType {
    SWAP = 0,
    LEND = 1,
    REPAY = 2,
    STAKE = 3,
    TRANSFER = 4,
    PROVIDE_LIQUIDITY = 5,
}

export interface CreditEvent {
    user: `0x${string}`;
    actionType: ActionType;
    amount: bigint;
    timestamp: bigint;
    pointsEarned: bigint;
}

// Loan types
export interface Loan {
    id: bigint;
    borrower: `0x${string}`;
    principal: bigint;
    collateral: bigint;
    interestBps: bigint;
    startTime: bigint;
    duration: bigint;
    repaid: bigint;
    active: boolean;
    scoreAtBorrow: bigint;
}

export interface LoanTier {
    scoreThreshold: bigint;
    maxAmount: bigint;
    interestBps: bigint;
    collateralBps: bigint;
    name: string;
}

// GhostScore attestation
export interface GhostScoreAttestation {
    user: `0x${string}`;
    scoreThreshold: bigint;
    timestamp: bigint;
    proofHash: `0x${string}`;
    valid: boolean;
}

// Credit NFT badge
export interface CreditBadge {
    scoreAtMint: bigint;
    tier: string;
    timestamp: bigint;
}

// Tier info for display
export interface TierInfo {
    name: "Newcomer" | "Builder" | "Trusted" | "Elite";
    color: string;
    minScore: number;
    maxScore: number;
    description: string;
}

export const TIERS: TierInfo[] = [
    {
        name: "Newcomer",
        color: "#6B7280",
        minScore: 0,
        maxScore: 99,
        description: "Just getting started",
    },
    {
        name: "Builder",
        color: "#CD7F32",
        minScore: 100,
        maxScore: 299,
        description: "Building credit history",
    },
    {
        name: "Trusted",
        color: "#C0C0C0",
        minScore: 300,
        maxScore: 599,
        description: "Established creditworthiness",
    },
    {
        name: "Elite",
        color: "#FFD700",
        minScore: 600,
        maxScore: 1000,
        description: "Top-tier credit status",
    },
];

// Action info for display
export interface ActionInfo {
    type: ActionType;
    name: string;
    description: string;
    icon: string;
    color: string;
    defaultWeight: number;
}

export const ACTIONS: ActionInfo[] = [
    {
        type: ActionType.SWAP,
        name: "Swap Tokens",
        description: "Exchange one token for another",
        icon: "ArrowLeftRight",
        color: "#3B82F6",
        defaultWeight: 10,
    },
    {
        type: ActionType.LEND,
        name: "Lend Assets",
        description: "Provide liquidity to lending pools",
        icon: "Landmark",
        color: "#10B981",
        defaultWeight: 25,
    },
    {
        type: ActionType.REPAY,
        name: "Repay Loan",
        description: "Pay back borrowed funds",
        icon: "CheckCircle",
        color: "#8B5CF6",
        defaultWeight: 50,
    },
    {
        type: ActionType.STAKE,
        name: "Stake CTC",
        description: "Lock tokens for rewards",
        icon: "Lock",
        color: "#F59E0B",
        defaultWeight: 20,
    },
    {
        type: ActionType.TRANSFER,
        name: "Transfer",
        description: "Send tokens to another address",
        icon: "Send",
        color: "#EC4899",
        defaultWeight: 5,
    },
    {
        type: ActionType.PROVIDE_LIQUIDITY,
        name: "Provide Liquidity",
        description: "Add funds to liquidity pools",
        icon: "Droplets",
        color: "#06B6D4",
        defaultWeight: 30,
    },
];

// Vault stats
export interface VaultStats {
    totalDeposits: bigint;
    totalBorrowed: bigint;
    availableLiquidity: bigint;
    utilizationRate: number;
}

// Network stats
export interface NetworkStats {
    totalUsers: number;
    totalCreditEvents: number;
    totalLoans: number;
    totalRepaid: bigint;
    defaultRate: number;
}
