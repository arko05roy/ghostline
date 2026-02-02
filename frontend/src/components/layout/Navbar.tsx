"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "@/hooks/useWallet";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "actions", label: "DeFi Actions" },
  { id: "vault", label: "Vault" },
  { id: "bridge", label: "Bridge" },
  { id: "factory", label: "Factory" },
  { id: "zkproof", label: "ZK Proof" },
];

export default function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const { isConnected } = useWallet();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#111]">
      <div className="bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => setActiveTab("landing")}
              className="flex items-center gap-2 group"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00FF88]/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-black" />
              </div>
              <span className="font-bold text-white tracking-tight text-lg">
                ghost<span className="text-[#00FF88]">line</span>
              </span>
            </button>

            {/* Nav tabs */}
            {isConnected && (
              <nav className="hidden md:flex items-center gap-1">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all duration-200 ${
                      activeTab === tab.id
                        ? "text-[#00FF88] bg-[#00FF88]/8"
                        : "text-[#666] hover:text-[#aaa] hover:bg-[#111]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {/* RainbowKit Connect Button */}
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none" as const,
                      userSelect: "none" as const,
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          className="px-5 py-2 text-sm font-mono bg-[#00FF88]/10 border border-[#00FF88]/30 text-[#00FF88] rounded-lg hover:bg-[#00FF88]/20 hover:border-[#00FF88]/50 transition-all hover:shadow-[0_0_20px_rgba(0,255,136,0.1)]"
                        >
                          Connect Wallet
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          className="px-4 py-2 text-xs font-mono bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20"
                        >
                          Wrong Network
                        </button>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={openChainModal}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#555] border border-[#1a1a1a] rounded-lg hover:border-[#333] hover:text-[#888] transition-all"
                        >
                          {chain.hasIcon && chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain"}
                              src={chain.iconUrl}
                              className="w-3 h-3 rounded-full"
                            />
                          )}
                          {chain.name}
                        </button>
                        <button
                          onClick={openAccountModal}
                          className="px-3 py-1.5 text-xs font-mono text-[#888] border border-[#222] rounded-lg hover:border-[#444] hover:text-white transition-all"
                        >
                          {account.displayName}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </header>
  );
}
