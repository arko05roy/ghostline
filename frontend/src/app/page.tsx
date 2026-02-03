"use client";

import "@rainbow-me/rainbowkit/styles.css";

import { useState } from "react";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { config } from "@/config/wagmi";
import { useWallet } from "@/hooks/useWallet";
import { ToastProvider } from "@/hooks/useToast";
import ToastContainer from "@/components/ui/ToastContainer";
import Navbar from "@/components/layout/Navbar";
import LandingPage from "@/components/landing/LandingPage";
import DashboardPage from "@/components/dashboard/DashboardPage";
import ActionsPage from "@/components/actions/ActionsPage";
import VaultPage from "@/components/vault/VaultPage";
import BridgePage from "@/components/bridge/BridgePage";
import FactoryPage from "@/components/factory/FactoryPage";
import ZKProofPage from "@/components/zkproof/ZKProofPage";
import UniversalDashboard from "@/components/universal/UniversalDashboard";

const queryClient = new QueryClient();

function AppContent() {
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState("landing");

  const showLanding = activeTab === "landing";

  const renderPage = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardPage />;
      case "universal":
        return <UniversalDashboard />;
      case "actions":
        return <ActionsPage />;
      case "vault":
        return <VaultPage />;
      case "bridge":
        return <BridgePage />;
      case "factory":
        return <FactoryPage />;
      case "zkproof":
        return <ZKProofPage />;
      default:
        return null;
    }
  };

  if (showLanding) {
    return (
      <>
        <LandingPage
          onEnter={() => {
            if (isConnected) setActiveTab("dashboard");
          }}
        />
      </>
    );
  }

  return (
    <>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="pt-20 pb-12 px-6 max-w-7xl mx-auto min-h-screen">
        {/* Mobile nav */}
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
          {["dashboard", "universal", "actions", "vault", "bridge", "factory", "zkproof"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-mono rounded-md whitespace-nowrap transition-all ${activeTab === tab
                  ? "text-[#00FF88] bg-[#00FF88]/8 border border-[#00FF88]/20"
                  : "text-[#666] bg-[#111] border border-[#1a1a1a]"
                }`}
            >
              {tab === "zkproof" ? "ZK Proof" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        {renderPage()}
      </main>
    </>
  );
}

const ghostTheme = darkTheme({
  accentColor: "#00FF88",
  accentColorForeground: "black",
  borderRadius: "medium",
  fontStack: "system",
  overlayBlur: "small",
});

// Override RainbowKit dark backgrounds to match our full-black theme
ghostTheme.colors.modalBackground = "#0a0a0a";
ghostTheme.colors.profileForeground = "#0a0a0a";
ghostTheme.colors.connectButtonBackground = "#111";

export default function Home() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={ghostTheme} modalSize="compact">
          <ToastProvider>
            <AppContent />
            <ToastContainer />
          </ToastProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
