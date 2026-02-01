import { cn } from "@/lib/utils";
import { forwardRef } from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "success" | "warning" | "error" | "info" | "tier";
    tierColor?: string;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = "default", tierColor, children, ...props }, ref) => {
        const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";

        const variants = {
            default: "bg-gray-800 text-gray-300",
            success: "bg-green-500/20 text-green-400 border border-green-500/30",
            warning: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
            error: "bg-red-500/20 text-red-400 border border-red-500/30",
            info: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
            tier: "",
        };

        const tierStyle = variant === "tier" && tierColor
            ? { backgroundColor: `${tierColor}20`, color: tierColor, border: `1px solid ${tierColor}50` }
            : {};

        return (
            <span
                ref={ref}
                className={cn(baseStyles, variants[variant], className)}
                style={tierStyle}
                {...props}
            >
                {children}
            </span>
        );
    }
);

Badge.displayName = "Badge";
