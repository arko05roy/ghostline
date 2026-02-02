"use client";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-[#1a1a1a] rounded ${className}`}
    />
  );
}

export function ScoreSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[240px] h-[240px] rounded-full bg-[#0a0a0a] border border-[#1a1a1a] animate-pulse" />
      <div className="h-4 w-24 bg-[#1a1a1a] rounded animate-pulse" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6 animate-pulse">
      <div className="h-4 w-32 bg-[#1a1a1a] rounded mb-4" />
      <div className="h-8 w-48 bg-[#1a1a1a] rounded mb-2" />
      <div className="h-3 w-24 bg-[#1a1a1a] rounded" />
    </div>
  );
}
