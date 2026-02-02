"use client";

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "relative font-mono tracking-wide transition-all duration-200 rounded-lg border",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        // Sizes
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-5 py-2.5 text-sm",
        size === "lg" && "px-7 py-3.5 text-base",
        // Variants
        variant === "primary" &&
          "bg-[#00FF88]/10 border-[#00FF88]/30 text-[#00FF88] hover:bg-[#00FF88]/20 hover:border-[#00FF88]/50 hover:shadow-[0_0_20px_rgba(0,255,136,0.1)]",
        variant === "secondary" &&
          "bg-[#111] border-[#333] text-[#aaa] hover:bg-[#1a1a1a] hover:border-[#444] hover:text-white",
        variant === "ghost" &&
          "bg-transparent border-transparent text-[#888] hover:text-white hover:bg-[#111]",
        variant === "danger" &&
          "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50",
        className
      )}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? "opacity-0" : ""}>{children}</span>
    </button>
  );
}
