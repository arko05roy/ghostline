import { formatUnits } from "ethers";

export function shortenAddress(addr: string, chars = 4) {
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}

export function formatCTC(wei: bigint, decimals = 18, dp = 4) {
  const str = formatUnits(wei, decimals);
  const [int, frac = ""] = str.split(".");
  return `${int}.${frac.slice(0, dp)}`;
}

export function getTierInfo(score: number) {
  if (score >= 600) return { name: "Elite", color: "#FFD700", bg: "rgba(255,215,0,0.08)" };
  if (score >= 300) return { name: "Trusted", color: "#C0C0C0", bg: "rgba(192,192,192,0.08)" };
  if (score >= 100) return { name: "Builder", color: "#CD7F32", bg: "rgba(205,127,50,0.08)" };
  return { name: "Newcomer", color: "#6B7280", bg: "rgba(107,114,128,0.08)" };
}

export const ACTION_TYPES = [
  { id: 0, name: "SWAP", weight: 10, icon: "swap" },
  { id: 1, name: "LEND", weight: 25, icon: "lend" },
  { id: 2, name: "REPAY", weight: 50, icon: "repay" },
  { id: 3, name: "STAKE", weight: 20, icon: "stake" },
  { id: 4, name: "TRANSFER", weight: 5, icon: "transfer" },
  { id: 5, name: "PROVIDE_LIQUIDITY", weight: 30, icon: "liquidity" },
] as const;

export function getActionName(type: number) {
  return ACTION_TYPES[type]?.name ?? "UNKNOWN";
}

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}
