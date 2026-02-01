"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Badge } from "@/components/ui/badge";

export function Header() {
    const { isConnected, chain } = useAccount();

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm px-6">
            {/* Page title area - will be set by each page */}
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-white" id="page-title">
                    Dashboard
                </h1>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                {/* Network indicator */}
                {isConnected && chain && (
                    <Badge variant="info" className="hidden sm:flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                        {chain.name}
                    </Badge>
                )}

                {/* Wallet connect */}
                <ConnectButton
                    chainStatus="icon"
                    showBalance={false}
                    accountStatus={{
                        smallScreen: "avatar",
                        largeScreen: "full",
                    }}
                />
            </div>
        </header>
    );
}
