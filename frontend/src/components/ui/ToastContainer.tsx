"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/useToast";

export default function ToastContainer() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-auto"
          >
            <div
              onClick={() => dismiss(t.id)}
              className={`
                flex items-center gap-3 px-5 py-3 rounded-lg border cursor-pointer
                backdrop-blur-xl font-mono text-sm
                ${t.type === "pending" ? "border-[#FFB800]/30 bg-[#FFB800]/5 text-[#FFB800]" : ""}
                ${t.type === "success" ? "border-[#00FF88]/30 bg-[#00FF88]/5 text-[#00FF88]" : ""}
                ${t.type === "error" ? "border-red-500/30 bg-red-500/5 text-red-400" : ""}
              `}
            >
              {t.type === "pending" && (
                <div className="w-4 h-4 border-2 border-[#FFB800] border-t-transparent rounded-full animate-spin" />
              )}
              {t.type === "success" && <span>&#10003;</span>}
              {t.type === "error" && <span>&#10007;</span>}
              <span>{t.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
