"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/Button";
import { formatAddress } from "@/lib/utils";
import { Wallet } from "lucide-react";

export function Header() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = () => {
    if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  return (
    <header className="hidden lg:flex h-16 bg-slate-900 border-b border-slate-800 items-center justify-between px-6 fixed top-0 right-0 left-64 z-10">
      <div className="flex items-center gap-4">
        {/* Network indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-300">Creditcoin Testnet</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isConnected && address ? (
          <>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
              <Wallet className="w-4 h-4 text-slate-400" />
              <span className="text-sm font-mono text-slate-300">{formatAddress(address)}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => disconnect()}>
              Disconnect
            </Button>
          </>
        ) : (
          <Button onClick={handleConnect} size="sm">
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
      </div>
    </header>
  );
}
