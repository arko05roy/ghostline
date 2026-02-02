import { useAccount, useReadContract, useWatchContractEvent } from "wagmi";
import { CreditRegistryABI, CONTRACT_ADDRESSES } from "@/lib/contracts";
import { useQueryClient } from "@tanstack/react-query";

export function useCreditScore(registryAddress: `0x${string}`) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const { data: score, refetch } = useReadContract({
    address: registryAddress,
    abi: CreditRegistryABI,
    functionName: "getMyScore",
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Watch for new credit events
  useWatchContractEvent({
    address: registryAddress,
    abi: CreditRegistryABI,
    eventName: "CreditEventRecorded",
    onLogs(logs) {
      // Refetch score when new event is recorded
      refetch();
      queryClient.invalidateQueries({ queryKey: ["creditHistory"] });
    },
  });

  return {
    score: score ? Number(score) : 0,
    isLoading: false,
  };
}

export function useCreditHistory(registryAddress: `0x${string}`) {
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const { data: history, refetch } = useReadContract({
    address: registryAddress,
    abi: CreditRegistryABI,
    functionName: "getMyCreditHistory",
    query: {
      enabled: isConnected && !!address,
    },
  });

  // Watch for new credit events
  useWatchContractEvent({
    address: registryAddress,
    abi: CreditRegistryABI,
    eventName: "CreditEventRecorded",
    onLogs(logs) {
      refetch();
    },
  });

  return {
    history: history || [],
    isLoading: false,
  };
}
