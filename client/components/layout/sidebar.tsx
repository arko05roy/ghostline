"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Zap,
    Shield,
    Landmark,
    Activity,
    Wallet,
} from "lucide-react";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/actions", label: "Build Credit", icon: Zap },
    { href: "/ghostscore", label: "GhostScore", icon: Shield },
    { href: "/vault", label: "Vault", icon: Landmark },
    { href: "/activity", label: "Activity", icon: Activity },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-800 bg-gray-950">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-gray-800 px-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500">
                    <Wallet className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white">CreditNet</span>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 p-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-cyan-500/10 text-cyan-400"
                                    : "text-gray-400 hover:bg-gray-800/50 hover:text-white"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "text-cyan-400")} />
                            {item.label}
                            {isActive && (
                                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-cyan-400" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom section */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 p-4">
                <div className="rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-4 border border-cyan-500/20">
                    <p className="text-xs text-gray-400 mb-1">Powered by</p>
                    <p className="text-sm font-medium text-white">Creditcoin Network</p>
                </div>
            </div>
        </aside>
    );
}
