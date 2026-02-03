"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

const TABS = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard" },
  { id: "universal", label: "Universal", href: "/universal" },
  { id: "actions", label: "DeFi Actions", href: "/actions" },
  { id: "vault", label: "Vault", href: "/vault" },
  { id: "bridge", label: "Bridge", href: "/bridge" },
  { id: "factory", label: "Factory", href: "/factory" },
  { id: "zkproof", label: "ZK Proof", href: "/zkproof" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-12 px-6 max-w-7xl mx-auto min-h-screen">
        {/* Mobile nav */}
        <div className="md:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
          {TABS.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-3 py-1.5 text-xs font-mono rounded-md whitespace-nowrap transition-all ${
                pathname === tab.href
                  ? "text-[#00FF88] bg-[#00FF88]/8 border border-[#00FF88]/20"
                  : "text-[#666] bg-[#111] border border-[#1a1a1a]"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
        {children}
      </main>
    </>
  );
}
