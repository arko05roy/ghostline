"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppChain } from "@/hooks/useAppChain";

export default function AppChainSelector() {
  const { appChains, selectedChain, selectChain, loading } = useAppChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="px-3 py-1.5 text-xs font-mono text-[#555] border border-[#222] rounded-lg">
        Loading...
      </div>
    );
  }

  if (appChains.length === 0) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono border border-[#222] rounded-lg hover:border-[#444] transition-all"
      >
        <div className={`w-2 h-2 rounded-full ${selectedChain?.active ? "bg-[#00FF88]" : "bg-red-500"}`} />
        <span className="text-[#888]">Chain:</span>
        <span className="text-white">{selectedChain?.name || "Select"}</span>
        <span className="text-[#555]">#{selectedChain?.id}</span>
        <svg
          className={`w-3 h-3 text-[#555] transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 mt-2 w-64 bg-[#0a0a0a] border border-[#222] rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-[#222]">
              <span className="text-[10px] text-[#555] uppercase tracking-wider">Select AppChain</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {appChains.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => {
                    selectChain(chain.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2.5 flex items-center gap-3 hover:bg-[#111] transition-colors ${
                    selectedChain?.id === chain.id ? "bg-[#00FF88]/5" : ""
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${chain.active ? "bg-[#00FF88]" : "bg-red-500"}`} />
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white">{chain.name}</span>
                      <span className="text-[10px] text-[#555]">#{chain.id}</span>
                    </div>
                    <div className="text-[10px] text-[#444] font-mono truncate">
                      {chain.registry.slice(0, 10)}...{chain.registry.slice(-6)}
                    </div>
                  </div>
                  {selectedChain?.id === chain.id && (
                    <svg className="w-4 h-4 text-[#00FF88]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="px-3 py-2 border-t border-[#222] bg-[#050505]">
              <div className="text-[10px] text-[#444] font-mono">
                {appChains.length} appchain{appChains.length !== 1 ? "s" : ""} available
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
