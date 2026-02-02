"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Zap,
  Shield,
  Wallet,
  Network,
  Plus,
} from "lucide-react";

const navItems = [
  { href: "/app", label: "Appchains", icon: Network },
  { href: "/app/deploy", label: "Deploy", icon: Plus },
  { href: "/app/network", label: "Network", icon: Network },
  { href: "/app/bridge", label: "Bridge", icon: Network },
];

interface SidebarProps {
  chainId?: string;
}

export function Sidebar({ chainId }: SidebarProps) {
  const pathname = usePathname();

  // Extract chainId from pathname if not provided
  const extractedChainId = chainId || (pathname?.match(/\/app\/(\d+)/)?.[1]);

  const chainNavItems = extractedChainId
    ? [
        { href: `/app/${extractedChainId}`, label: "Dashboard", icon: LayoutDashboard },
        { href: `/app/${extractedChainId}/build`, label: "Build Credit", icon: Zap },
        { href: `/app/${extractedChainId}/ghostscore`, label: "GhostScore", icon: Shield },
        { href: `/app/${extractedChainId}/vault`, label: "Vault", icon: Wallet },
      ]
    : [];

  const allItems = extractedChainId ? chainNavItems : navItems;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold gradient-text">CreditNet</h1>
        <p className="text-xs text-slate-500 mt-1">Protocol</p>
      </div>
      <nav className="p-4 space-y-1">
        {allItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

