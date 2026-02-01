"use client";

import { useAccount, useReadContract, useReadContracts, useWatchContractEvent } from "wagmi";
import { CONTRACTS, CreditRegistryABI } from "@/lib/contracts";
import { CreditEvent } from "@/lib/types";
import { useState, useEffect } from "react";

export function useCreditScore() {
    const { address, isConnected } = useAccount();

    const { data: score, refetch: refetchScore } = useReadContract({
        address: CONTRACTS.demoAppChain.registry,
        abi: CreditRegistryABI,
        functionName: "getMyScore",
        query: {
            enabled: isConnected && !!address,
        },
    });

    // Watch for new credit events to trigger refetch
    useWatchContractEvent({
        address: CONTRACTS.demoAppChain.registry,
        abi: CreditRegistryABI,
        eventName: "CreditEventRecorded",
        onLogs: (logs) => {
            // Check if any event is for the current user
            const userEvents = logs.filter(
                (log) => (log.args as any)?.user?.toLowerCase() === address?.toLowerCase()
            );
            if (userEvents.length > 0) {
                refetchScore();
            }
        },
    });

    return {
        score: score !== undefined ? Number(score) : 0,
        isLoading: score === undefined && isConnected,
        refetch: refetchScore,
    };
}

export function useCreditHistory() {
    const { address, isConnected } = useAccount();

    const { data: history, refetch } = useReadContract({
        address: CONTRACTS.demoAppChain.registry,
        abi: CreditRegistryABI,
        functionName: "getMyCreditHistory",
        query: {
            enabled: isConnected && !!address,
        },
    });

    // Transform the data to our CreditEvent type
    const events: CreditEvent[] = history
        ? (history as any[]).map((event) => ({
            user: event.user,
            actionType: event.actionType,
            amount: event.amount,
            timestamp: event.timestamp,
            pointsEarned: event.pointsEarned,
        }))
        : [];

    // Sort by timestamp descending (most recent first)
    const sortedEvents = [...events].sort(
        (a, b) => Number(b.timestamp) - Number(a.timestamp)
    );

    return {
        events: sortedEvents,
        totalEvents: events.length,
        isLoading: !history && isConnected,
        refetch,
    };
}

export function useCreditStats() {
    const { address, isConnected } = useAccount();

    const { data, refetch } = useReadContracts({
        contracts: [
            {
                address: CONTRACTS.demoAppChain.registry,
                abi: CreditRegistryABI,
                functionName: "getCreditEventCount",
                args: [address as `0x${string}`],
            },
            {
                address: CONTRACTS.demoAppChain.registry,
                abi: CreditRegistryABI,
                functionName: "getTotalCreditEvents",
            },
            {
                address: CONTRACTS.demoAppChain.registry,
                abi: CreditRegistryABI,
                functionName: "MAX_SCORE",
            },
        ],
        query: {
            enabled: isConnected && !!address,
        },
    });

    return {
        userEventCount: data?.[0]?.result ? Number(data[0].result) : 0,
        totalNetworkEvents: data?.[1]?.result ? Number(data[1].result) : 0,
        maxScore: data?.[2]?.result ? Number(data[2].result) : 1000,
        isLoading: !data && isConnected,
        refetch,
    };
}

export function useActionWeights() {
    const { data } = useReadContracts({
        contracts: [0, 1, 2, 3, 4, 5].map((actionType) => ({
            address: CONTRACTS.demoAppChain.registry,
            abi: CreditRegistryABI,
            functionName: "getActionWeight",
            args: [actionType],
        })),
    });

    const weights = data?.map((result) =>
        result.result ? Number(result.result) : 0
    ) ?? [10, 25, 50, 20, 5, 30]; // Default weights if not available

    return { weights };
}
