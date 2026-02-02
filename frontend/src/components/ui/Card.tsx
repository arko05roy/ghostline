"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: string;
}

export default function Card({ children, className, hover = false, glow }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.01, borderColor: glow || "rgba(0,255,136,0.2)" } : undefined}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-6",
        hover && "cursor-pointer transition-shadow hover:shadow-[0_0_30px_rgba(0,255,136,0.04)]",
        className
      )}
      style={glow ? { borderColor: `${glow}15` } : undefined}
    >
      {children}
    </motion.div>
  );
}
