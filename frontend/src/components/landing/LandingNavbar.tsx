"use client";

import { useWallet } from "@/hooks/useWallet";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Button from "@/components/ui/Button";

interface LandingNavbarProps {
    onEnterApp: () => void;
}

export default function LandingNavbar({ onEnterApp }: LandingNavbarProps) {
    const { isConnected } = useWallet();

    return (
        <nav className="fixed top-0 inset-x-0 z-50 h-20 flex items-center justify-between px-6 md:px-12 bg-transparent backdrop-blur-sm">
            {/* Logo */}
            <div
                className="flex items-center gap-2 group cursor-pointer"
                onClick={onEnterApp}
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00FF88] to-[#00FF88]/20 flex items-center justify-center shadow-[0_0_15px_rgba(0,255,136,0.3)]">
                    <div className="w-3.5 h-3.5 rounded-full bg-black" />
                </div>
                <span className="font-bold text-white tracking-tight text-xl">
                    ghost<span className="text-[#00FF88]">line</span>
                </span>
            </div>

            {/* Right Actions - using original ConnectButton logic */}
            <div className="flex items-center gap-4">
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

                        if (!ready) {
                            return null;
                        }

                        if (!connected) {
                            return (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="rounded-full px-6"
                                    onClick={openConnectModal}
                                >
                                    Connect Wallet
                                </Button>
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
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={openChainModal}
                                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#888] border border-[#222] rounded-lg hover:border-[#444] hover:text-white transition-all bg-black/50"
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
                                    className="px-3 py-1.5 text-xs font-mono text-[#888] border border-[#222] rounded-lg hover:border-[#444] hover:text-white transition-all bg-black/50"
                                >
                                    {account.displayName}
                                </button>
                            </div>
                        );
                    }}
                </ConnectButton.Custom>
            </div>
        </nav>
    );
}
