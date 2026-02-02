import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatNumber(value: bigint | number | string, decimals: number = 18): string {
  const num = typeof value === "bigint" ? Number(value) / 10 ** decimals : Number(value);
  if (num === 0) return "0";
  if (num < 0.01) return "<0.01";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getTierForScore(score: number): string {
  if (score >= 600) return "Elite";
  if (score >= 300) return "Trusted";
  if (score >= 100) return "Builder";
  return "Newcomer";
}

export function getTierColor(score: number): string {
  if (score >= 600) return "text-amber-400";
  if (score >= 300) return "text-green-400";
  if (score >= 100) return "text-yellow-400";
  return "text-red-400";
}
