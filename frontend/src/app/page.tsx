"use client";

import LandingPage from "@/components/landing/LandingPage";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";

export default function Home() {
  const router = useRouter();
  const { isConnected } = useWallet();

  return (
    <LandingPage
      onEnter={() => {
        if (isConnected) router.push("/dashboard");
      }}
    />
  );
}
