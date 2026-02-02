import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "gradient";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-slate-800 border border-slate-700",
      glass: "glass border border-slate-700/50",
      gradient: "bg-gradient-to-br from-slate-800 to-slate-900 border border-amber-500/20",
    };

    return (
      <div
        ref={ref}
        className={cn("rounded-xl p-6 shadow-lg", variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
