import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format an address to show first 6 and last 4 characters
 */
export function formatAddress(address: string): string {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a number with commas
 */
export function formatNumber(num: number | bigint): string {
    return num.toLocaleString();
}

/**
 * Format ETH/CTC value from wei
 */
export function formatEther(wei: bigint, decimals: number = 4): string {
    const value = Number(wei) / 1e18;
    return value.toFixed(decimals);
}

/**
 * Get tier name from score
 */
export function getTierFromScore(score: number): {
    name: string;
    color: string;
    nextThreshold: number;
} {
    if (score >= 600) {
        return { name: "Elite", color: "#FFD700", nextThreshold: 1000 };
    }
    if (score >= 300) {
        return { name: "Trusted", color: "#C0C0C0", nextThreshold: 600 };
    }
    if (score >= 100) {
        return { name: "Builder", color: "#CD7F32", nextThreshold: 300 };
    }
    return { name: "Newcomer", color: "#6B7280", nextThreshold: 100 };
}

/**
 * Get action type name
 */
export function getActionTypeName(actionType: number): string {
    const types = ["Swap", "Lend", "Repay", "Stake", "Transfer", "Provide Liquidity"];
    return types[actionType] || "Unknown";
}

/**
 * Calculate percentage progress to next tier
 */
export function calculateTierProgress(score: number): number {
    const tier = getTierFromScore(score);

    if (score >= 600) return 100; // Elite is max

    const thresholds = [0, 100, 300, 600];
    const currentThresholdIndex = thresholds.findIndex(t => score < t) - 1;
    const currentThreshold = thresholds[Math.max(0, currentThresholdIndex)];
    const nextThreshold = tier.nextThreshold;

    return Math.min(100, ((score - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
}

/**
 * Format timestamp to relative time
 */
export function formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp * 1000;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
}
