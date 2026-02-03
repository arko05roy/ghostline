"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "@/hooks/useWallet";
import AppChainSelector from "@/components/ui/AppChainSelector";

const TABS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "universal", label: "Universal", href: "/universal" },
  { id: "actions", label: "DeFi Actions", href: "/actions" },
  { id: "vault", label: "Vault", href: "/vault" },
  { id: "bridge", label: "Bridge", href: "/bridge" },
  { id: "factory", label: "Factory", href: "/factory" },
  { id: "zkproof", label: "ZK Proof", href: "/zkproof" },
];

export default function Navbar() {
  const { isConnected } = useWallet();
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[#111]">
      <div className="bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00FF88]/20 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-black" />
              </div>
              <span className="font-bold text-white tracking-tight text-lg">
                ghost<span className="text-[#00FF88]">line</span>
              </span>
            </Link>

            {/* Nav tabs */}
            {isConnected && (
              <nav className="hidden md:flex items-center gap-1">
                {TABS.map((tab) => (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className={`px-3 py-1.5 text-xs font-mono rounded-md transition-all duration-200 ${
                      pathname === tab.href
                        ? "text-[#00FF88] bg-[#00FF88]/8"
                        : "text-[#666] hover:text-[#aaa] hover:bg-[#111]"
                    }`}
                  >
                    {tab.label}
                  </Link>
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
                        <AppChainSelector />
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
